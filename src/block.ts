import type { BlockOptions, Combo, ParsedBlock } from "./types";
import { isKnownGame } from "./games";

/** Canonical field name for each accepted spelling. */
const FIELD_ALIASES: Record<string, keyof Combo | "tags"> = {
	input: "input",
	combo: "input",
	notation: "input",
	inputs: "input",
	name: "name",
	title: "name",
	damage: "damage",
	dmg: "damage",
	dam: "damage",
	hits: "hits",
	hit: "hits",
	character: "character",
	char: "character",
	who: "character",
	meter: "meter",
	cost: "meter",
	gauge: "meter",
	bar: "meter",
	position: "position",
	pos: "position",
	where: "position",
	works: "worksOn",
	workson: "worksOn",
	"works on": "worksOn",
	difficulty: "difficulty",
	diff: "difficulty",
	video: "video",
	link: "video",
	url: "video",
	notes: "notes",
	note: "notes",
	comment: "notes",
	tags: "tags",
	tag: "tags",
};

/** `key: value` where the colon is followed by a space or end of line. */
const FIELD_RE = /^([A-Za-z][A-Za-z0-9 _-]{0,24}):(?:[ \t]+(.*))?$/;

function emptyCombo(): Combo {
	return { input: "", extra: [] };
}

function comboIsEmpty(c: Combo): boolean {
	return (
		!c.input.trim() &&
		!c.name &&
		!c.notes &&
		!c.damage &&
		!c.hits &&
		c.extra.length === 0
	);
}

/** Opening fence, capturing the full info string. */
const FENCE_LINE_RE = /^\s*(?:`{3,}|~{3,})\s*(\S*)/;

/**
 * Pull the full info string out of an opening fence line.
 *
 * This matters because Obsidian truncates the language at the first `:` in
 * Live Preview (its fence regex captures `[\w/+#-]*`), so `fg:tokon:img`
 * reaches a code-block processor as plain `fg`. Reading the fence line back
 * from the document is the only way to recover the game and the options.
 */
export function extractFenceLang(line: string): string {
	return line.match(FENCE_LINE_RE)?.[1] ?? "";
}

/** Does this info string address this plugin? */
export function isFgLang(lang: string): boolean {
	return /^fg(:|$)/i.test(lang);
}

/**
 * Parse the language string that follows the opening fence.
 *
 * `fg:tokon:img:compact` -> { gameId: "tokon", options: { img: true, ... } }
 */
export function parseLanguage(lang: string): {
	gameId: string;
	options: BlockOptions;
	unknownGame: string | null;
} {
	const options: BlockOptions = {
		img: false,
		compact: false,
		plain: false,
		nobadge: false,
	};

	const parts = lang
		.split(":")
		.map((p) => p.trim().toLowerCase())
		.filter(Boolean);

	// parts[0] is always the `fg` prefix itself.
	let gameId = "";
	let unknownGame: string | null = null;

	for (let idx = 1; idx < parts.length; idx++) {
		const p = parts[idx];
		switch (p) {
			case "img":
			case "icons":
			case "image":
				options.img = true;
				break;
			case "compact":
			case "inline":
				options.compact = true;
				break;
			case "plain":
			case "text":
				options.plain = true;
				break;
			case "nobadge":
				options.nobadge = true;
				break;
			case "sm":
			case "small":
				options.size = "sm";
				break;
			case "md":
				options.size = "md";
				break;
			case "lg":
			case "big":
			case "large":
				options.size = "lg";
				break;
			default:
				// The first non-option segment is the game.
				if (!gameId) {
					gameId = p;
					if (!isKnownGame(p)) unknownGame = p;
				}
		}
	}

	return { gameId, options, unknownGame };
}

/**
 * Parse the body of an `fg` block.
 *
 * Accepts `key: value` fields, bare notation (everything that is not a field
 * becomes/extends the input), and `---` to separate several combos in one
 * block.
 */
export function parseBody(source: string): { combos: Combo[]; errors: string[] } {
	const errors: string[] = [];
	const combos: Combo[] = [];

	let combo = emptyCombo();
	/** Field the previous line wrote to, so wrapped lines continue it. */
	let lastField: string | null = null;

	const commit = () => {
		if (!comboIsEmpty(combo)) combos.push(combo);
		combo = emptyCombo();
		lastField = null;
	};

	for (const rawLine of source.split("\n")) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();

		if (!trimmed) {
			lastField = null;
			continue;
		}

		// Combo separator.
		if (/^-{3,}$/.test(trimmed) || /^={3,}$/.test(trimmed)) {
			commit();
			continue;
		}

		// Comment.
		if (trimmed.startsWith("//") || trimmed.startsWith("#")) continue;

		const m = trimmed.match(FIELD_RE);
		const key = m ? m[1].trim().toLowerCase() : null;
		const canonical = key ? FIELD_ALIASES[key] : undefined;

		if (m && canonical) {
			const value = (m[2] ?? "").trim();
			if (canonical === "tags") {
				combo.tags = value
					.split(/[,\s]+/)
					.map((t) => t.replace(/^#/, ""))
					.filter(Boolean);
			} else if (canonical === "input") {
				combo.input = combo.input ? `${combo.input} ${value}` : value;
			} else {
				(combo as unknown as Record<string, string>)[canonical] = value;
			}
			lastField = canonical;
			continue;
		}

		if (m && key) {
			// A `key: value` line we do not recognise — keep it verbatim.
			combo.extra.push({ key: m[1].trim(), value: (m[2] ?? "").trim() });
			lastField = null;
			continue;
		}

		// Not a field: continue the previous one, or treat as bare notation.
		if (lastField === "notes") {
			combo.notes = combo.notes ? `${combo.notes} ${trimmed}` : trimmed;
		} else {
			combo.input = combo.input ? `${combo.input} ${trimmed}` : trimmed;
			lastField = "input";
		}
	}

	commit();

	if (combos.length === 0) {
		errors.push("Nothing to render — add an `input:` line or a bare notation line.");
	}

	return { combos, errors };
}

export function parseBlock(lang: string, source: string): ParsedBlock {
	const { gameId, options, unknownGame } = parseLanguage(lang);
	const { combos, errors } = parseBody(source);

	if (unknownGame) {
		errors.push(
			`Unknown game \`${unknownGame}\` — falling back to generic notation. Check the plugin settings for the list of supported ids.`,
		);
	}

	return { gameId, options, combos, errors };
}
