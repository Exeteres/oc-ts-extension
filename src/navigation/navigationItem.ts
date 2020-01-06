export class NavigationItem {
    readonly name?: string;
    readonly path: string;
    readonly virtualPath: string;

    constructor(path: string, virtualPath: string, name?: string) {
        this.path = path;
        this.virtualPath = virtualPath;
        this.name = name;
    }
}
