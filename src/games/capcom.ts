import type { GameProfile } from "../types";
import { C, btn, mech } from "./palette";

/**
 * Six-button Capcom games. Punch/kick share the strength palette; the
 * punch-vs-kick distinction is carried by a small marker in the chip rather
 * than by hue, which keeps three strengths readable instead of six.
 */

const SIX_BUTTONS = [
	btn("LP", "Light punch", C.light, ["lp"]),
	btn("MP", "Medium punch", C.medium, ["mp"]),
	btn("HP", "Heavy punch", C.heavy, ["hp"]),
	btn("LK", "Light kick", C.light, ["lk"]),
	btn("MK", "Medium kick", C.medium, ["mk"]),
	btn("HK", "Heavy kick", C.heavy, ["hk"]),
	btn("P", "Any punch", C.punch),
	btn("K", "Any kick", C.kick),
];

export const SF6: GameProfile = {
	id: "sf6",
	name: "Street Fighter 6",
	short: "SF6",
	aliases: ["sf", "streetfighter6", "sfvi"],
	family: "numpad",
	caseSensitive: false,
	accent: "#f2b134",
	blurb: "Numpad notation, Drive system, SA1–SA3 supers.",
	buttons: SIX_BUTTONS,
	mechanics: [
		mech("DR", "Drive Rush", C.drive),
		mech("DRC", "Drive Rush Cancel", C.drive),
		mech("DI", "Drive Impact", C.drive),
		mech("DP", "Drive Parry", C.drive),
		mech("PP", "Perfect Parry", C.drive),
		mech("OD", "Overdrive (EX) special", C.special),
		mech("EX", "EX / Overdrive special", C.special),
		mech("SA1", "Super Art 1", C.super),
		mech("SA2", "Super Art 2", C.super),
		mech("SA3", "Super Art 3 / Critical Art", C.super),
		mech("CA", "Critical Art", C.super),
		mech("DIC", "Drive Impact crumple", C.drive),
		mech("DRush", "Drive Rush", C.drive),
		mech("SAC", "Super Art cancel", C.super),
		mech("BO", "Burnout", C.system),
	],
};

export const SF3: GameProfile = {
	id: "sf3",
	name: "Street Fighter III: 3rd Strike",
	short: "3S",
	aliases: ["3s", "sfiii", "thirdstrike", "sf5", "sfv"],
	family: "numpad",
	caseSensitive: false,
	accent: "#d94f4f",
	buttons: SIX_BUTTONS,
	mechanics: [
		mech("SA1", "Super Art 1", C.super),
		mech("SA2", "Super Art 2", C.super),
		mech("SA3", "Super Art 3", C.super),
		mech("EX", "EX special", C.special),
		mech("RP", "Red parry", C.drive),
		mech("UOH", "Universal overhead", C.system),
		mech("KKK", "All three kicks", C.kick),
		mech("PPP", "All three punches", C.punch),
		mech("VT", "V-Trigger", C.unique),
		mech("VS", "V-Skill", C.unique),
		mech("VR", "V-Reversal", C.unique),
		mech("CC", "Critical Art", C.super),
	],
};

export const CAPCOM_GAMES = [SF6, SF3];
