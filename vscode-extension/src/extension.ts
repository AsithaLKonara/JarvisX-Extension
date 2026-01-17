import * as vscode from "vscode";
import { openChatPanel } from "./ui/chatPanel";
import { inlineEdit } from "./inline/inlineEdit";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "localCursor.openChat",
      openChatPanel
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "localCursor.inlineEdit",
      inlineEdit
    )
  );
}
