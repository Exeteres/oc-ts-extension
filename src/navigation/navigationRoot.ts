import { NavigationDirectory } from "./navigationDirectory";

export class NavigationRoot extends NavigationDirectory {
    private readonly _items: NavigationDirectory[] = [];

    protected loadItems(): NavigationDirectory[] {
        return this._items;
    }

    public addDirectory(directory: NavigationDirectory): void {
        this._items.push(directory);
        directory.setParent(this);
    }

    public get empty(): boolean {
        return this._items.length === 0;
    }

    public constructor() {
        super("", "");
    }
}
