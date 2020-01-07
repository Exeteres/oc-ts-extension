import { NavigationDirectory } from "./navigationDirectory";

export class NavigationRoot extends NavigationDirectory {
    private readonly _items: NavigationDirectory[] = [];

    loadItems(): NavigationDirectory[] {
        return this._items;
    }

    addDirectory(directory: NavigationDirectory): void {
        this._items.push(directory);
    }

    constructor() {
        super("", "");
    }
}
