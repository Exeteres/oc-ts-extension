import * as vscode from "vscode";
import { resolve, join, isAbsolute } from "path";
import { NavigationDirectory } from "./navigation/navigationDirectory";
import {
    existsSync,
    readdirSync,
    statSync,
    symlinkSync,
    unlinkSync,
    rmdirSync
} from "fs";
import { WorldNavigationDirectory } from "./navigation/worldNavigationDirectory";
import { homedir, platform } from "os";
import { NavigationRoot } from "./navigation/navigationRoot";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandHandler = (...args: any[]) => any;

export function init(context: vscode.ExtensionContext): CommandHandler {
    return () => {
        // Resolve scripts path
        const ext = platform() === "win32" ? "bat" : "sh";
        const path = resolve(__dirname, "..", "scripts", `init.${ext}`);

        const terminal = vscode.window.createTerminal({
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

export function mount(): CommandHandler {
    return () => {
        const items: NavigationDirectory[] = [];
        const navigationRoot = new NavigationRoot();

        const config = vscode.workspace.getConfiguration();
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
                    navigationRoot,
                    name
                );
                items.push(directory);
            }
        }

        const ocemu = findDirectory("AppData\\Roaming\\OCEmu");
        if (ocemu) {
            const name = `[emulator] OCEmu`;
            const directory = new WorldNavigationDirectory(
                ocemu,
                "OCEmu",
                navigationRoot,
                name
            );
            items.push(directory);
        }

        if (items.length === 0) {
            vscode.window.showWarningMessage("No save or emulator was found");
            return;
        }

        navigationRoot.showItems(path => {
            const workspaces = vscode.workspace.workspaceFolders;
            if (!workspaces) {
                vscode.window.showErrorMessage("No active workspace was found");
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
            vscode.window.showInformationMessage("Link created successfully");
        });
    };
}
