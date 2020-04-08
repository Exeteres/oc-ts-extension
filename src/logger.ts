import { window } from "vscode";

const channel = window.createOutputChannel("OC-TS");

export function info(text: string): void {
    channel.appendLine(`[INF] ${text}`);
}

export function debug(text: string): void {
    channel.appendLine(`[DBG] ${text}`);
}

export function warning(text: string): void {
    channel.appendLine(`[WRN] ${text}`);
}
