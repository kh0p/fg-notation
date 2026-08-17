import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
} from "obsidian";
import type { GameProfile } from "../types";
import type { FgSettings } from "../settings";
import { listGames } from "../games";

/** Opening fence of an fg block, with an optional partially-typed game id. */
const FENCE_RE = /^(\s*)(`{3,})fg(?::([A-Za-z0-9_:-]*))?$/;
/** Any opening fence. */
const ANY_FENCE_RE = /^\s*(`{3,})(\S*)/;

const FIELD_HELP: Array<{ name: string; desc: string }> = [
	{ name: "input", desc: "The combo notation" },
	{ name: "name", desc: "Combo name" },
	{ name: "damage", desc: "Total damage" },
	{ name: "hits", desc: "Hit count" },
	{ name: "character", desc: "Who performs it" },
	{ name: "meter", desc: "Meter / gauge cost" },
	{ name: "position", desc: "Midscreen, corner, …" },
	{ name: "works", desc: "Which characters it works on" },
	{ name: "difficulty", desc: "Easy / medium / hard" },
	{ name: "video", desc: "Link to a clip" },
	{ name: "notes", desc: "Free-form notes" },
	{ name: "tags", desc: "Comma-separated tags" },
];

/**
 * Find the opening fence of the fg block containing `line`, scanning upwards.
 * Returns null when the cursor is not inside one.
 */
function enclosingFgBlock(editor: Editor, line: number): { fenceLine: number } | null {
	for (let i = line - 1; i >= 0 && line - i < 200; i--) {
		const text = editor.getLine(i);
		const fence = text.match(ANY_FENCE_RE);
		if (!fence) continue;

		// A fence with no language closes a block; anything else opens one.
		if (!fence[2]) return null;
		return /^fg(:|$)/.test(fence[2]) ? { fenceLine: i } : null;
	}
	return null;
}

/** True when a closing fence already exists below `line`. */
function hasClosingFence(editor: Editor, line: number): boolean {
	const last = editor.lastLine();
	for (let i = line + 1; i <= last && i - line < 60; i++) {
		if (/^\s*`{3,}\s*$/.test(editor.getLine(i))) return true;
	}
	return false;
}

/* -------------------------------------------------------------------------- */
/* Game id completion on the fence line                                       */
/* -------------------------------------------------------------------------- */

export class GameSuggest extends EditorSuggest<GameProfile> {
	constructor(app: App, private settings: FgSettings) {
		super(app);
		this.limit = 12;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
	): EditorSuggestTriggerInfo | null {
		if (!this.settings.autocomplete) return null;

		const line = editor.getLine(cursor.line);
		if (cursor.ch !== line.length) return null;

		const m = line.match(FENCE_RE);
		if (!m) return null;

		const query = m[3] ?? "";
		// Only complete the last `:`-separated segment.
		const lastSegment = query.split(":").pop() ?? "";

		return {
			start: { line: cursor.line, ch: line.length - lastSegment.length },
			end: cursor,
			query: lastSegment,
		};
	}

	getSuggestions(context: EditorSuggestContext): GameProfile[] {
		const q = context.query.toLowerCase();
		const games = listGames();
		if (!q) return games;
		return games.filter(
			(g) =>
				g.id.includes(q) ||
				g.short.toLowerCase().includes(q) ||
				g.name.toLowerCase().includes(q) ||
				g.aliases.some((a) => a.toLowerCase().includes(q)),
		);
	}

	renderSuggestion(game: GameProfile, el: HTMLElement): void {
		el.addClass("fgn-suggest");
		const dot = el.createSpan({ cls: "fgn-suggest-dot" });
		dot.style.setProperty("--fgn-c", game.accent);
		const body = el.createDiv({ cls: "fgn-suggest-body" });
		body.createDiv({ cls: "fgn-suggest-title", text: game.id });
		body.createDiv({ cls: "fgn-suggest-desc", text: game.name });
	}

	selectSuggestion(game: GameProfile): void {
		const ctx = this.context;
		if (!ctx) return;
		const { editor, start, end } = ctx;

		editor.replaceRange(game.id, start, end);

		const fenceLine = start.line;
		const lineText = editor.getLine(fenceLine);
		const indent = lineText.match(/^\s*/)?.[0] ?? "";

		// Scaffold the body only if the block is still empty.
		const nextLine = editor.getLine(fenceLine + 1) ?? "";
		const blockIsEmpty = !nextLine.trim() || /^\s*`{3,}\s*$/.test(nextLine);

		if (!blockIsEmpty) {
			editor.setCursor({ line: fenceLine, ch: lineText.length });
			return;
		}

		const fields = this.settings.templateFields.length
			? this.settings.templateFields
			: ["input"];
		const body = fields.map((f) => `${indent}${f}: `).join("\n");
		const needsFence = !hasClosingFence(editor, fenceLine);
		const insert = `\n${body}${needsFence ? `\n${indent}\`\`\`` : ""}`;

		editor.replaceRange(insert, { line: fenceLine, ch: lineText.length });
		// Land the cursor after `input: `.
		editor.setCursor({ line: fenceLine + 1, ch: indent.length + fields[0].length + 2 });
	}
}

/* -------------------------------------------------------------------------- */
/* Field completion inside the block                                          */
/* -------------------------------------------------------------------------- */

type FieldSuggestion =
	| { kind: "template" }
	| { kind: "field"; name: string; desc: string };

export class FieldSuggest extends EditorSuggest<FieldSuggestion> {
	constructor(app: App, private settings: FgSettings) {
		super(app);
		this.limit = 12;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
	): EditorSuggestTriggerInfo | null {
		if (!this.settings.autocomplete) return null;

		const line = editor.getLine(cursor.line);
		if (cursor.ch !== line.length) return null;
		// Only on an empty line or a bare partial word — never mid-notation.
		const m = line.match(/^(\s*)([A-Za-z]*)$/);
		if (!m) return null;

		if (!enclosingFgBlock(editor, cursor.line)) return null;

		return {
			start: { line: cursor.line, ch: m[1].length },
			end: cursor,
			query: m[2],
		};
	}

	getSuggestions(context: EditorSuggestContext): FieldSuggestion[] {
		const q = context.query.toLowerCase();
		const out: FieldSuggestion[] = [];

		// Offer the whole scaffold when the block has no fields yet.
		const { editor } = context;
		const block = enclosingFgBlock(editor, context.start.line);
		if (block) {
			let hasFields = false;
			for (let i = block.fenceLine + 1; i < context.start.line; i++) {
				if (/^\s*[A-Za-z][A-Za-z0-9 _-]*:/.test(editor.getLine(i))) {
					hasFields = true;
					break;
				}
			}
			if (!hasFields) out.push({ kind: "template" });
		}

		for (const f of FIELD_HELP) {
			if (!q || f.name.startsWith(q)) out.push({ kind: "field", ...f });
		}
		return out;
	}

	renderSuggestion(s: FieldSuggestion, el: HTMLElement): void {
		el.addClass("fgn-suggest");
		if (s.kind === "template") {
			el.createSpan({ cls: "fgn-suggest-dot is-template" });
			const body = el.createDiv({ cls: "fgn-suggest-body" });
			body.createDiv({ cls: "fgn-suggest-title", text: "Insert combo template" });
			body.createDiv({
				cls: "fgn-suggest-desc",
				text: this.settings.templateFields.join(", "),
			});
			return;
		}
		el.createSpan({ cls: "fgn-suggest-dot" });
		const body = el.createDiv({ cls: "fgn-suggest-body" });
		body.createDiv({ cls: "fgn-suggest-title", text: `${s.name}:` });
		body.createDiv({ cls: "fgn-suggest-desc", text: s.desc });
	}

	selectSuggestion(s: FieldSuggestion): void {
		const ctx = this.context;
		if (!ctx) return;
		const { editor, start, end } = ctx;
		const indent = editor.getLine(start.line).match(/^\s*/)?.[0] ?? "";

		if (s.kind === "template") {
			const fields = this.settings.templateFields.length
				? this.settings.templateFields
				: ["input"];
			const text = fields.map((f) => `${f}: `).join(`\n${indent}`);
			editor.replaceRange(text, start, end);
			editor.setCursor({ line: start.line, ch: indent.length + fields[0].length + 2 });
			return;
		}

		editor.replaceRange(`${s.name}: `, start, end);
		editor.setCursor({ line: start.line, ch: indent.length + s.name.length + 2 });
	}
}
