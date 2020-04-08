import {
    LoggingDebugSession,
    StoppedEvent,
    TerminatedEvent,
    ThreadEvent
} from "vscode-debugadapter";
import { DebugProtocol } from "vscode-debugprotocol";
import { Connection } from "./connection";
import { resolve } from "url";
import { relative } from "path";
import { window } from "vscode";
import { CallStackResolver } from "./callstackResolver";

export interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    program: string;
    outRoot: {
        local: string;
        remote: string;
    };
    sourceRoot?: string;
}

interface Thread extends DebugProtocol.Thread {
    stackFrames?: DebugProtocol.StackFrame[];
    exited?: boolean;
}

interface ThreadMessage {
    threadId: number;
}

export class LuaDebugSession extends LoggingDebugSession {
    private _threads: Thread[] = [];
    private readonly _connection: Connection;
    private _args!: LaunchRequestArguments;
    private _hostPath!: string;

    public constructor() {
        super();

        this._connection = Connection.getConnection();

        this._connection.on("thread", message => {
            this._threads.push({
                id: message.threadId,
                name: message.threadName
            });
            this.sendEvent(new ThreadEvent("started", message.threadId));
        });

        this._connection.on("error", async message => {
            const thread = this._threads.find(x => x.id === message.threadId);
            if (!thread) {
                return;
            }

            const resolver = new CallStackResolver(this._args);
            const [errorText, frames] = await resolver.resolve(message.stacktrace);
            thread.stackFrames = frames;
            thread.exited = true;

            this.sendEvent(new StoppedEvent("exception", message.threadId, errorText));
        });

        this._connection.on("finish", message => {
            const index = this._threads.findIndex(x => x.id === message.threadId);

            if (index !== -1) {
                const thread = this._threads[index];

                if (thread.id !== 1) {
                    this._threads.splice(index, 1);
                } else if (this._threads.length === 1) {
                    this.sendEvent(new TerminatedEvent());
                    return;
                } else {
                    thread.exited = true;
                }

                this.sendEvent(new ThreadEvent("exited", message.threadId));
            }
        });

        this._connection.on("notfound", () => {
            window.showErrorMessage(
                `The file ${this._hostPath} was not found on the host machine. Did you forget to compile your app?`
            );
            this.sendEvent(new TerminatedEvent());
        });

        this._connection.on("close", () => {
            window.showWarningMessage("Connection lost.");
            this.sendEvent(new TerminatedEvent());
        });
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse): void {
        response.body = response.body ?? {};
        this.sendResponse(response);
    }

    protected launchRequest(
        response: DebugProtocol.LaunchResponse,
        args: LaunchRequestArguments
    ): void {
        let programRoot = args.outRoot.local;

        if (args.program.endsWith(".ts")) {
            if (!args.sourceRoot) {
                response.message = "Cannot debug ts file without sourceRoot option.";
                response.success = false;
                this.sendResponse(response);
                return;
            }
            programRoot = args.sourceRoot;
            args.program = args.program.replace(".ts", ".lua");
        }

        const relativePath = relative(programRoot, args.program);
        const path = resolve(args.outRoot.remote, relativePath);
        this._hostPath = path;
        this._connection.send({ type: "launch", path });
        this.sendResponse(response);
        this._args = args;
    }

    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        response.body = { threads: this._threads };
        this.sendResponse(response);
    }

    protected stackTraceRequest(
        response: DebugProtocol.StackTraceResponse,
        args: DebugProtocol.StackTraceArguments
    ): void {
        const thread = this._threads.find(x => x.id === args.threadId);
        if (!thread || !thread.stackFrames) {
            response.success = false;
            this.sendResponse(response);
            return;
        }
        response.body = { stackFrames: thread.stackFrames };
        this.sendResponse(response);
    }

    protected continueRequest(
        response: DebugProtocol.ContinueResponse,
        args: DebugProtocol.ContinueArguments
    ): void {
        const index = this._threads.findIndex(x => x.id === args.threadId);
        if (index !== -1) {
            const thread = this._threads[index];
            if (thread.exited) {
                this._threads.splice(index, 1);
                this.sendEvent(new ThreadEvent("exited", args.threadId));
            }
        }
        if (this._threads.length === 1 && this._threads[0].exited) {
            this.sendEvent(new TerminatedEvent());
        }
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.TerminateResponse): void {
        this._connection.send({ type: "terminate" });
        this.sendResponse(response);
    }
}
