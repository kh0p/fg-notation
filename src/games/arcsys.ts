import type { GameProfile } from "../types";
import { C, btn, mech } from "./palette";

/**
 * Arc System Works games.
 *
 * Guilty Gear is the one series whose notation the community reads *by colour*
 * (Dustloop tints P/K/S/H/D), so it gets a dedicated hue per button instead of
 * the strength palette. These hues follow Dustloop's scheme by eye — they are
 * tuned for Obsidian's two themes, not sampled from the site.
 */
const GG_COLORS = {
	P: "#ec4899",
	K: "#3b9ef5",
	S: "#22c55e",
	H: "#ef4444",
	D: "#f97316",
};

export const GGST: GameProfile = {
	id: "ggst",
	name: "Guilty Gear -Strive-",
	short: "GGST",
	aliases: ["strive", "gg", "ggs"],
	family: "numpad",
	caseSensitive: false,
	accent: "#e11d48",
	blurb: "P/K/S/H/D. f.S and c.S are separate normals.",
	buttons: [
		btn("P", "Punch", GG_COLORS.P),
		btn("K", "Kick", GG_COLORS.K),
		btn("S", "Slash", GG_COLORS.S),
		btn("HS", "Heavy Slash", GG_COLORS.H, ["H"]),
		btn("D", "Dust", GG_COLORS.D),
	],
	mechanics: [
		mech("RC", "Roman Cancel", C.unique),
		mech("RRC", "Red Roman Cancel", "#ef4444"),
		mech("YRC", "Yellow Roman Cancel", "#eab308"),
		mech("PRC", "Purple Roman Cancel", "#a855f7"),
		mech("BRC", "Blue Roman Cancel", "#3b82f6"),
		mech("WA", "Wild Assault", C.drive),
		mech("DS", "Deflect Shield", C.drive),
		mech("FD", "Faultless Defense", C.system),
		mech("IB", "Instant Block", C.system),
		mech("OD", "Overdrive (super)", C.super),
		mech("Burst", "Psych Burst", C.super),
		mech("Gatling", "Gatling (normal chain)", C.system),
	],
};

export const GGXRD: GameProfile = {
	id: "ggxrd",
	name: "Guilty Gear Xrd / XX Accent Core +R",
	short: "GG Xrd",
	aliases: ["xrd", "accentcore", "acplusr", "ggacr", "plusr"],
	family: "numpad",
	caseSensitive: false,
	accent: "#b91c1c",
	buttons: [
		btn("P", "Punch", GG_COLORS.P),
		btn("K", "Kick", GG_COLORS.K),
		btn("S", "Slash", GG_COLORS.S),
		btn("HS", "Heavy Slash", GG_COLORS.H, ["H"]),
		btn("D", "Dust", GG_COLORS.D),
	],
	mechanics: [
		mech("RC", "Roman Cancel", C.unique),
		mech("YRC", "Yellow Roman Cancel", "#eab308"),
		mech("PRC", "Purple Roman Cancel", "#a855f7"),
		mech("FRC", "False Roman Cancel", "#a855f7"),
		mech("FD", "Faultless Defense", C.system),
		mech("DAA", "Dead Angle Attack", C.system),
		mech("Burst", "Psych Burst", C.super),
		mech("IK", "Instant Kill", C.super),
	],
};

export const GBVSR: GameProfile = {
	id: "gbvsr",
	name: "Granblue Fantasy Versus: Rising",
	short: "GBVSR",
	aliases: ["gbvs", "granblue", "gbfvr"],
	family: "numpad",
	caseSensitive: false,
	accent: "#38bdf8",
	blurb: "L/M/H attacks plus U (Unique). Skills use motions or the Skill button.",
	buttons: [
		btn("L", "Light", C.light),
		btn("M", "Medium", C.medium),
		btn("H", "Heavy", C.heavy),
		btn("U", "Unique attack", C.unique),
	],
	mechanics: [
		mech("SBA", "Skybound Art", C.super),
		mech("SSBA", "Super Skybound Art", C.super),
		mech("BC", "Brave Counter", C.drive),
		mech("RS", "Raging Strike", C.drive),
		mech("RC", "Raging Chain", C.drive),
		mech("UT", "Ultimate Skill", C.special),
		mech("EX", "Enhanced skill", C.special),
		mech("DS", "Dodge", C.system),
		mech("GC", "Guard cancel", C.system),
		mech("BB", "Brave Burst", C.super),
	],
};

export const BBCF: GameProfile = {
	id: "bbcf",
	name: "BlazBlue: Centralfiction",
	short: "BBCF",
	aliases: ["blazblue", "bb", "bbtag"],
	family: "numpad",
	caseSensitive: false,
	accent: "#7c3aed",
	buttons: [
		btn("A", "Light attack", C.light),
		btn("B", "Medium attack", C.medium),
		btn("C", "Heavy attack", C.heavy),
		btn("D", "Drive", C.unique),
	],
	mechanics: [
		mech("RC", "Rapid Cancel", C.unique),
		mech("CA", "Counter Assault", C.drive),
		mech("OD", "Overdrive", C.super),
		mech("DD", "Distortion Drive (super)", C.super),
		mech("ED", "Exceed Accel", C.super),
		mech("Astral", "Astral Heat", C.super),
		mech("Barrier", "Barrier Block", C.system),
		mech("CT", "Crush Trigger", C.drive),
		mech("P", "Partner call (Cross Tag)", C.assist),
	],
};

export const ARCSYS_GAMES = [GGST, GGXRD, GBVSR, BBCF];
