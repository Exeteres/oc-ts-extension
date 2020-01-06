import * as vscode from "vscode";
import { init, mount } from "./commands";

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand("oc-ts.init", init(context)),
        vscode.commands.registerCommand("oc-ts.mount", mount(context))
    );
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
