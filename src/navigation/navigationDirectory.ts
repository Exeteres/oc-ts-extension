import { NavigationItem } from "./navigationItem";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";

type OKHandler = (path: string) => void;

export class NavigationDirectory extends NavigationItem {
    readonly parent?: NavigationDirectory;

    protected loadItems(): NavigationDirectory[] {
        let result: NavigationDirectory[] = [];

        let items = readdirSync(this.path);
        for (let item of items) {
            let path = join(this.path, item);
            let stats = statSync(path);
            if (stats.isDirectory()) {
                let virtualPath = join(this.virtualPath, item);
                let directory = new NavigationDirectory(
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

    async showItems(callback: OKHandler, level: number = 0): Promise<void> {
        let items = this.loadItems();
        let okText = `OK - ${this.virtualPath}`;
        let values = [
            ...(level > 1 ? [okText] : []), // OK button
            ...(level > 0 ? [".."] : []), // Back button
            ...items.map(x => x.name!)
        ];

        let result = await vscode.window.showQuickPick(values);
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

        let item = items.find(x => x.name === result);
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
