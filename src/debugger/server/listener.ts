import { createServer, Server } from "net";
import { Connection } from "./connection";
import { info } from "../../logger";

const port = 54214;
let server: Server | undefined;

export function startListening(): void {
    if (!server) {
        server = createServer(socket => new Connection(socket));
        server.listen(port, () => {
            info("Server started at port " + port);
        });
    }
}

export function stopListening(): void {
    if (server) {
        server.close();
        server = undefined;
    }
}
