import { NavigationDirectory, OKHandler } from "./navigationDirectory";
import { readdirSync, existsSync } from "fs";
import { join, resolve } from "path";
import { window } from "vscode";

function isUUID(str: string): boolean {
    const regex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    return regex.test(str);
}

function detectOS(path: string): string {
    if (existsSync(resolve(path, "init.lua"))) {
        return "OpenOS";
    }
    if (existsSync(resolve(path, "OS.lua"))) {
        return "MineOS";
    }
    return "Unknown";
}

export interface WorldNavigationOptions {
    installClient?: boolean;
}

export class WorldNavigationDirectory extends NavigationDirectory {
    private readonly _options: WorldNavigationOptions;

    protected loadItems(): NavigationDirectory[] {
        const result: NavigationDirectory[] = [];

        for (const disk of readdirSync(this.path)) {
            if (isUUID(disk)) {
                const path = join(this.path, disk);
                const os = detectOS(path);

                if (this._options.installClient && os !== "OpenOS") {
                    continue;
                }

                const virtualPath = join(this.virtualPath, disk);
                const name = `[${os}] ${disk}`;
                const directory = new NavigationDirectory(path, virtualPath, name);
                directory.setParent(this);
                result.push(directory);
            }
        }

        return result;
    }

    public async showItems(callback: OKHandler, level = 0): Promise<void> {
        if (!this._options.installClient) {
            await super.showItems(callback, level);
            return;
        }

        const items = this.loadItems();
        const result = await window.showQuickPick(items.map(x => x.name!));
        if (!result) {
            return;
        }

        const item = items.find(x => x.name === result);
        if (item) {
            callback(item.path);
        }
    }

    public constructor(
        path: string,
        virtualPath: string,
        name: string,
        options: WorldNavigationOptions
    ) {
        super(path, virtualPath, name);
        this._options = options;
    }
}
