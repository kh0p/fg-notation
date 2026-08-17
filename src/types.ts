/**
 * Core type definitions for the FG Notation plugin.
 */

/** How a game writes its directional inputs. */
export type NotationFamily =
	/** Numpad: 236H, 2MK, j.5P — digits are directions. (GG, SF, anime, Marvel...) */
	| "numpad"
	/** Tekken: f,b,d,u letters for directions; digits 1-4 are buttons. */
	| "tekken"
	/** NetherRealm: F/B/D/U letters for directions; digits 1-4 are buttons. */
	| "nrs";

export type TokenKind =
	/** An attack button: P, K, HP, 2, A... */
	| "button"
	/** A single direction: 2, 6, f, DB... */
	| "direction"
	/** A recognised motion input: 236, 41236, 22... */
	| "motion"
	/** A system mechanic: RC, DR, SA2, Heat, A1... */
	| "mechanic"
	/** A prefix/annotation: j., cl., dl., CH, (1), x3... */
	| "modifier"
	/** Separator between moves: >, ,, xx, ~ */
	| "connector"
	/** Unrecognised text — a named move, a stance, prose. */
	| "text"
	/** Structural punctuation kept for layout: [ ] ( ) + */
	| "punct";

export interface Token {
	kind: TokenKind;
	/** The exact source text this token was matched from. */
	raw: string;
	/** What to display. Defaults to `raw`. */
	label: string;
	/** Tooltip / aria description. */
	title?: string;
	/** CSS colour (hex or var()) for button/mechanic tokens. */
	color?: string;
	/** For directions & motions: the icon key used in image mode. */
	icon?: string;
	/** Extra CSS classes. */
	cls?: string;
}

/** A run of tokens that renders as one visual chip. */
export interface Move {
	tokens: Token[];
	/** The connector that *follows* this move, if any. */
	connector?: Token;
}

export interface ButtonDef {
	/** Canonical token as written in notation. */
	token: string;
	/** Alternative spellings that map to this button. */
	aliases?: string[];
	/** Display text. Defaults to the matched token. */
	label?: string;
	/** Human name, shown in the tooltip. */
	name: string;
	/** Colour. Either a hex value or a `var(--...)` reference. */
	color: string;
}

export interface MechanicDef {
	token: string;
	aliases?: string[];
	label?: string;
	name: string;
	color?: string;
	/** Render as a wide pill rather than an inline token. */
	pill?: boolean;
}

export interface GameProfile {
	/** Lowercase id used after `fg:` — e.g. `tokon`. */
	id: string;
	/** Full game name. */
	name: string;
	/** Short badge text shown in the rendered header. */
	short: string;
	/** Other ids that resolve to this profile. */
	aliases: string[];
	family: NotationFamily;
	/**
	 * When true, `f` and `F` are different tokens (Tekken hold-vs-tap).
	 * When false the tokenizer falls back to a case-insensitive match.
	 */
	caseSensitive: boolean;
	/** Accent colour for the header badge. */
	accent: string;
	buttons: ButtonDef[];
	mechanics: MechanicDef[];
	/** Game-specific prefixes on top of the universal set. */
	modifiers?: MechanicDef[];
	/** Directions written as letters (Tekken / NRS families). */
	directions?: MechanicDef[];
	/** Notes shown in the settings tab / hover. */
	blurb?: string;
}

/** One combo parsed out of a code block. */
export interface Combo {
	input: string;
	name?: string;
	damage?: string;
	hits?: string;
	character?: string;
	meter?: string;
	position?: string;
	worksOn?: string;
	difficulty?: string;
	video?: string;
	notes?: string;
	tags?: string[];
	/** Any field the plugin does not know about, preserved in order. */
	extra: Array<{ key: string; value: string }>;
}

export interface BlockOptions {
	/** Render directions/motions as icons instead of text. */
	img: boolean;
	/** Tighter layout, no card chrome. */
	compact: boolean;
	/** No chips — colourised plain text only. */
	plain: boolean;
	/** Hide the game badge. */
	nobadge: boolean;
	/** Force a specific size. */
	size?: "sm" | "md" | "lg";
}

export interface ParsedBlock {
	gameId: string;
	options: BlockOptions;
	combos: Combo[];
	errors: string[];
}
