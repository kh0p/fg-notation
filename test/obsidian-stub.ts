/** Minimal stand-in for the `obsidian` module so the renderer can run in Node. */

export function setIcon(el: { setAttribute(k: string, v: string): void }, name: string): void {
	el.setAttribute("data-icon", name);
}

export class Notice {
	constructor(public message: string) {}
}
