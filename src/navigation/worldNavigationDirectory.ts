import { NavigationDirectory } from "./navigationDirectory";
import { readdirSync } from "fs";
import { join } from "path";
import { NavigationRoot } from "./virtualNavigationDirectory";

function isUUID(str: string): boolean {
    let regex = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;
    return regex.test(str);
}

export class WorldNavigationDirectory extends NavigationDirectory {
    protected loadItems(): NavigationDirectory[] {
        let result: NavigationDirectory[] = [];

        for (let disk of readdirSync(this.path)) {
            if (isUUID(disk)) {
                let path = join(this.path, disk);
                let virtualPath = join(this.virtualPath, disk);
                let directory = new NavigationDirectory(
                    path,
                    virtualPath,
                    this,
                    disk
                );
                result.push(directory);
            }
        }

        return result;
    }

    constructor(
        path: string,
        virtualPath: string,
        parent: NavigationRoot,
        name: string
    ) {
        super(path, virtualPath, parent, name);
        parent.addDirectory(this);
    }
}
