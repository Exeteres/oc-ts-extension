/**
 * @noResolution
 */
declare module "json" {
    function encode(table: object): string;
    function decode<T>(json: string): T;
}
