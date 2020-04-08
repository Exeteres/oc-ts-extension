import { init, mount, installClient } from "./commands";
import { stopListening, startListening } from "./debugger/server/listener";
import { commands, ExtensionContext, debug } from "vscode";
import { LuaConfigurationProvider } from "./debugger/server/luaConfigurationProvider";
import { LuaDebugAdapterFactory } from "./debugger/server/luaDebugAdapterFactory";

export function activate(context: ExtensionContext): void {
    context.subscriptions.push(
        commands.registerCommand("oc-ts.init", init(context)),
        commands.registerCommand("oc-ts.mount", mount()),
        commands.registerCommand("oc-ts.installClient", installClient()),
        debug.registerDebugConfigurationProvider("tsdbg", new LuaConfigurationProvider()),
        debug.registerDebugAdapterDescriptorFactory("tsdbg", new LuaDebugAdapterFactory())
    );
    startListening();
}

export function deactivate(): void {
    stopListening();
}
