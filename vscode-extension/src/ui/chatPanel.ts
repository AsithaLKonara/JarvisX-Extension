import * as vscode from "vscode";

export function openChatPanel() {
    const panel = vscode.window.createWebviewPanel(
        "localCursorChat",
        "Local AI",
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    panel.webview.html = `
    <html>
      <body>
        <textarea id="prompt" style="width: 100%; height: 100px;"></textarea>
        <button onclick="send()" style="margin-top: 10px;">Send</button>
        <pre id="output" style="margin-top: 20px; white-space: pre-wrap;"></pre>
        <script>
          const vscode = acquireVsCodeApi();
          function send() {
            vscode.postMessage({
              type: "prompt",
              value: document.getElementById("prompt").value
            });
          }

          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response') {
              document.getElementById('output').innerText = message.value;
            }
          });
        </script>
      </body>
    </html>
  `;
}
