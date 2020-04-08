import { Socket } from "net";
import { info, debug, warning } from "../../logger";
import { EventEmitter } from "events";
import { extensions } from "vscode";

function getVersion(): string {
    return extensions.getExtension("exeteres.oc-ts")!.packageJSON.version;
}

export class Connection extends EventEmitter {
    private readonly _socket: Socket;
    private static readonly _connections: Connection[] = [];
    private _buffer = "";

    public static getConnection(): Connection {
        return Connection._connections[Connection._connections.length - 1];
    }

    public static hasConnection(): boolean {
        return Connection._connections.length !== 0;
    }

    private formatAddress(): string {
        return `${this._socket.remoteAddress}:${this._socket.remotePort}`;
    }

    private processData(): void {
        let delimiterIndex = this._buffer.indexOf("\n");
        while (delimiterIndex > -1) {
            try {
                const json = this._buffer.substring(0, delimiterIndex);
                const message: OCTS.OutMessage = JSON.parse(json);
                this.debug(`Received event ${json}`);
                this.emit(message.type, message);
            } catch {
                this.warning("Broken message");
            } finally {
                this._buffer = this._buffer.substring(delimiterIndex + 1);
                delimiterIndex = this._buffer.indexOf("\n");
            }
        }
    }

    public info(text: string): void {
        info(`[${this.formatAddress()}] ${text}`);
    }

    public debug(text: string): void {
        debug(`[${this.formatAddress()}] ${text}`);
    }

    public warning(text: string): void {
        warning(`[${this.formatAddress()}] ${text}`);
    }

    public send(message: OCTS.InMessage): void {
        const json = JSON.stringify(message);
        this.debug(`Sended event ${json}`);
        this._socket.write(JSON.stringify(message) + "\n");
    }

    public constructor(socket: Socket) {
        super();

        this._socket = socket;
        Connection._connections.push(this);
        this.info(`Connected`);

        this._socket.on("close", () => {
            const index = Connection._connections.indexOf(this);
            Connection._connections.splice(index, 1);
            this.emit("close");
            this.info("Disconnected");
        });

        this._socket.on("data", data => {
            this._buffer += data.toString();
            this.processData();
        });

        this.send({ type: "hello", version: getVersion() });
    }
}

export interface Connection extends EventEmitter {
    on<K extends OCTS.OutMessage["type"]>(
        s: K,
        listener: (message: DiscriminateUnion<OCTS.OutMessage, "type", K>) => any
    ): this;
    on(s: "close", listener: Function): this;

    emit<K extends OCTS.OutMessage["type"]>(
        s: K,
        message: DiscriminateUnion<OCTS.OutMessage, "type", K>
    ): boolean;
    emit(s: "close"): boolean;
}
