import { Notice } from "obsidian";
import { TemplaterError } from "./error";

export function log_update(msg: string): void {
    const notice = new Notice("", 15000);
    notice.setMessage(`<b>Templater update</b>:<br/>${msg}`);
}

export function log_error(e: Error | TemplaterError): void {
    const notice = new Notice("", 8000);
    if (e instanceof TemplaterError && e.console_msg) {
        notice.setMessage(`<b>Templater Error</b>:<br/>${e.message}<br/>Check console for more information`);
        console.error(`Templater Error:`, e.message, "\n", e.console_msg);
    } else {
       notice.setMessage( `<b>Templater Error</b>:<br/>${e.message}`);
    }
}