import type { GameProfile } from "../types";
import { C, btn, mech } from "./palette";

/**
 * 3D fighters.
 *
 * Tekken is the odd one out across the whole plugin: digits 1–4 are *buttons*,
 * directions are letters, and capitalisation is meaningful (`f` taps forward,
 * `F` holds it). Its profile is therefore the only case-sensitive one.
 */

const TEKKEN_DIRECTIONS = [
	mech("f", "Tap forward"),
	mech("b", "Tap back"),
	mech("d", "Tap down"),
	mech("u", "Tap up"),
	mech("df", "Tap down-forward"),
	mech("db", "Tap down-back"),
	mech("uf", "Tap up-forward"),
	mech("ub", "Tap up-back"),
	mech("n", "Neutral"),
	mech("F", "Hold forward"),
	mech("B", "Hold back"),
	mech("D", "Hold down"),
	mech("U", "Hold up"),
	mech("DF", "Hold down-forward"),
	mech("DB", "Hold down-back"),
	mech("UF", "Hold up-forward"),
	mech("UB", "Hold up-back"),
];

export const TEKKEN: GameProfile = {
	id: "tekken",
	name: "Tekken 8",
	short: "T8",
	aliases: ["tekken8", "t8", "tekken7", "t7", "tk"],
	family: "tekken",
	caseSensitive: true,
	accent: "#8b5cf6",
	blurb: "1=LP 2=RP 3=LK 4=RK. Lowercase taps a direction, UPPERCASE holds it.",
	buttons: [
		btn("1", "Left punch", C.punch),
		btn("2", "Right punch", "#7ab7f7"),
		btn("3", "Left kick", C.kick),
		btn("4", "Right kick", "#f7c07a"),
	],
	directions: TEKKEN_DIRECTIONS,
	mechanics: [
		mech("WS", "While standing (rising from crouch)", C.system),
		mech("FC", "Full crouch", C.system),
		mech("SS", "Sidestep", C.system),
		mech("SSL", "Sidestep left", C.system),
		mech("SSR", "Sidestep right", C.system),
		mech("CD", "Crouch dash", C.system),
		mech("WR", "While running", C.system),
		mech("BT", "Back turned", C.system),
		mech("iWS", "Instant while standing", C.system),
		mech("RA", "Rage Art", C.super),
		mech("RD", "Rage Drive", C.super),
		mech("HB", "Heat Burst", C.drive),
		mech("HS", "Heat Smash", C.drive),
		mech("HE", "Heat Engager", C.drive),
		mech("Heat", "Heat state", C.drive),
		mech("EWGF", "Electric Wind God Fist", C.unique),
		mech("WGF", "Wind God Fist", C.unique),
		mech("KND", "Knockdown", C.system),
		mech("W!", "Wall splat", C.system),
		mech("T!", "Tornado / screw", C.system),
		mech("B!", "Bound", C.system),
		mech("S!", "Screw", C.system),
	],
};

export const VF5: GameProfile = {
	id: "vf5",
	name: "Virtua Fighter 5: Ultimate Showdown",
	short: "VF5",
	aliases: ["vf", "vf5us", "virtuafighter"],
	family: "numpad",
	caseSensitive: false,
	accent: "#0ea5e9",
	blurb: "P / K / G with numpad directions.",
	buttons: [
		btn("P", "Punch", C.punch),
		btn("K", "Kick", C.kick),
		btn("G", "Guard", C.system),
	],
	mechanics: [
		mech("PK", "Punch + Kick", C.special),
		mech("PG", "Punch + Guard", C.special),
		mech("KG", "Kick + Guard", C.special),
		mech("EVA", "Evade", C.system),
		mech("WS", "While standing", C.system),
	],
};

export const SC6: GameProfile = {
	id: "sc6",
	name: "Soulcalibur VI",
	short: "SCVI",
	aliases: ["sc", "soulcalibur", "scvi"],
	family: "numpad",
	caseSensitive: false,
	accent: "#22d3ee",
	blurb: "A horizontal, B vertical, K kick, G guard.",
	buttons: [
		btn("A", "Horizontal attack", C.light),
		btn("B", "Vertical attack", C.heavy),
		btn("K", "Kick", C.kick),
		btn("G", "Guard", C.system),
	],
	mechanics: [
		mech("RE", "Reversal Edge", C.drive),
		mech("SC", "Soul Charge", C.super),
		mech("CE", "Critical Edge", C.super),
		mech("GI", "Guard Impact", C.system),
		mech("WS", "While rising", C.system),
		mech("BT", "Back turned", C.system),
		mech("LH", "Lethal Hit", C.unique),
	],
};

export const THREED_GAMES = [TEKKEN, VF5, SC6];
