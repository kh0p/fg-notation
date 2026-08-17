/**
 * Notation constructs that are shared across (nearly) every fighting game:
 * numpad directions, motion inputs, connectors, prefixes and action words.
 */

import type { MechanicDef } from "../types";

/* -------------------------------------------------------------------------- */
/* Numpad directions                                                          */
/* -------------------------------------------------------------------------- */

export interface DirectionDef {
	token: string;
	name: string;
	/** Icon key -> see icons.ts */
	icon: string;
}

/** Numpad layout, as seen from player-1 side facing right. */
export const NUMPAD_DIRECTIONS: Record<string, DirectionDef> = {
	"1": { token: "1", name: "Down-back", icon: "d1" },
	"2": { token: "2", name: "Down", icon: "d2" },
	"3": { token: "3", name: "Down-forward", icon: "d3" },
	"4": { token: "4", name: "Back", icon: "d4" },
	"5": { token: "5", name: "Neutral", icon: "d5" },
	"6": { token: "6", name: "Forward", icon: "d6" },
	"7": { token: "7", name: "Up-back", icon: "d7" },
	"8": { token: "8", name: "Up", icon: "d8" },
	"9": { token: "9", name: "Up-forward", icon: "d9" },
};

/* -------------------------------------------------------------------------- */
/* Motion inputs                                                              */
/* -------------------------------------------------------------------------- */

export interface MotionDef {
	token: string;
	name: string;
	/** Short display form used when the block is in `compact` mode. */
	abbr: string;
	icon: string;
}

/**
 * Ordered longest-first: the tokenizer relies on this order to greedily
 * consume a run of digits (so `632146` never degrades into `63` + `214` + `6`).
 */
export const MOTIONS: MotionDef[] = [
	{ token: "6321463214", name: "Double half-circle back", abbr: "HCB×2", icon: "hcb2" },
	{ token: "4123641236", name: "Double half-circle forward", abbr: "HCF×2", icon: "hcf2" },
	{ token: "2363214", name: "Quarter-circle forward, half-circle back", abbr: "QCF+HCB", icon: "qcf" },
	{ token: "632146", name: "Half-circle back, forward", abbr: "HCB→F", icon: "hcb" },
	{ token: "412364", name: "Half-circle forward, back", abbr: "HCF→B", icon: "hcf" },
	{ token: "236236", name: "Double quarter-circle forward", abbr: "QCF×2", icon: "qcf2" },
	{ token: "214214", name: "Double quarter-circle back", abbr: "QCB×2", icon: "qcb2" },
	{ token: "623623", name: "Double dragon punch", abbr: "DP×2", icon: "dp2" },
	{ token: "421421", name: "Double reverse dragon punch", abbr: "RDP×2", icon: "rdp2" },
	{ token: "41236", name: "Half-circle forward", abbr: "HCF", icon: "hcf" },
	{ token: "63214", name: "Half-circle back", abbr: "HCB", icon: "hcb" },
	{ token: "2141236", name: "Quarter-circle back, half-circle forward", abbr: "QCB+HCF", icon: "hcf" },
	{ token: "720", name: "Double full-circle", abbr: "720", icon: "spin720" },
	{ token: "360", name: "Full circle", abbr: "360", icon: "spin360" },
	{ token: "623", name: "Dragon punch", abbr: "DP", icon: "dp" },
	{ token: "421", name: "Reverse dragon punch", abbr: "RDP", icon: "rdp" },
	{ token: "236", name: "Quarter-circle forward", abbr: "QCF", icon: "qcf" },
	{ token: "214", name: "Quarter-circle back", abbr: "QCB", icon: "qcb" },
	{ token: "66", name: "Dash forward", abbr: "Dash", icon: "dash6" },
	{ token: "44", name: "Dash back", abbr: "Backdash", icon: "dash4" },
	{ token: "22", name: "Down, down", abbr: "22", icon: "dd" },
	{ token: "88", name: "Up, up", abbr: "88", icon: "uu" },
	{ token: "46", name: "Charge back, forward", abbr: "[4]6", icon: "charge46" },
	{ token: "28", name: "Charge down, up", abbr: "[2]8", icon: "charge28" },
];

/* -------------------------------------------------------------------------- */
/* Connectors                                                                 */
/* -------------------------------------------------------------------------- */

export interface ConnectorDef {
	token: string;
	name: string;
	/** Display glyph. */
	glyph: string;
	cls: string;
}

/** Longest-first. `->` must beat `-`, `xx` must beat `x`. */
export const CONNECTORS: ConnectorDef[] = [
	{ token: "->", name: "Then", glyph: "›", cls: "fgn-c-then" },
	{ token: "=>", name: "Then", glyph: "›", cls: "fgn-c-then" },
	{ token: "→", name: "Then", glyph: "›", cls: "fgn-c-then" },
	{ token: "xx", name: "Cancel into", glyph: "xx", cls: "fgn-c-cancel" },
	{ token: "XX", name: "Cancel into", glyph: "xx", cls: "fgn-c-cancel" },
	{ token: ">>", name: "Then", glyph: "»", cls: "fgn-c-then" },
	{ token: ">", name: "Then / cancel into", glyph: "›", cls: "fgn-c-then" },
	{ token: ",", name: "Link (wait for recovery)", glyph: ",", cls: "fgn-c-link" },
	{ token: "~", name: "Immediately after / slide input", glyph: "~", cls: "fgn-c-imm" },
	{ token: "/", name: "Or", glyph: "/", cls: "fgn-c-or" },
	{ token: "|", name: "Or", glyph: "/", cls: "fgn-c-or" },
];

/* -------------------------------------------------------------------------- */
/* Universal prefixes / annotations                                           */
/* -------------------------------------------------------------------------- */

export const UNIVERSAL_MODIFIERS: MechanicDef[] = [
	{ token: "j.", aliases: ["j"], label: "j.", name: "In the air (jumping)" },
	{ token: "sj.", aliases: ["sj"], label: "sj.", name: "Super jump" },
	{ token: "hj.", aliases: ["hj"], label: "hj.", name: "High jump" },
	{ token: "jc", name: "Jump cancel" },
	{ token: "sjc", name: "Super jump cancel" },
	{ token: "hjc", name: "High jump cancel" },
	{ token: "cl.", aliases: ["cl"], label: "cl.", name: "Close (point blank)" },
	{ token: "f.", label: "f.", name: "Far" },
	{ token: "c.", label: "c.", name: "Close" },
	{ token: "st.", aliases: ["s."], label: "st.", name: "Standing" },
	{ token: "cr.", label: "cr.", name: "Crouching" },
	{ token: "n.", label: "n.", name: "Neutral" },
	{ token: "dl.", aliases: ["dl", "delay"], label: "dl.", name: "Delay the next input" },
	{ token: "w.", label: "w.", name: "Whiff (intentionally miss)" },
	{ token: "TK", aliases: ["tk."], name: "Tiger Knee (air special done as low as possible)" },
	{ token: "IAD", name: "Instant air dash" },
	{ token: "IABD", name: "Instant air backdash" },
	{ token: "IAB", name: "Instant air backdash" },
	{ token: "md", name: "Microdash" },
	{ token: "CH", name: "Counter hit" },
	{ token: "PC", name: "Punish counter" },
	{ token: "OTG", name: "Off the ground" },
	{ token: "KD", name: "Knockdown" },
	{ token: "AA", name: "Anti-air" },
	{ token: "OS", name: "Option select" },
	{ token: "P1", name: "Player 1 side" },
	{ token: "P2", name: "Player 2 side" },
];

/* -------------------------------------------------------------------------- */
/* Action words                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Plain-English steps that show up mid-combo. Rendered in a muted italic
 * style so they read as stage directions rather than inputs.
 */
export const ACTION_WORDS: Record<string, string> = {
	jump: "Jump",
	"super jump": "Super jump",
	superjump: "Super jump",
	highjump: "High jump",
	hop: "Short hop",
	land: "Land",
	landing: "Land",
	dash: "Dash forward",
	backdash: "Dash backward",
	microdash: "Micro-dash",
	airdash: "Air dash",
	walk: "Walk forward",
	run: "Run",
	crouch: "Crouch",
	stand: "Stand",
	delay: "Delay",
	wait: "Wait",
	pause: "Pause",
	whiff: "Whiff (intentional miss)",
	hold: "Hold the input",
	release: "Release the input",
	dc: "Dash cancel",
	tag: "Tag partner in",
	switch: "Switch character",
	assist: "Call assist",
	otg: "Off the ground",
	wallbreak: "Wall break",
	wallsplat: "Wall splat",
	sideswitch: "Side switch",
	crossup: "Cross-up",
	repeat: "Repeat",
	loop: "Loop the sequence",
	ender: "Ender",
	starter: "Starter",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MOTION_MAP = new Map(MOTIONS.map((m) => [m.token, m]));

/** Longest motion that is a prefix of `digits` starting at `from`. */
export function matchMotion(digits: string, from: number): MotionDef | null {
	for (const m of MOTIONS) {
		if (digits.startsWith(m.token, from)) return m;
	}
	return null;
}

export function getMotion(token: string): MotionDef | undefined {
	return MOTION_MAP.get(token);
}
