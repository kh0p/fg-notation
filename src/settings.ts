import type { GameProfile } from "./types";

export interface FgSettings {
	/** Used for a bare ```fg block with no game id. */
	defaultGame: string;
	/** Render directions as arrow glyphs everywhere (`:img` forces it on). */
	iconsByDefault: boolean;
	/** Colour attack buttons. */
	colorButtons: boolean;
	/** Show the game badge in the card header. */
	showBadge: boolean;
	/** Native tooltips describing each token. */
	showTooltips: boolean;
	/** Show a copy-to-clipboard button on each combo. */
	showCopyButton: boolean;
	/** Base size of the rendered notation. */
	size: "sm" | "md" | "lg";
	/** Draw each move as a chip; off = plain coloured text. */
	chips: boolean;
	/** Offer field/game completion while typing inside an fg block. */
	autocomplete: boolean;
	/** Fields inserted by the autocomplete template, in order. */
	templateFields: string[];
	/** User-defined game profiles (JSON-edited in settings). */
	userGames: GameProfile[];
}

export const DEFAULT_SETTINGS: FgSettings = {
	defaultGame: "generic",
	iconsByDefault: false,
	colorButtons: true,
	showBadge: true,
	showTooltips: true,
	showCopyButton: true,
	size: "md",
	chips: true,
	autocomplete: true,
	templateFields: ["input", "name", "damage", "hits"],
	userGames: [],
};
