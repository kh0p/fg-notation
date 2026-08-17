/**
 * Bundles the pure (DOM-free) parts of the plugin and exercises the tokenizer
 * against real notation from each supported game.
 *
 *   node test/run.mjs
 */
import esbuild from "esbuild";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import os from "os";
import assert from "assert";

const root = path.resolve(import.meta.dirname, "..");
const outfile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fgn-")), "bundle.mjs");

await esbuild.build({
	entryPoints: [path.join(root, "test", "entry.ts")],
	bundle: true,
	format: "esm",
	platform: "neutral",
	outfile,
	logLevel: "warning",
});

const { tokenize, resolveGame, parseBlock, extractFenceLang, isFgLang } = await import(
	pathToFileURL(outfile).href
);

let pass = 0;
let fail = 0;

/** Flatten a tokenized combo into `kind:raw` pairs, dropping soft spaces. */
function flat(input, gameId) {
	const moves = tokenize(input, resolveGame(gameId));
	const out = [];
	for (const m of moves) {
		for (const t of m.tokens) {
			if (t.cls === "fgn-sp") continue;
			out.push(`${t.kind}:${t.raw}`);
		}
		if (m.connector) out.push(`conn:${m.connector.raw}`);
	}
	return out;
}

function check(label, actual, expected) {
	try {
		assert.deepStrictEqual(actual, expected);
		pass++;
	} catch (e) {
		fail++;
		console.log(`\n  FAIL  ${label}`);
		console.log(`    expected: ${JSON.stringify(expected)}`);
		console.log(`    actual:   ${JSON.stringify(actual)}`);
	}
}

function moveCount(input, gameId) {
	return tokenize(input, resolveGame(gameId)).length;
}

/* -------------------------------------------------------------------------- */
/* Tokon — the user's own example                                             */
/* -------------------------------------------------------------------------- */

const MAGIK =
	"236M > M > 2H > jump > M H > M H H > A > 214M > 623M > jump > H 6H > H 6H H";

check("tokon: magik loop splits into 12 moves", moveCount(MAGIK, "tokon"), 12);

check("tokon: 236M", flat("236M", "tokon"), ["motion:236", "button:M"]);
check("tokon: 2H", flat("2H", "tokon"), ["direction:2", "button:H"]);
check("tokon: jump is an action word, not d+u+m+p", flat("jump", "tokon"), [
	"modifier:jump",
]);
check("tokon: assist call 2A", flat("2A", "tokon"), ["direction:2", "button:A"]);
check("tokon: M H H chains in one move", flat("M H H", "tokon"), [
	"button:M",
	"button:H",
	"button:H",
]);
check("tokon: 623M is a DP motion", flat("623M", "tokon"), [
	"motion:623",
	"button:M",
]);
check("tokon: QS mechanic", flat("QS", "tokon"), ["mechanic:QS"]);

/* -------------------------------------------------------------------------- */
/* Guilty Gear Strive                                                          */
/* -------------------------------------------------------------------------- */

check("ggst: c.S is close slash", flat("c.S", "ggst"), [
	"modifier:c.",
	"button:S",
]);
check("ggst: f.S is far slash", flat("f.S", "ggst"), [
	"modifier:f.",
	"button:S",
]);
check("ggst: HS beats H", flat("236HS", "ggst"), ["motion:236", "button:HS"]);
check("ggst: j.D air dust", flat("j.D", "ggst"), ["modifier:j.", "button:D"]);
check("ggst: RC roman cancel", flat("236K RC", "ggst"), [
	"motion:236",
	"button:K",
	"mechanic:RC",
]);
check("ggst: 632146 super motion stays whole", flat("632146HS", "ggst"), [
	"motion:632146",
	"button:HS",
]);
check("ggst: gatling with cancel connector", flat("5P > 2K xx 236K", "ggst"), [
	"direction:5",
	"button:P",
	"conn:>",
	"direction:2",
	"button:K",
	"conn:xx",
	"motion:236",
	"button:K",
]);

/* -------------------------------------------------------------------------- */
/* Street Fighter 6                                                            */
/* -------------------------------------------------------------------------- */

check("sf6: cr.MK", flat("cr.MK", "sf6"), ["modifier:cr.", "button:MK"]);
check("sf6: 2MK numpad", flat("2MK", "sf6"), ["direction:2", "button:MK"]);
check("sf6: drive rush", flat("DR", "sf6"), ["mechanic:DR"]);
check("sf6: super art", flat("236236P", "sf6"), ["motion:236236", "button:P"]);
check("sf6: OD special", flat("214KK", "sf6"), [
	"motion:214",
	"button:K",
	"button:K",
]);
check("sf6: HP not split into H + P", flat("5HP", "sf6"), [
	"direction:5",
	"button:HP",
]);

/* -------------------------------------------------------------------------- */
/* Tekken — letters are directions, digits are buttons, case matters           */
/* -------------------------------------------------------------------------- */

check("tekken: df 1 is a direction plus a button", flat("df 1", "tekken"), [
	"direction:df",
	"button:1",
]);
check("tekken: lowercase f taps, uppercase F holds", flat("f 2", "tekken"), [
	"direction:f",
	"button:2",
]);
check("tekken: F is a distinct token from f", flat("F 2", "tekken"), [
	"direction:F",
	"button:2",
]);
check("tekken: 3+4 joins two buttons", flat("3+4", "tekken"), [
	"button:3",
	"punct:+",
	"button:4",
]);
check("tekken: WS while standing", flat("WS 4", "tekken"), [
	"mechanic:WS",
	"button:4",
]);
check("tekken: FC df 3", flat("FC df 3", "tekken"), [
	"mechanic:FC",
	"direction:df",
	"button:3",
]);
// In Tekken 2 and 3 are buttons (right punch, left kick); 6 is neither a
// button nor a direction, so it degrades to an annotation rather than being
// silently read as numpad "forward".
check("tekken: digits are buttons, never numpad", flat("2 3 6", "tekken"), [
	"button:2",
	"button:3",
	"punct:6",
]);
check(
	"tekken: full Alisa string",
	moveCount("b 3+4 > f 2 > df 1 1 > b 2 3 > uf 1", "tekken"),
	5,
);

/* -------------------------------------------------------------------------- */
/* Granblue Rising                                                             */
/* -------------------------------------------------------------------------- */

check("gbvsr: U unique attack", flat("2U", "gbvsr"), [
	"direction:2",
	"button:U",
]);
check("gbvsr: SBA super", flat("SBA", "gbvsr"), ["mechanic:SBA"]);
check("gbvsr: raging strike", flat("RS > 236M", "gbvsr"), [
	"mechanic:RS",
	"conn:>",
	"motion:236",
	"button:M",
]);

/* -------------------------------------------------------------------------- */
/* Mortal Kombat — F/B/D/U letters, 1-4 buttons                                */
/* -------------------------------------------------------------------------- */

check("mk1: B+1 back punch", flat("B+1", "mk1"), [
	"direction:B",
	"punct:+",
	"button:1",
]);
check("mk1: amplify", flat("DB3 AMP", "mk1"), [
	"direction:DB",
	"button:3",
	"mechanic:AMP",
]);

/* -------------------------------------------------------------------------- */
/* Generic constructs                                                          */
/* -------------------------------------------------------------------------- */

check("repeat count x3", flat("2K x3", "ggst"), [
	"direction:2",
	"button:K",
	"modifier:x3",
]);
check("hold brackets", flat("[4]6P", "sf6"), [
	"punct:[",
	"direction:4",
	"punct:]",
	"direction:6",
	"button:P",
]);
check("hit count in parens is not a direction", flat("236H(2)", "ggst"), [
	"motion:236",
	"button:H",
	"punct:(",
	"punct:2",
	"punct:)",
]);
check("unknown move name stays whole", flat("Stinger > 5P", "ggst"), [
	"text:Stinger",
	"conn:>",
	"direction:5",
	"button:P",
]);
check("counter hit annotation", flat("CH 5H", "ggst"), [
	"modifier:CH",
	"direction:5",
	"button:H",
]);
check("dash is a word, not D+a+s+h", flat("dash > 5K", "ggst"), [
	"modifier:dash",
	"conn:>",
	"direction:5",
	"button:K",
]);
check("360 grab motion", flat("360P", "sf6"), ["motion:360", "button:P"]);
check("66 microdash", flat("66 > 5P", "ggst"), [
	"motion:66",
	"conn:>",
	"direction:5",
	"button:P",
]);

/* -------------------------------------------------------------------------- */
/* Block parsing                                                               */
/* -------------------------------------------------------------------------- */

const block = parseBlock(
	"fg:tokon:img",
	[
		"input: 236M > M > 2H",
		"name: Magik Basic Assist Loop",
		"damage: 45000",
		"Hits: 26",
	].join("\n"),
);

check("block: game id", block.gameId, "tokon");
check("block: img option", block.options.img, true);
check("block: one combo", block.combos.length, 1);
check("block: name", block.combos[0].name, "Magik Basic Assist Loop");
check("block: damage", block.combos[0].damage, "45000");
check("block: Hits is case-insensitive", block.combos[0].hits, "26");
check("block: input", block.combos[0].input, "236M > M > 2H");

const bare = parseBlock("fg:ggst", "5P > 2K xx 236K");
check("block: bare notation becomes input", bare.combos[0].input, "5P > 2K xx 236K");

const multi = parseBlock(
	"fg:sf6",
	["input: 2MK xx 236HP", "name: One", "---", "input: 5HP xx 214PP", "name: Two"].join("\n"),
);
check("block: --- separates combos", multi.combos.length, 2);
check("block: second combo name", multi.combos[1].name, "Two");

const wrapped = parseBlock(
	"fg:tokon",
	["input: 236M > M > 2H", "  > jump > M H", "name: Long one"].join("\n"),
);
check(
	"block: wrapped input lines join",
	wrapped.combos[0].input,
	"236M > M > 2H > jump > M H",
);

const unknown = parseBlock("fg:notarealgame", "input: 5P");
check("block: unknown game warns", unknown.errors.length, 1);

/* -------------------------------------------------------------------------- */
/* Fence recovery                                                              */
/*                                                                             */
/* Obsidian's Live Preview fence regex captures [\w/+#-]* — no colon — so a    */
/* code-block processor sees plain `fg` and the game/options have to be read   */
/* back off the fence line itself.                                             */
/* -------------------------------------------------------------------------- */

check("fence: plain", extractFenceLang("```fg"), "fg");
check("fence: with game", extractFenceLang("```fg:tokon"), "fg:tokon");
check("fence: with options", extractFenceLang("```fg:tokon:img"), "fg:tokon:img");
check("fence: tildes", extractFenceLang("~~~fg:ggst:compact"), "fg:ggst:compact");
check("fence: indented in a list", extractFenceLang("   ```fg:sf6"), "fg:sf6");
check("fence: more than three backticks", extractFenceLang("````fg:tekken"), "fg:tekken");
check("fence: space after fence", extractFenceLang("``` fg:mk1"), "fg:mk1");
check("fence: not ours", isFgLang(extractFenceLang("```python")), false);
check("fence: figma is not fg", isFgLang(extractFenceLang("```figma")), false);
check("fence: bare fg is ours", isFgLang(extractFenceLang("```fg")), true);
check("fence: fg with game is ours", isFgLang(extractFenceLang("```fg:tokon")), true);

// The end-to-end Live Preview path: fence line -> lang -> parsed block.
const lpLang = extractFenceLang("```fg:tokon:img");
const lpBlock = parseBlock(lpLang, "input: 236M > M\nname: Recovered");
check("live preview: game recovered", lpBlock.gameId, "tokon");
check("live preview: option recovered", lpBlock.options.img, true);
check("live preview: body parsed", lpBlock.combos[0].name, "Recovered");

/* -------------------------------------------------------------------------- */

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
