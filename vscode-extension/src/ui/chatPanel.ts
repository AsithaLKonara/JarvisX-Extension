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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; padding: 10px; box-sizing: border-box; background: #1e1e1e; color: #d4d4d4; }
        #output { flex-grow: 1; overflow-y: auto; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .thought { color: #6a9955; font-style: italic; margin-bottom: 10px; border-left: 2px solid #6a9955; padding-left: 10px; }
        .plan { color: #4fc1ff; margin-bottom: 10px; }
        .action { background: #333; padding: 8px; border-radius: 4px; margin-bottom: 5px; font-family: monospace; }
        textarea { width: 100%; height: 80px; background: #252526; color: white; border: 1px solid #454545; padding: 8px; border-radius: 4px; outline: none; }
        button { background: #007acc; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; margin-top: 10px; align-self: flex-end; }
        button:hover { background: #0062a3; }
      </style>
      <body>
        <div id="output"></div>
        <textarea id="prompt" placeholder="Message JarvisX..."></textarea>
        <button onclick="send()">Send</button>

        <script>
          const vscode = acquireVsCodeApi();
          const output = document.getElementById('output');
          const prompt = document.getElementById('prompt');

          async function send() {
            const text = prompt.value;
            prompt.value = '';
            
            const userMsg = document.createElement('div');
            userMsg.innerHTML = "<strong>User:</strong> " + text;
            output.appendChild(userMsg);

            const aiResponse = document.createElement('div');
            output.appendChild(aiResponse);
            
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
            let fullText = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\\n\\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.replace('data: ', '');
                  fullText += data;
                  
                  // Simple live rendering of structured data if it's JSON
                  try {
                    const parsed = JSON.parse(fullText);
                    aiResponse.innerHTML = "";
                    if (parsed.thought) aiResponse.innerHTML += \`<div class="thought">\${parsed.thought}</div>\`;
                    if (parsed.plan) aiResponse.innerHTML += \`<div class="plan">Plan: \${parsed.plan.join(' → ')}</div>\`;
                    if (parsed.actions) {
                      parsed.actions.forEach(a => {
                        aiResponse.innerHTML += \`<div class="action">\${a.type}: \${a.path || ''}</div>\`;
                      });
                    }
                  } catch (e) {
                    aiResponse.innerText = fullText;
                  }
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
