import * as vscode from "vscode";
import { tsoogle, tsoogleCmd } from "@stanimirovv/tsoogle";

let tsConfigFilePath = "";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "tsoogle-vs" is now active!');
  let disposableSearch = vscode.commands.registerCommand(
    "tsoogle.search",
    function () {
      const panel = vscode.window.createWebviewPanel(
        "form",
        "Tsoogle Search",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "submit":
              const text1 = message.tsConfigFilePath;
              tsConfigFilePath = text1;
              const query = message.query;
              // Handle the submitted text1 and text2
              vscode.window.showInformationMessage(
                `Searching: ${query} in ${tsConfigFilePath}`
              );

              const results = await tsoogle(tsConfigFilePath, query);
              let html = "<ul>";
              results.forEach((result: any, idx: any) => {
                html += `<li id="result-${idx}"><span style="color:BlanchedAlmond">${
                  result.fileName
                }</span>:<span>${
                  result.line
                }</span> <span style="color:DarkCyan">${
                  result.functionName
                }</span>(<span style="color:DodgerBlue">${result.paramString
                  .replace(/</g, "&lt;")
                  .replace(
                    />/g,
                    "&gt;"
                  )}</span>): <span style="color:DarkSeaGreen">${result.returnType
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")}</span></li>`;
              });
              html += "</ul>";

              panel.webview.html = getWebviewContent(html, results);
              break;
            case "openFile":
              const filePath = message.text;
              const line = message.line;
              const openPath = vscode.Uri.file(filePath);
              vscode.workspace.openTextDocument(openPath).then((doc) => {
                const lineNumber = parseInt(line) - 1;
                const lineRange = doc.lineAt(lineNumber).range;
                vscode.window.showTextDocument(doc, {
                  selection: lineRange,
                });
              });

              break;
          }
        },
        undefined,
        context.subscriptions
      );
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

export function deactivate() {}

function getWebviewContent(extraHtml = "", results: any = []) {
  return `
    <html>
      <head>
      </head>
      <body>
        <input type="text" id="tsConfigFilePath" placeholder="Absolute path to tsconfig.json" value="${tsConfigFilePath}"/>
        <input type="text" id="query" placeholder="Tsoogle Query"/>
        <button onclick="submitForm()">Submit</button>
        ${extraHtml}

        <script>
          const vscode = acquireVsCodeApi();
          ${results
            .map(
              (result: any, idx: number) => `
            document.getElementById('result-${idx}').addEventListener('click', () => {
              vscode.postMessage({command: 'openFile', text: '${result.fileName}', line: '${result.line}'});
            });
          `
            )
            .join("")}
      </script>
        <script>
          window.onload = () => {
            if(document.getElementById('tsConfigFilePath').value === '') {
              document.getElementById('tsConfigFilePath').focus();
            } else {
              document.getElementById('query').focus();
            }

            if (tsConfigFilePath !== '') {
              document.getElementById('tsConfigFilePath').value = "${tsConfigFilePath}";
            }
          };

          document.getElementById('tsConfigFilePath').addEventListener('keydown', handleEnterPress);
          document.getElementById('query').addEventListener('keydown', handleEnterPress);

          function handleEnterPress(event) {
            if(event.key === 'Enter') {
              submitForm();
            }
          }

          function submitForm() {
            const tsConfigFilePath = document.getElementById('tsConfigFilePath').value;
            const query = document.getElementById('query').value;
            vscode.postMessage({
              command: 'submit',
              tsConfigFilePath: tsConfigFilePath,
              query: query
            })
          }
        </script>
      </body>
    </html>
  `;
}
