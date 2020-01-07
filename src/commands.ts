import * as vscode from "vscode";
import { resolve, join, isAbsolute } from "path";
import { NavigationDirectory } from "./navigation/navigationDirectory";
import {
    existsSync,
    readdirSync,
    statSync,
    stat,
    symlinkSync,
    unlinkSync,
    rmdirSync
} from "fs";
import { WorldNavigationDirectory } from "./navigation/worldNavigationDirectory";
import { homedir, platform } from "os";
import { NavigationRoot } from "./navigation/navigationRoot";

type Handler = (...args: any[]) => any;

export function init(context: vscode.ExtensionContext): Handler {
    return () => {
        // Resolve scripts path
        let ext = platform() === "win32" ? "bat" : "sh";
        let path = resolve(__dirname, "..", "scripts", `init.${ext}`);

        let terminal = vscode.window.createTerminal({
            name: "OC-TS Init",
            shellPath: path
        });

        terminal.show(true);

        context.subscriptions.push(terminal);
    };
}

let home = homedir();

function normalizePath(path: string): string {
    return isAbsolute(path) ? path : resolve(home, path);
}

function findDirectory(path: string): string | undefined {
    let normalized = normalizePath(path);
    return existsSync(normalized) ? normalized : undefined;
}

export function mount(context: vscode.ExtensionContext): Handler {
    return () => {
        let items: NavigationDirectory[] = [];
        let navigationRoot = new NavigationRoot();

        let config = vscode.workspace.getConfiguration();
        let paths = config.get<string[]>("oc-ts.paths") ?? [];
        paths.push("AppData\\Roaming\\.minecraft\\saves");

        let normalizedPaths = [...new Set(paths.map(normalizePath))];
        for (let dir of normalizedPaths) {
            if (!existsSync(dir)) {
                continue;
            }

            for (let save of readdirSync(dir)) {
                let path = join(dir, save);
                let stats = statSync(path);
                if (!stats.isDirectory()) {
                    continue;
                }

                let ocDirectory = join(path, "opencomputers");
                if (!existsSync(ocDirectory)) {
                    continue;
                }

                let name = `[save] ${save}`;
                let directory = new WorldNavigationDirectory(
                    ocDirectory,
                    save,
                    navigationRoot,
                    name
                );
                items.push(directory);
            }
        }

        let ocemu = findDirectory("AppData\\Roaming\\OCEmu");
        if (ocemu) {
            let name = `[emulator] OCEmu`;
            let directory = new WorldNavigationDirectory(
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
            let workspaces = vscode.workspace.workspaceFolders;
            if (!workspaces) {
                vscode.window.showErrorMessage("No active workspace was found");
                return;
            }

            let root = workspaces[0].uri.fsPath;
            let distPath = join(root, "dist");

            // Remove link or directory if exists
            if (existsSync(distPath)) {
                let stats = statSync(distPath);
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
