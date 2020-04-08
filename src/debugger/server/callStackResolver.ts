import { DebugProtocol } from "vscode-debugprotocol";
import { LaunchRequestArguments } from "./luaDebugSession";
import { relative, resolve } from "path";
import { pathExists, readFile } from "fs-extra";
import { SourceMapConsumer, MappingItem } from "source-map";

export class CallStackResolver {
    private _sourceMapCache = new Map<string, SourceMapConsumer>();
    private readonly _args: LaunchRequestArguments;

    public constructor(args: LaunchRequestArguments) {
        this._args = args;
    }

    private async resolveConsumer(
        filePath: string
    ): Promise<SourceMapConsumer | undefined> {
        if (this._sourceMapCache.has(filePath)) {
            return this._sourceMapCache.get(filePath);
        }

        const sourceMapPath = filePath + ".map";
        const exists = await pathExists(sourceMapPath);
        if (!exists) {
            return undefined;
        }

        const json = await readFile(sourceMapPath, "utf8");
        const consumer = await new SourceMapConsumer(json);
        this._sourceMapCache.set(filePath, consumer);
        return consumer;
    }

    private findMapping(consumer: SourceMapConsumer, line: number): MappingItem {
        let mapping: MappingItem;
        consumer.eachMapping(x => {
            if (x.generatedLine === line) {
                mapping = x;
                return;
            }
        });
        return mapping!;
    }

    private async parseStackTraceLine(
        line: string
    ): Promise<DebugProtocol.StackFrame | undefined> {
        const parts = line.split(":");
        if (!parts[0].startsWith(this._args.outRoot.remote)) {
            return undefined;
        }

        const trimmedName = parts[2].substring(13);
        const relativePath = relative(this._args.outRoot.remote, parts[0]);
        const filePath = resolve(this._args.outRoot.local, relativePath);
        const name = trimmedName.startsWith("'")
            ? trimmedName.replace(/'/gm, "")
            : "anonymous";
        const lineN = parseInt(parts[1]);

        const consumer = await this.resolveConsumer(filePath);
        if (!consumer) {
            return {
                name,
                id: 0,
                source: { path: filePath },
                column: 1,
                line: lineN
            };
        }

        const position = this.findMapping(consumer, lineN);
        const path = resolve(this._args.outRoot.local, position.source);
        return {
            id: 0,
            name,
            source: { path },
            column: position.originalColumn,
            line: position.originalLine
        };
    }

    public async resolve(
        stacktrace: string
    ): Promise<[string, DebugProtocol.StackFrame[]]> {
        const lines = stacktrace.split("\n");

        const message = lines[0].split(":")[2].trimLeft();

        const frames = lines
            .slice(lines.indexOf("stack traceback:") + 1)
            .map(x => x.trimLeft())
            .filter(x => !x.startsWith("[C]"))
            .map(this.parseStackTraceLine.bind(this));

        const resolvedFrames = await Promise.all(frames);
        return [message, resolvedFrames.filter(x => x) as DebugProtocol.StackFrame[]];
    }
}
