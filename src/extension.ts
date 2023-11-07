// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { tsoogle } from "@stanimirovv/tsoogle";

let tsConfigFilePath = "";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "tsoogle-vs" is now active!');
  let disposableSearch = vscode.commands.registerCommand(
    "tsoogle.search",
    async () => {
      if (!tsConfigFilePath) {
        tsConfigFilePath =
          (await vscode.window.showInputBox({
            placeHolder: "Enter your project's tsconfig.json file path",
          })) || "";
      }

      const userQuery =
        (await vscode.window.showInputBox({
          placeHolder: "Enter your query",
        })) || "";

      const isInputValid = userQuery && tsConfigFilePath;
      if (!isInputValid) {
        vscode.window.showInformationMessage(
          "TSOOGLE: Invalid input. Please try again."
        );
        return;
      }
      const outputText = tsoogle(tsConfigFilePath, userQuery);

      const terminal = vscode.window.createTerminal(`Ext Terminal`);
      terminal.show(true);
      terminal.sendText(`echo -e "${outputText}"`, true);
    }
  );

  let disposableReset = vscode.commands.registerCommand(
    "tsoogle.reset",
    async () => {
      tsConfigFilePath = "";
      vscode.window.showInformationMessage(
        "TSOOGLE: Reset tsconfig.json file path"
      );
    }
  );

  context.subscriptions.push(disposableSearch);
  context.subscriptions.push(disposableReset);
}

// This method is called when your extension is deactivated
export function deactivate() {}
