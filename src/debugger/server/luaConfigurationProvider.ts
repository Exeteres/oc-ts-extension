import {
    DebugConfigurationProvider,
    WorkspaceFolder,
    DebugConfiguration,
    ProviderResult,
    window
} from "vscode";
import { Connection } from "./connection";

export class LuaConfigurationProvider implements DebugConfigurationProvider {
    public resolveDebugConfiguration(
        _: WorkspaceFolder | undefined,
        config: DebugConfiguration
    ): ProviderResult<DebugConfiguration> {
        if (!config.type && !config.request && !config.name) {
            const editor = window.activeTextEditor;
            if (editor) {
                config.type = "tsdbg";
                config.name = "Launch";
                config.request = "launch";
                config.program = "${file}";
            }
        }

        if (!config.outRoot.remote.endsWith("/")) {
            config.outRoot.remote += "/";
        }

        if (!config.outRoot.local.endsWith("/")) {
            config.outRoot.local += "/";
        }

        if (!config.program) {
            window.showErrorMessage("Cannot find a program to debug.");
            return undefined;
        }

        if (!Connection.hasConnection()) {
            window.showErrorMessage("Cannot find a connected debugger client.");
            return undefined;
        }

        return config;
    }
}
