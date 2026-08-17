import type { GameProfile } from "../types";
import { MARVEL_GAMES } from "./marvel";
import { CAPCOM_GAMES } from "./capcom";
import { ARCSYS_GAMES } from "./arcsys";
import { THREED_GAMES } from "./threed";
import { OTHER_GAMES, GENERIC } from "./others";

export { GENERIC };

/** Every built-in profile, in the order shown in settings and autocomplete. */
export const BUILTIN_GAMES: GameProfile[] = [
	...MARVEL_GAMES,
	...CAPCOM_GAMES,
	...ARCSYS_GAMES,
	...THREED_GAMES,
	...OTHER_GAMES,
];

/** id/alias -> profile. Rebuilt whenever user-defined games change. */
let lookup = new Map<string, GameProfile>();

function indexGames(games: GameProfile[]): Map<string, GameProfile> {
	const map = new Map<string, GameProfile>();
	for (const g of games) {
		map.set(g.id.toLowerCase(), g);
		for (const a of g.aliases) {
			// A built-in id always wins over another game's alias.
			if (!map.has(a.toLowerCase())) map.set(a.toLowerCase(), g);
		}
	}
	return map;
}

lookup = indexGames(BUILTIN_GAMES);

let allGames: GameProfile[] = BUILTIN_GAMES;

/** Merge user-defined profiles on top of the built-ins. */
export function setUserGames(userGames: GameProfile[]): void {
	allGames = [...userGames, ...BUILTIN_GAMES];
	// User games are indexed first so they can shadow a built-in id.
	lookup = indexGames(allGames);
}

export function listGames(): GameProfile[] {
	return allGames;
}

/** Resolve a code-block game id. Falls back to the generic profile. */
export function resolveGame(id: string | undefined): GameProfile {
	if (!id) return GENERIC;
	return lookup.get(id.trim().toLowerCase()) ?? GENERIC;
}

/** True when `id` names a real profile (used to warn on typos). */
export function isKnownGame(id: string): boolean {
	return lookup.has(id.trim().toLowerCase());
}
