// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function getSpaces(currentLine: vscode.TextLine, document: vscode.TextDocument) {
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "simple-console-log" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("simple-console-log.helloWorld", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello VSCode from simple-console-log!");
  });
  context.subscriptions.push(disposable);

  let logCommand = vscode.commands.registerCommand("simple-console-log.logHere", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    editor.edit((editBuilder) => {
      const currPosition = editor.selection.active;
      const currLine = document.lineAt(currPosition);
      let insertPosition: vscode.Position;
      let spaces: number;
      if (currLine.isEmptyOrWhitespace) {
        // insert in current line
        insertPosition = currPosition.with({ character: 0 });
        spaces = getSpaces(currLine, document);
      } else {
        // insert in next line
        insertPosition = currPosition.translate(1).with({ character: 0 });
        spaces = currLine.firstNonWhitespaceCharacterIndex;
      }
      editBuilder.insert(insertPosition, `${" ".repeat(spaces)}console.log("pog");\n`);
    });
    console.log(editor.selection.active);
  });
  context.subscriptions.push(logCommand);
}
