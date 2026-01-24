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
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; padding: 10px; box-sizing: border-box; background: #1e1e1e; color: #d4d4d4; }
          #output { flex-grow: 1; overflow-y: auto; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
          .thought { color: #6a9955; font-style: italic; margin-bottom: 20px; border-left: 2px solid #6a9955; padding-left: 10px; background: rgba(106, 153, 85, 0.05); padding: 10px; }
          .plan { color: #4fc1ff; margin-bottom: 15px; font-weight: bold; }
          .action { background: #333; padding: 10px; border-radius: 4px; margin-bottom: 8px; font-family: monospace; border: 1px solid #454545; }
          .spinner { border: 2px solid #333; border-top: 2px solid #007acc; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .thinking { color: #888; font-size: 0.9em; margin: 10px 0; }
          .approval-card { background: #2d2d2d; border: 1px solid #007acc; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #007acc; }
          .approval-header { font-weight: bold; margin-bottom: 10px; color: #007acc; }
          .diff { white-space: pre-wrap; background: #1a1a1a; padding: 8px; border-radius: 4px; font-size: 0.9em; margin: 10px 0; border: 1px solid #333; font-family: monospace; }
          .diff .added { color: #b5cea8; }
          .diff .removed { color: #ce9178; }
          .button-group { display: flex; gap: 10px; margin-top: 10px; }
          .btn-approve { background: #28a745; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 3px; }
          .btn-reject { background: #dc3545; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 3px; }
          textarea { width: 100%; height: 80px; background: #252526; color: white; border: 1px solid #454545; padding: 8px; border-radius: 4px; outline: none; resize: none; }
          #send-btn { background: #007acc; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; margin-top: 10px; align-self: flex-end; }
        </style>
      </head>
      <body>
        <div id="output"></div>
        <div id="approvals"></div>
        <textarea id="prompt" placeholder="Message JarvisX..."></textarea>
        <button id="send-btn">Send</button>

        <script>
          const vscode = acquireVsCodeApi();
          const output = document.getElementById('output');
          const approvalsDiv = document.getElementById('approvals');
          const prompt = document.getElementById('prompt');
          const sendBtn = document.getElementById('send-btn');

          function formatDiff(text) {
            return text.split('\n').map(line => {
              if (line.startsWith('+')) return '<span class="added">' + line + '</span>';
              if (line.startsWith('-')) return '<span class="removed">' + line + '</span>';
              return line;
            }).join('\n');
          }

          function tryParsePartialJSON(text) {
            const suffixes = ['', '}', ']}', '"}]}', '"]}]}'];
            for (const s of suffixes) {
                try { return JSON.parse(text + s); } catch (e) {}
            }
            return null;
          }

          async function checkApprovals() {
            try {
              const res = await fetch("http://localhost:3333/approvals/pending", {
                headers: { "x-api-key": "local-dev-key-123" }
              });
              const approvals = await res.json();
              
              approvalsDiv.innerHTML = "";
              approvals.forEach(app => {
                const card = document.createElement('div');
                card.className = "approval-card";
                card.innerHTML = \`
                  <div class="approval-header">Approval Required: \${app.type}</div>
                  <div>\${app.type === 'edit_file' ? 'Path: ' + app.payload.path : 'Command: ' + app.payload.command}</div>
                  \${app.payload.diff ? '<div class="diff">' + formatDiff(app.payload.diff) + '</div>' : ''}
                  <div class="button-group">
                    <button class="btn-approve" onclick="respond('\${app.id}', 'approved')">Approve</button>
                    <button class="btn-reject" onclick="respond('\${app.id}', 'rejected')">Reject</button>
                  </div>
                \`;
                approvalsDiv.appendChild(card);
              });
            } catch (e) {}
          }

          async function respond(id, decision) {
            await fetch("http://localhost:3333/approvals/respond", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-api-key": "local-dev-key-123"
              },
              body: JSON.stringify({ id, decision })
            });
            checkApprovals();
          }

          window.respond = respond;
          setInterval(checkApprovals, 2000);

          sendBtn.addEventListener('click', async () => {
            const text = prompt.value;
            prompt.value = '';
            
            const userMsg = document.createElement('div');
            userMsg.innerHTML = "<div style='margin-bottom: 10px;'><strong>User:</strong> " + text + "</div>";
            output.appendChild(userMsg);

            const aiResponse = document.createElement('div');
            const thinking = document.createElement('div');
            thinking.className = "thinking";
            thinking.innerHTML = '<div class="spinner"></div>Thinking...';
            output.appendChild(thinking);
            output.appendChild(aiResponse);
            output.scrollTop = output.scrollHeight;
            
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
              thinking.remove(); // Remove spinner on first chunk

              const chunk = decoder.decode(value);
              const lines = chunk.split('\\n\\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.replace('data: ', '');
                  fullText += data;
                  
                  const parsed = tryParsePartialJSON(fullText);
                  if (parsed) {
                    aiResponse.innerHTML = "";
                    if (parsed.thought) aiResponse.innerHTML += '<div class="thought">' + parsed.thought + '</div>';
                    if (parsed.plan) aiResponse.innerHTML += '<div class="plan">Plan: ' + parsed.plan.join(' → ') + '</div>';
                    if (parsed.actions) {
                      parsed.actions.forEach(a => {
                        aiResponse.innerHTML += '<div class="action">' + a.type + ': ' + (a.path || a.command || '') + '</div>';
                      });
                    }
                  } else {
                    aiResponse.innerText = fullText;
                  }
                  output.scrollTop = output.scrollHeight;
                }
              }
            }
          });
        </script>
      </body>
    </html>
  `;
}
