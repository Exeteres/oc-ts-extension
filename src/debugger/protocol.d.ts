declare namespace OCTS {
    interface ThreadMessage {
        type: "thread";
        threadId: number;
        threadName: string;
    }

    interface FinishMessage {
        type: "finish";
        threadId: number;
    }

    interface ErrorMessage {
        type: "error";
        threadId: number;
        stacktrace: string;
    }

    interface NotFoundMessage {
        type: "notfound";
    }

    type OutMessage = ThreadMessage | FinishMessage | ErrorMessage | NotFoundMessage;

    interface LaunchMessage {
        type: "launch";
        path: string;
    }

    interface TerminateMessage {
        type: "terminate";
    }

    interface HelloMessage {
        type: "hello";
        version: string;
    }

    type InMessage = LaunchMessage | HelloMessage | TerminateMessage;
}
