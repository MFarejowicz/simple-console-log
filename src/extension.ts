import * as vscode from "vscode";

const patternArray = [/const (\w+) =/, /function (\w+)/, /class (\w_)/];

function getSpacesForEmpty(currentLine: vscode.TextLine, document: vscode.TextDocument) {
  if (currentLine.lineNumber === 0) {
    return 0;
  }

  let previousLineNumber = currentLine.lineNumber - 1;
  let previousLine = document.lineAt(previousLineNumber);

  while (previousLineNumber > 0 && previousLine.isEmptyOrWhitespace) {
    previousLineNumber -= 1;
    previousLine = document.lineAt(previousLineNumber);
  }

  return previousLine.firstNonWhitespaceCharacterIndex;
}

function getSpacesForNonEmpty(currentLine: vscode.TextLine) {
  if (currentLine.text.charAt(currentLine.text.length - 1) === "{") {
    return currentLine.firstNonWhitespaceCharacterIndex + 2;
  }

  return currentLine.firstNonWhitespaceCharacterIndex;
}

function checkIfMatch(lineContent: string) {
  for (const pattern of patternArray) {
    const res = pattern.exec(lineContent);
    if (res) {
      return res[1];
    }
  }

  return null;
}

function getBlockName(currentLine: vscode.TextLine, document: vscode.TextDocument): string | null {
  if (currentLine.lineNumber === 0) {
    return null;
  }

  let bracketCount = 0;
  let lineNumber = currentLine.lineNumber + 1;
  let lineContent = currentLine.text;
  while (bracketCount > -1 && lineNumber > 0) {
    lineNumber -= 1;
    lineContent = document.lineAt(lineNumber).text;
    if (lineContent.includes("}")) {
      bracketCount += 1;
    }
    if (lineContent.includes("{")) {
      bracketCount -= 1;
    }
  }

  const res = checkIfMatch(lineContent);
  if (res) {
    return res;
  } else if (lineNumber > 0) {
    return getBlockName(document.lineAt(lineNumber - 1), document);
  }
  return null;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let logCommand = vscode.commands.registerCommand("simple-console-log.logHere", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const splitDoc = document.fileName.split("/");
    const fileName = splitDoc[splitDoc.length - 1];
    const currPosition = editor.selection.active;
    const currLine = document.lineAt(currPosition);
    let insertPosition: vscode.Position;
    let spaces: number;
    let blockName: string | null;
    let logText: string;
    editor
      .edit((editBuilder) => {
        if (currLine.isEmptyOrWhitespace) {
          // insert at start of current line
          insertPosition = currPosition.with({ character: 0 });
          spaces = getSpacesForEmpty(currLine, document);
          blockName = getBlockName(currLine, document);
          logText = `${" ".repeat(spaces)}console.log("🅱️ - ${fileName}${
            blockName ? ` - ${blockName}` : ""
          } - line ${currLine.lineNumber + 1}");`;
          // delete any existing context on the line
          editBuilder.delete(document.lineAt(currPosition.line).range);
          // insert comment
          editBuilder.insert(insertPosition, logText);
        } else {
          // insert at start of next line
          insertPosition = currPosition.translate(1).with({ character: 0 });
          spaces = getSpacesForNonEmpty(currLine);
          blockName = getBlockName(currLine, document);
          // add new line at end of message to push down any content of line below
          logText = `${" ".repeat(spaces)}console.log("🅱️ - ${fileName}${
            blockName ? ` - ${blockName}` : ""
          } - line ${currLine.lineNumber + 2}");\n`;
          // insert comment
          editBuilder.insert(insertPosition, logText);
        }
      })
      .then(() => {
        const endPosition = insertPosition.with({ character: logText.length });
        editor.selection = new vscode.Selection(endPosition, endPosition);
      });
  });
  context.subscriptions.push(logCommand);
}
