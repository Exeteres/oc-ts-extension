import { NavigationItem } from "./navigationItem";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";

type OKHandler = (path: string) => void;

export class NavigationDirectory extends NavigationItem {
    readonly parent?: NavigationDirectory;

    protected loadItems(): NavigationDirectory[] {
        const result: NavigationDirectory[] = [];

        const items = readdirSync(this.path);
        for (const item of items) {
            const path = join(this.path, item);
            const stats = statSync(path);
            if (stats.isDirectory()) {
                const virtualPath = join(this.virtualPath, item);
                const directory = new NavigationDirectory(
                    path,
                    virtualPath,
                    this,
                    item
                );
                result.push(directory);
            }
        }

        return result;
    }

    async showItems(callback: OKHandler, level = 0): Promise<void> {
        const items = this.loadItems();
        const okText = `OK - ${this.virtualPath}`;
        const values = [
            ...(level > 1 ? [okText] : []), // OK button
            ...(level > 0 ? [".."] : []), // Back button
            ...items.map(x => x.name!)
        ];

        const result = await vscode.window.showQuickPick(values);
        if (!result) {
            return;
        }

        if (result === okText) {
            callback(this.path);
            return;
        }

        if (result === "..") {
            this.parent?.showItems(callback, --level);
            return;
        }

        const item = items.find(x => x.name === result);
        if (item) {
            item.showItems(callback, ++level);
        }
    }

    constructor(
        path: string,
        virtualPath: string,
        parent?: NavigationDirectory,
        name?: string
    ) {
        super(path, virtualPath, name);
        this.parent = parent;
    }
}
