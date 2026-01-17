"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineEdit = inlineEdit;
const vscode = __importStar(require("vscode"));
const node_fetch_1 = __importDefault(require("node-fetch"));
async function inlineEdit() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const selection = editor.selection;
    const code = editor.document.getText(selection);
    try {
        const response = await (0, node_fetch_1.default)("http://localhost:3333/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: `Edit the following code:\n${code}`
            })
        });
        const result = await response.json();
        const newCode = result.text;
        const originalUri = editor.document.uri;
        const modifiedUri = vscode.Uri.parse(`untitled:${originalUri.path}.ai`);
        // Create a temporary document for the diff
        const doc = await vscode.workspace.openTextDocument(modifiedUri);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(modifiedUri, new vscode.Position(0, 0), newCode);
        await vscode.workspace.applyEdit(edit);
        // Show the diff
        await vscode.commands.executeCommand("vscode.diff", originalUri, modifiedUri, "AI Diff Preview");
    }
    catch (error) {
        vscode.window.showErrorMessage("Failed to perform AI inline edit. Is the AI Server running?");
    }
}
//# sourceMappingURL=inlineEdit.js.map