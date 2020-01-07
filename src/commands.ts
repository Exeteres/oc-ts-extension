import * as vscode from "vscode";
import { resolve, join, dirname } from "path";
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
import { NavigationRoot } from "./navigation/virtualNavigationDirectory";

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

function findDirectory(paths: string[]): string | undefined {
    let home = homedir();
    let path = paths.find(x => existsSync(resolve(home, x)));
    return path ? resolve(home, path) : undefined;
}

export function mount(context: vscode.ExtensionContext): Handler {
    return () => {
        let items: NavigationDirectory[] = [];
        let navigationRoot = new NavigationRoot();

        let savesPath = findDirectory(["AppData\\Roaming\\.minecraft\\saves"]);
        if (savesPath) {
            for (let save of readdirSync(savesPath)) {
                let path = join(savesPath, save);
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

        let ocemu = findDirectory(["AppData\\Roaming\\OCEmu"]);
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
