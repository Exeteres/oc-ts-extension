export class NavigationItem {
    public constructor(
        public readonly path: string,
        public readonly virtualPath: string,
        public readonly name?: string
    ) {}
}
