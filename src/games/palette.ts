import type { ButtonDef, MechanicDef } from "../types";

/**
 * Shared colour vocabulary.
 *
 * Most fighting games colour their notation by attack *strength*, so the base
 * palette is strength-first. Games that have an established wiki palette of
 * their own (Guilty Gear especially) override these locally.
 *
 * Values are picked to stay legible against both Obsidian themes; the rendered
 * chip darkens/lightens them at paint time rather than swapping the hue.
 */
export const C = {
	light: "#3fa9f5",
	medium: "#f5c542",
	heavy: "#f0554f",
	special: "#3fd07f",
	unique: "#a874ff",
	assist: "#ff6fb5",
	super: "#ffd24a",
	drive: "#38d6c4",
	system: "#94a3b8",
	punch: "#4a9df5",
	kick: "#f5a13f",
	throw: "#e2725b",
	dust: "#f59a3f",
} as const;

/** Terse constructor for a button definition. */
export function btn(
	token: string,
	name: string,
	color: string,
	aliases?: string[],
): ButtonDef {
	return aliases ? { token, name, color, aliases } : { token, name, color };
}

/** Terse constructor for a system-mechanic definition. */
export function mech(
	token: string,
	name: string,
	color?: string,
	aliases?: string[],
): MechanicDef {
	const d: MechanicDef = { token, name };
	if (color) d.color = color;
	if (aliases) d.aliases = aliases;
	return d;
}
