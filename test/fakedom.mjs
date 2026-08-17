/**
 * A DOM just large enough to run the renderer outside Obsidian, including the
 * `createDiv` / `createSpan` / `addClass` helpers Obsidian adds to HTMLElement.
 */

const VOID = new Set(["br", "hr", "img", "input"]);

const escapeText = (s) =>
	String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s) => escapeText(s).replace(/"/g, "&quot;");

class El {
	constructor(tag, ns = null) {
		this.tag = tag;
		this.ns = ns;
		this.children = [];
		this.attrs = {};
		this.classes = new Set();
		this.text = "";
		this._style = {};
	}

	get style() {
		const self = this;
		return {
			setProperty(k, v) {
				self._style[k] = v;
			},
		};
	}

	get classList() {
		const self = this;
		return {
			add: (c) => self.classes.add(c),
			contains: (c) => self.classes.has(c),
			[Symbol.iterator]: () => self.classes[Symbol.iterator](),
		};
	}

	setAttribute(k, v) {
		this.attrs[k] = v;
	}
	setAttr(k, v) {
		this.attrs[k] = v;
	}
	addClass(...cs) {
		for (const c of cs) for (const p of String(c).split(/\s+/)) if (p) this.classes.add(p);
		return this;
	}
	setText(t) {
		this.text = t;
		return this;
	}
	appendChild(child) {
		this.children.push(child);
		return child;
	}
	addEventListener() {}

	createEl(tag, o = {}) {
		const el = new El(tag);
		if (o.cls) el.addClass(o.cls);
		if (o.text) el.text = o.text;
		if (o.href) el.attrs.href = o.href;
		if (o.attr) Object.assign(el.attrs, o.attr);
		this.children.push(el);
		return el;
	}
	createDiv(o = {}) {
		return this.createEl("div", o);
	}
	createSpan(o = {}) {
		return this.createEl("span", o);
	}

	get outerHTML() {
		const attrs = { ...this.attrs };
		if (this.classes.size) attrs.class = [...this.classes].join(" ");
		const styleStr = Object.entries(this._style)
			.map(([k, v]) => `${k}:${v}`)
			.join(";");
		if (styleStr) attrs.style = styleStr;

		const attrStr = Object.entries(attrs)
			.map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
			.join("");

		if (VOID.has(this.tag)) return `<${this.tag}${attrStr}>`;
		const inner = this.text
			? escapeText(this.text)
			: this.children.map((c) => c.outerHTML).join("");
		return `<${this.tag}${attrStr}>${inner}</${this.tag}>`;
	}
}

export function installFakeDom() {
	globalThis.document = {
		createElementNS: (ns, tag) => new El(tag, ns),
		createElement: (tag) => new El(tag),
	};
	globalThis.createDiv = (o = {}) => new El("div").addClass(o.cls ?? "");
	globalThis.window = { setTimeout: () => 0 };
	// `navigator` is a read-only global in modern Node and is only touched by
	// the copy handler, which never fires during a render.
	return El;
}

export function newRoot() {
	return new El("div");
}
