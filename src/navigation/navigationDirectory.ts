import { NavigationItem } from "./navigationItem";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { window } from "vscode";

export type OKHandler = (path: string) => void;

export class NavigationDirectory extends NavigationItem {
    private _parent?: NavigationDirectory;

    protected loadItems(): NavigationDirectory[] {
        const result: NavigationDirectory[] = [];

        const items = readdirSync(this.path);
        for (const item of items) {
            const path = join(this.path, item);
            const stats = statSync(path);
            if (stats.isDirectory()) {
                const virtualPath = join(this.virtualPath, item);
                const directory = new NavigationDirectory(path, virtualPath, item);
                directory._parent = this;
                result.push(directory);
            }
        }

        return result;
    }

    public async showItems(callback: OKHandler, level = 0): Promise<void> {
        const items = this.loadItems();
        const okText = `OK - ${this.virtualPath}`;
        const values = [
            ...(level > 1 ? [okText] : []), // OK button
            ...(level > 0 ? [".."] : []), // Back button
            ...items.map(x => x.name!)
        ];

        const result = await window.showQuickPick(values);
        if (!result) {
            return;
        }

        if (result === okText) {
            callback(this.path);
            return;
        }

        if (result === "..") {
            this._parent?.showItems(callback, --level);
            return;
        }

        const item = items.find(x => x.name === result);
        if (item) {
            item.showItems(callback, ++level);
        }
    }

    public setParent(parent: NavigationDirectory): void {
        this._parent = parent;
    }

    public constructor(path: string, virtualPath: string, name?: string) {
        super(path, virtualPath, name);
    }
}
