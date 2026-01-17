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
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; padding: 10px; box-sizing: border-box; }
        #output { flex-grow: 1; overflow-y: auto; background: #1e1e1e; color: #d4d4d4; padding: 10px; border-radius: 4px; margin-bottom: 10px; white-space: pre-wrap; }
        textarea { width: 100%; height: 80px; background: #333; color: white; border: 1px solid #555; padding: 5px; }
        button { background: #007acc; color: white; border: none; padding: 10px; cursor: pointer; margin-top: 5px; }
      </style>
      <body>
        <div id="output"></div>
        <textarea id="prompt" placeholder="Ask local AI..."></textarea>
        <button onclick="send()">Send (Streaming)</button>
        <script>
          const vscode = acquireVsCodeApi();
          const output = document.getElementById('output');
          const prompt = document.getElementById('prompt');

          async function send() {
            const text = prompt.value;
            prompt.value = '';
            output.innerText += "\\nUser: " + text + "\\nAI: ";
            
            const response = await fetch("http://localhost:3333/chat", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-api-key": "local-dev-key-123"
              },
              body: JSON.stringify({ prompt: text, stream: true })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\\n\\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  output.innerText += line.replace('data: ', '');
                  output.scrollTop = output.scrollHeight;
                }
              }
            }
          }
        </script>
      </body>
    </html>
  `;
}
