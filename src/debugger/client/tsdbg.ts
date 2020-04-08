import * as internet from "internet";
import * as json from "json";
import * as thread from "thread";
import * as event from "event";
import * as filesystem from "filesystem";

const version = "0.2.0";

// Networking
const host = "localhost";
const port = 54214;

let socket: LuaFile;

// Event handling
type HandlerMap = {
    [K in OCTS.InMessage["type"]]: (
        message: DiscriminateUnion<OCTS.InMessage, "type", K>
    ) => void;
};

function startReading(): void {
    socket = internet.open(host, port);
    (socket as any).setTimeout(0.05);
    for (;;) {
        try {
            const [line] = socket.read("*l");
            if (line === undefined) {
                print("Cannot connect to debugger server.");
                return;
            }
            const message = json.decode<OCTS.InMessage>(line);
            handlers[message.type](message as any);
        } catch (e) {
            if (!(e as string).endsWith("timeout")) {
                print("Error while reading message: " + e);
                return;
            }
        } finally {
            os.sleep(0);
        }
    }
}

function sendMessage(message: OCTS.OutMessage): void {
    socket.write(json.encode(message) + "\n");
}

function reportThread(id: number, err?: string): void {
    const threadLabel = id === 1 ? "Main thread" : `Thread ${id}`;
    const errorLabel = err ? `with error:\n${err}` : "without errors.";
    const colorCode = err ? "\x1b[31m" : "\x1b[32m";
    print(`${colorCode}${threadLabel} exited ${errorLabel}\x1b[m`);
}

// Worker
function threadWorker(func: Function, id: number, ...args: LuaVarArgs<any>): void {
    const type = id === 1 ? "main" : "thread";
    const threadName = `[${id}] ${type}`;
    sendMessage({ type: "thread", threadId: id, threadName });
    const tableArgs = [...args];
    const [ok, result] = xpcall(func, debug.traceback, ...table.unpack(tableArgs));
    if (ok) {
        reportThread(id);
        sendMessage({ type: "finish", threadId: id });
    } else {
        reportThread(id, result as string);
        sendMessage({
            type: "error",
            threadId: id,
            stacktrace: result as string
        });
    }
    if (id === 1) {
        threadCounter = 1;
    }
}

// Main debugging thread
let debugThread: OpenOS.Thread;

const handlers: HandlerMap = {
    launch: message => {
        if (debugThread && debugThread.status() !== "dead") {
            debugThread.kill();
        }
        if (!filesystem.exists(message.path)) {
            sendMessage({ type: "notfound" });
            return;
        }
        print(`> ${message.path}`);
        debugThread = thread.create(dofile, message.path);
    },
    terminate: () => {
        if (debugThread && debugThread.status() !== "dead") {
            debugThread.kill();
            debugThread = undefined;
            threadCounter = 1;
            print(`\x1b[33mMain thread terminated by debugger.\x1b[m`);
        }
    },
    hello: message => {
        if (message.version !== version) {
            throw (
                "\nThe version received from the debugger does not match the client version." +
                "\nUpdate using 'Install client' command."
            );
        }
        print(`Connected to OC-TS Debugger v${version}`);
    }
};

type Function = (this: void, ...args: any[]) => void;

const interruptThread = thread.create(() => {
    event.pull("interrupted");
});

const mainThread = thread.create(() => {
    startReading();
});

let threadCounter = 1;

// Thread API wrapping
const originalThreadCreate = thread.create;
(thread as any).create = (func: Function, ...args: LuaVarArgs<any>) => {
    const id = threadCounter++;
    return originalThreadCreate(threadWorker, func, id, ...args);
};

thread.waitForAny([interruptThread, mainThread]);

// Clean up and exit
socket.close();
(thread as any).create = originalThreadCreate;
os.exit();
