import type { GameProfile } from "../types";
import { C, btn, mech } from "./palette";

/**
 * Tag / assist games. What sets these apart for the tokenizer is that a
 * *button-looking* token (A, A1, A2) means "call a partner", so assists get
 * their own colour and are never confused with an attack.
 */

export const TOKON: GameProfile = {
	id: "tokon",
	name: "MARVEL Tōkon: Fighting Souls",
	short: "Tōkon",
	aliases: ["marveltokon", "mtfs", "tokonfs"],
	family: "numpad",
	caseSensitive: false,
	accent: "#e23636",
	blurb: "4v4 tag fighter. L/M/H/U attacks, A for Assemble (assists).",
	buttons: [
		btn("L", "Light", C.light),
		btn("M", "Medium", C.medium),
		btn("H", "Heavy", C.heavy),
		btn("U", "Unique — character signature move", C.unique),
		btn("A", "Assemble — call assist / team follow-up", C.assist),
	],
	mechanics: [
		mech("QA", "Quick Assemble — team actions & character switch", C.assist),
		mech("QD", "Quick Dash", C.drive),
		mech("QS", "Quick Skill — one-button special", C.special),
		mech("EX", "EX special (25 Skill gauge)", C.special),
		mech("SS", "Super Skill (50 Skill gauge)", C.super),
		mech("US", "Ultimate Skill (100 Skill gauge)", C.super),
		mech("TA", "Tōkon Assemble finisher (150 Skill gauge)", C.super),
		mech("AS", "Assemble Smash", C.assist),
		mech("AC", "Assemble Counter", C.assist),
		mech("CO", "Crossover", C.assist),
		mech("A1", "Assist 1 — Shooter (5A / 6A)", C.assist),
		mech("A2", "Assist 2 — Vertical / anti-air (2A)", C.assist),
		mech("A3", "Assist 3 — Assault (4A)", C.assist),
		mech("MH", "Throw (M+H)", C.throw),
	],
};

export const MVC3: GameProfile = {
	id: "mvc3",
	name: "Ultimate Marvel vs. Capcom 3",
	short: "UMvC3",
	aliases: ["umvc3", "mvc", "mvci", "mvc2"],
	family: "numpad",
	caseSensitive: false,
	accent: "#2f6fd0",
	buttons: [
		btn("L", "Light", C.light),
		btn("M", "Medium", C.medium),
		btn("H", "Heavy", C.heavy),
		btn("S", "Special / launcher", C.special),
		btn("A1", "Assist 1", C.assist),
		btn("A2", "Assist 2", C.assist),
	],
	mechanics: [
		mech("DHC", "Delayed Hyper Combo", C.super),
		mech("THC", "Team Hyper Combo", C.super),
		mech("XF", "X-Factor", C.unique, ["XFC"]),
		mech("TAC", "Team Aerial Combo", C.assist),
		mech("SJ", "Super jump", C.system),
		mech("ADDF", "Air dash down-forward", C.system),
		mech("ADF", "Air dash forward", C.system),
		mech("Snapback", "Snapback", C.assist),
		mech("Wavedash", "Wavedash", C.system),
	],
};

export const DBFZ: GameProfile = {
	id: "dbfz",
	name: "Dragon Ball FighterZ",
	short: "DBFZ",
	aliases: ["dbf", "fighterz"],
	family: "numpad",
	caseSensitive: false,
	accent: "#f5a623",
	buttons: [
		btn("L", "Light", C.light),
		btn("M", "Medium", C.medium),
		btn("H", "Heavy", C.heavy),
		btn("S", "Special", C.special),
		btn("A1", "Z-Assist 1", C.assist),
		btn("A2", "Z-Assist 2", C.assist),
	],
	mechanics: [
		mech("SD", "Super Dash", C.drive),
		mech("VA", "Vanish", C.unique),
		mech("DR", "Dragon Rush", C.throw),
		mech("Sparking", "Sparking Blast", C.super),
		mech("SB", "Sparking Blast", C.super),
		mech("ZC", "Z-Change (tag)", C.assist),
		mech("SKD", "Sliding knockdown", C.system),
		mech("IAD", "Instant air dash", C.system),
	],
};

export const SKULLGIRLS: GameProfile = {
	id: "sg",
	name: "Skullgirls",
	short: "SG",
	aliases: ["skullgirls", "sg2e"],
	family: "numpad",
	caseSensitive: false,
	accent: "#c0392b",
	buttons: [
		btn("LP", "Light punch", C.light),
		btn("MP", "Medium punch", C.medium),
		btn("HP", "Heavy punch", C.heavy),
		btn("LK", "Light kick", C.light),
		btn("MK", "Medium kick", C.medium),
		btn("HK", "Heavy kick", C.heavy),
	],
	mechanics: [
		mech("A1", "Assist 1", C.assist),
		mech("A2", "Assist 2", C.assist),
		mech("PBGC", "Push-block guard cancel", C.system),
		mech("IPS", "Infinite Prevention System", C.system),
		mech("Snapback", "Snapback", C.assist),
	],
};

export const MARVEL_GAMES = [TOKON, MVC3, DBFZ, SKULLGIRLS];
