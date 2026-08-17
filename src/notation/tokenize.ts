import type { GameProfile, Move, Token, TokenKind } from "../types";
import {
	ACTION_WORDS,
	CONNECTORS,
	NUMPAD_DIRECTIONS,
	UNIVERSAL_MODIFIERS,
	matchMotion,
} from "./universal";

/* -------------------------------------------------------------------------- */
/* Match table                                                                */
/* -------------------------------------------------------------------------- */

interface Entry {
	text: string;
	lower: string;
	kind: TokenKind;
	label: string;
	title: string;
	color?: string;
	/** Purely alphabetic — needs a word-boundary guard so `H` does not match
	 *  inside `Hold` and `d` does not match inside `dash`. */
	alpha: boolean;
}

const ALPHA_ONLY = /^[A-Za-z]+$/;

function entry(
	text: string,
	kind: TokenKind,
	label: string,
	title: string,
	color?: string,
): Entry {
	return {
		text,
		lower: text.toLowerCase(),
		kind,
		label,
		title,
		color,
		alpha: ALPHA_ONLY.test(text),
	};
}

const tableCache = new WeakMap<GameProfile, Entry[]>();

function tableFor(profile: GameProfile): Entry[] {
	const cached = tableCache.get(profile);
	if (cached) return cached;

	const entries: Entry[] = [];

	for (const b of profile.buttons) {
		const label = b.label ?? b.token;
		entries.push(entry(b.token, "button", label, b.name, b.color));
		for (const a of b.aliases ?? []) {
			entries.push(entry(a, "button", label, b.name, b.color));
		}
	}

	for (const m of profile.mechanics) {
		const label = m.label ?? m.token;
		entries.push(entry(m.token, "mechanic", label, m.name, m.color));
		for (const a of m.aliases ?? []) {
			entries.push(entry(a, "mechanic", label, m.name, m.color));
		}
	}

	for (const d of profile.directions ?? []) {
		const label = d.label ?? d.token;
		entries.push(entry(d.token, "direction", label, d.name, d.color));
		for (const a of d.aliases ?? []) {
			entries.push(entry(a, "direction", label, d.name, d.color));
		}
	}

	for (const m of [...(profile.modifiers ?? []), ...UNIVERSAL_MODIFIERS]) {
		const label = m.label ?? m.token;
		entries.push(entry(m.token, "modifier", label, m.name, m.color));
		for (const a of m.aliases ?? []) {
			entries.push(entry(a, "modifier", label, m.name, m.color));
		}
	}

	// Longest first so `HS` beats `H`, `d/f` beats `d`, and `236236` beats `236`.
	entries.sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));

	tableCache.set(profile, entries);
	return entries;
}

/* -------------------------------------------------------------------------- */
/* Scanner helpers                                                            */
/* -------------------------------------------------------------------------- */

const isDigit = (c: string) => c >= "0" && c <= "9";
const isLower = (c: string) => c >= "a" && c <= "z";
const isAlpha = (c: string) => /[A-Za-z]/.test(c);
const isWordChar = (c: string) => /[A-Za-z0-9']/.test(c);

/** Longest table entry matching at `i`, respecting the word-boundary guard. */
function matchEntry(src: string, i: number, table: Entry[], caseSensitive: boolean): Entry | null {
	for (const e of table) {
		const seg = src.slice(i, i + e.text.length);
		if (seg.length < e.text.length) continue;
		const hit = caseSensitive ? seg === e.text : seg.toLowerCase() === e.lower;
		if (!hit) continue;

		// `H` must not swallow the first letter of `Hold`; `d` must not
		// swallow `dash`. Tokens ending in `.` (j. cl. dl.) are exempt.
		if (e.alpha) {
			const after = src[i + e.text.length];
			if (after && isLower(after)) continue;
		}
		return e;
	}
	return null;
}

/** Longest connector matching at `i`. */
function matchConnector(src: string, i: number) {
	for (const c of CONNECTORS) {
		if (src.startsWith(c.token, i)) return c;
	}
	return null;
}

/* -------------------------------------------------------------------------- */
/* Tokenizer                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Split one combo string into moves.
 *
 * A *move* is everything between two strong connectors (`>`, `,`, `xx`, `~`)
 * and renders as a single chip; spaces inside a move are soft separators, so
 * `M H H` stays one chip with three buttons in it.
 */
export function tokenize(src: string, profile: GameProfile): Move[] {
	const table = tableFor(profile);
	const numpad = profile.family === "numpad";
	const cs = profile.caseSensitive;

	const moves: Move[] = [];
	let current: Token[] = [];

	const push = (t: Token) => current.push(t);

	const flush = (connector?: Token) => {
		// Drop trailing soft spaces so chips do not carry dangling padding.
		while (current.length && current[current.length - 1].cls === "fgn-sp") current.pop();
		if (current.length) {
			moves.push(connector ? { tokens: current, connector } : { tokens: current });
		} else if (connector && moves.length) {
			// Two connectors in a row — attach to the previous move.
			moves[moves.length - 1].connector = connector;
		}
		current = [];
	};

	let i = 0;
	let parenDepth = 0;

	while (i < src.length) {
		const c = src[i];

		/* whitespace -------------------------------------------------------- */
		if (c === " " || c === "\t" || c === "\n") {
			if (current.length && current[current.length - 1].cls !== "fgn-sp") {
				push({ kind: "punct", raw: " ", label: " ", cls: "fgn-sp" });
			}
			i++;
			continue;
		}

		/* connectors vs table — whichever match is longer ------------------- */
		const conn = matchConnector(src, i);
		const ent = matchEntry(src, i, table, cs);

		if (conn && (!ent || conn.token.length > ent.text.length)) {
			flush({
				kind: "connector",
				raw: conn.token,
				label: conn.glyph,
				title: conn.name,
				cls: conn.cls,
			});
			i += conn.token.length;
			continue;
		}

		if (ent) {
			push({
				kind: ent.kind,
				raw: src.slice(i, i + ent.text.length),
				label: ent.label,
				title: ent.title,
				color: ent.color,
			});
			i += ent.text.length;
			continue;
		}

		/* whole-word action words (`jump`, `dash`, `land`) ------------------ */
		if (isAlpha(c)) {
			let j = i;
			while (j < src.length && isAlpha(src[j])) j++;
			const word = src.slice(i, j);
			const meaning = ACTION_WORDS[word.toLowerCase()];
			if (meaning) {
				push({
					kind: "modifier",
					raw: word,
					label: word,
					title: meaning,
					cls: "fgn-action",
				});
				i = j;
				continue;
			}
		}

		/* repeat counts: x3 ×3 *3 ------------------------------------------- */
		if ((c === "x" || c === "×" || c === "*") && isDigit(src[i + 1] ?? "")) {
			let j = i + 1;
			while (j < src.length && isDigit(src[j])) j++;
			const n = src.slice(i + 1, j);
			push({
				kind: "modifier",
				raw: src.slice(i, j),
				label: `×${n}`,
				title: `Repeat ${n} times`,
				cls: "fgn-repeat",
			});
			i = j;
			continue;
		}

		/* digits ------------------------------------------------------------ */
		if (isDigit(c)) {
			let j = i;
			while (j < src.length && isDigit(src[j])) j++;
			const run = src.slice(i, j);

			// Inside parentheses a bare number is an annotation (hit count),
			// not a direction: `236H(2)`.
			if (parenDepth > 0) {
				push({ kind: "punct", raw: run, label: run, cls: "fgn-annot" });
				i = j;
				continue;
			}

			if (numpad) {
				let k = 0;
				while (k < run.length) {
					const motion = matchMotion(run, k);
					if (motion && motion.token.length > 1) {
						push({
							kind: "motion",
							raw: motion.token,
							label: motion.token,
							title: `${motion.name} (${motion.abbr})`,
							icon: motion.icon,
						});
						k += motion.token.length;
						continue;
					}
					const dir = NUMPAD_DIRECTIONS[run[k]];
					if (dir) {
						push({
							kind: "direction",
							raw: dir.token,
							label: dir.token,
							title: dir.name,
							icon: dir.icon,
						});
					} else {
						push({ kind: "punct", raw: run[k], label: run[k], cls: "fgn-annot" });
					}
					k++;
				}
			} else {
				// Tekken / NRS: digits are buttons, matched one at a time.
				for (const d of run) {
					const e = matchEntry(d, 0, table, cs);
					if (e) {
						push({ kind: e.kind, raw: d, label: e.label, title: e.title, color: e.color });
					} else {
						push({ kind: "punct", raw: d, label: d, cls: "fgn-annot" });
					}
				}
			}
			i = j;
			continue;
		}

		/* structural punctuation --------------------------------------------- */
		if (c === "(" || c === ")" || c === "[" || c === "]" || c === "{" || c === "}") {
			if (c === "(") parenDepth++;
			if (c === ")") parenDepth = Math.max(0, parenDepth - 1);
			const hold = c === "[" || c === "]";
			push({
				kind: "punct",
				raw: c,
				label: c,
				title: hold ? "Hold / charge" : "Optional",
				cls: hold ? "fgn-hold" : "fgn-paren",
			});
			i++;
			continue;
		}

		if (c === "+" || c === "&") {
			push({ kind: "punct", raw: c, label: "+", title: "Pressed together", cls: "fgn-plus" });
			i++;
			continue;
		}

		/* unrecognised text --------------------------------------------------- */
		let j = i;
		while (j < src.length && isWordChar(src[j])) j++;
		if (j === i) j = i + 1; // single stray symbol
		const text = src.slice(i, j);
		push({ kind: "text", raw: text, label: text });
		i = j;
	}

	flush();
	return moves;
}
