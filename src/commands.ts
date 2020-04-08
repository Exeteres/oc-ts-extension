import { resolve, join, isAbsolute } from "path";
import { OKHandler } from "./navigation/navigationDirectory";
import {
    existsSync,
    readdirSync,
    statSync,
    symlinkSync,
    unlinkSync,
    rmdirSync,
    copyFileSync
} from "fs";
import {
    WorldNavigationDirectory,
    WorldNavigationOptions
} from "./navigation/worldNavigationDirectory";
import { homedir, platform } from "os";
import { NavigationRoot } from "./navigation/navigationRoot";
import { ExtensionContext, window, workspace } from "vscode";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandHandler = (...args: any[]) => any;

export function init(context: ExtensionContext): CommandHandler {
    return () => {
        // Resolve scripts path
        const ext = platform() === "win32" ? "bat" : "sh";
        const path = resolve(__dirname, "..", "scripts", `init.${ext}`);

        const terminal = window.createTerminal({
            name: "OC-TS Init",
            shellPath: path
        });

        terminal.show(true);

        context.subscriptions.push(terminal);
    };
}

const home = homedir();

function normalizePath(path: string): string {
    return isAbsolute(path) ? path : resolve(home, path);
}

function findDirectory(path: string): string | undefined {
    const normalized = normalizePath(path);
    return existsSync(normalized) ? normalized : undefined;
}

function showItems(options: WorldNavigationOptions, callback: OKHandler): void {
    const navigationRoot = new NavigationRoot();

    const config = workspace.getConfiguration();
    const paths = config.get<string[]>("oc-ts.paths") ?? [];
    paths.push("AppData\\Roaming\\.minecraft\\saves");

    const normalizedPaths = [...new Set(paths.map(normalizePath))];
    for (const dir of normalizedPaths) {
        if (!existsSync(dir)) {
            continue;
        }

        for (const save of readdirSync(dir)) {
            const path = join(dir, save);
            const stats = statSync(path);
            if (!stats.isDirectory()) {
                continue;
            }

            const ocDirectory = join(path, "opencomputers");
            if (!existsSync(ocDirectory)) {
                continue;
            }

            const name = `[save] ${save}`;
            const directory = new WorldNavigationDirectory(
                ocDirectory,
                save,
                name,
                options
            );
            navigationRoot.addDirectory(directory);
        }
    }

    const ocemu = findDirectory("AppData\\Roaming\\OCEmu");
    if (ocemu) {
        const name = `[emulator] OCEmu`;
        const directory = new WorldNavigationDirectory(ocemu, "OCEmu", name, options);
        navigationRoot.addDirectory(directory);
    }

    if (navigationRoot.empty) {
        window.showWarningMessage("No save or emulator was found.");
        return;
    }

    navigationRoot.showItems(callback);
}

export function mount(): CommandHandler {
    return () => {
        showItems({}, path => {
            const workspaces = workspace.workspaceFolders;
            if (!workspaces) {
                window.showErrorMessage("No active workspace was found.");
                return;
            }

            const root = workspaces[0].uri.fsPath;
            const distPath = join(root, "dist");

            // Remove link or directory if exists
            if (existsSync(distPath)) {
                const stats = statSync(distPath);
                if (stats.isDirectory()) {
                    rmdirSync(distPath);
                } else {
                    unlinkSync(distPath);
                }
            }

            // Create symlink
            symlinkSync(path, distPath, "junction");
            window.showInformationMessage("Link created successfully.");
        });
    };
}

export function installClient(): CommandHandler {
    return () => {
        showItems({ installClient: true }, path => {
            const clientPath = resolve(__dirname, "debugger/client/tsdbg.lua");
            const clientTargetPath = resolve(path, "bin/tsdbg.lua");
            copyFileSync(clientPath, clientTargetPath);

            const jsonPath = resolve(__dirname, "../static/json.lua");
            const jsonTargetPath = resolve(path, "lib/json.lua");

            if (!existsSync(jsonTargetPath)) {
                copyFileSync(jsonPath, jsonTargetPath);
            }

            window.showInformationMessage('Client installed successfully. Run "tsdbg".');
        });
    };
}
