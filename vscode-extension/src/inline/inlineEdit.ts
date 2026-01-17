import * as vscode from "vscode";
import fetch from "node-fetch";

export async function inlineEdit() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;
  const code = editor.document.getText(selection);

  try {
    const response = await fetch("http://localhost:3333/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Edit the following code:\n${code}`
      })
    });

    const result = await response.json();
    const newCode = result.text;

    const originalUri = editor.document.uri;
    const modifiedUri = vscode.Uri.parse(
      `untitled:${originalUri.path}.ai`
    );

    // Create a temporary document for the diff
    const doc = await vscode.workspace.openTextDocument(modifiedUri);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(modifiedUri, new vscode.Position(0, 0), newCode);
    await vscode.workspace.applyEdit(edit);

    // Show the diff
    await vscode.commands.executeCommand(
      "vscode.diff",
      originalUri,
      modifiedUri,
      "AI Diff Preview"
    );

    // Approval Gate
    const action = await vscode.window.showInformationMessage(
      "JarvisX has suggested changes. Would you like to apply them?",
      "Apply",
      "Reject"
    );

    if (action === "Apply") {
      const edit = new vscode.WorkspaceEdit();
      const newText = (await vscode.workspace.openTextDocument(modifiedUri)).getText();
      edit.replace(originalUri, selection, newText);
      await vscode.workspace.applyEdit(edit);
      vscode.window.showInformationMessage("Changes applied.");
    }
  } catch (error) {
    vscode.window.showErrorMessage("Failed to perform AI inline edit. Is the AI Server running?");
  }
}
