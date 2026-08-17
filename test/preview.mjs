/**
 * Runs the real renderer over a set of example blocks and writes a standalone
 * HTML preview using the plugin's own stylesheet.
 *
 *   node test/preview.mjs [outfile]
 */
import esbuild from "esbuild";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import os from "os";
import { installFakeDom, newRoot } from "./fakedom.mjs";

const root = path.resolve(import.meta.dirname, "..");
const outHtml = process.argv[2] ?? path.join(root, "preview.html");

installFakeDom();

const bundle = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "fgn-p-")), "render.mjs");
await esbuild.build({
	entryPoints: [path.join(root, "test", "render-entry.ts")],
	bundle: true,
	format: "esm",
	platform: "neutral",
	outfile: bundle,
	alias: { obsidian: path.join(root, "test", "obsidian-stub.ts") },
	logLevel: "warning",
});

const { renderBlock, parseBlock, DEFAULT_SETTINGS } = await import(
	pathToFileURL(bundle).href
);

const EXAMPLES = [
	[
		"MARVEL Tōkon — the example from the request",
		"fg:tokon",
		`input: 236M > M > 2H > jump > M H > M H H > A > 214M > 623M > jump > H 6H > H 6H H
name: Magik Basic Assist Loop
damage: 45000
hits: 26`,
	],
	[
		"Same combo with arrow icons (:img)",
		"fg:tokon:img",
		`input: 236M > M > 2H > jump > M H > M H H > A > 214M > 623M
name: Magik Basic Assist Loop
damage: 45000
hits: 26`,
	],
	[
		"Guilty Gear Strive",
		"fg:ggst",
		`input: c.S > f.S > 2H xx 236K > 214K RC > dash > 5K > c.S > 236236HS
name: Potemkin corner conversion
character: Potemkin
damage: 210
hits: 9
meter: 50% tension
position: Corner
difficulty: Medium
notes: Delay the 5K slightly after the dash or it will whiff on crouchers.`,
	],
	[
		"Street Fighter 6",
		"fg:sf6",
		`input: cr.MK xx DR > 5HP > 236HP xx 236236P
name: Drive Rush punish counter
character: Mai
damage: 3400
hits: 7
meter: 3 drive + 3 super
tags: bnb, midscreen`,
	],
	[
		"Tekken 8 — letters are directions, digits are buttons",
		"fg:tekken",
		`input: b 3+4 > f 2 > df 1 1 > b 2 3 > uf 1
name: Alisa staple
damage: 74
hits: 8`,
	],
	[
		"Granblue Fantasy Versus Rising",
		"fg:gbvsr",
		`input: 5M > 5H > 236M > 214H > RS > 236236H
name: Narmaya midscreen
character: Narmaya
damage: 3800
hits: 11`,
	],
	[
		"Several combos in one block, compact",
		"fg:ggst:compact",
		`input: 5P > 2K xx 236K
name: Beginner
---
input: 66 > c.S > 5H xx 214H > 632146HS
name: With a super ender
damage: 250`,
	],
	[
		"Mortal Kombat 1",
		"fg:mk1",
		`input: B+1 > 2 > DB3 AMP > F+4
name: Kameo starter
damage: 320`,
	],
];

let html = "";
for (const [label, lang, source] of EXAMPLES) {
	const container = newRoot();
	renderBlock(container, parseBlock(lang, source), DEFAULT_SETTINGS);
	html += `<section><h2>${label}</h2><div class="src">\`\`\`${lang}</div>${container.outerHTML}</section>\n`;
}

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

fs.writeFileSync(
	outHtml,
	`<!doctype html><meta charset="utf-8"><title>FG Notation preview</title>
<style>
:root{
  --background-primary:#1e1e1e; --background-primary-alt:#252525;
  --background-secondary:#2a2a2a; --background-modifier-border:#3a3a3a;
  --background-modifier-hover:#333;
  --text-normal:#dcddde; --text-muted:#999; --text-faint:#666;
  --text-accent:#7f6df2; --text-error:#e05252;
  --font-monospace:ui-monospace,"Cascadia Code",Consolas,monospace;
  --font-interface:-apple-system,"Segoe UI",sans-serif;
}
body{background:var(--background-primary);color:var(--text-normal);
  font-family:var(--font-interface);max-width:900px;margin:0 auto;padding:2rem}
h1{font-size:1.4rem} h2{font-size:.95rem;color:var(--text-muted);font-weight:600;margin:2rem 0 .5rem}
.src{font-family:var(--font-monospace);font-size:.75rem;color:var(--text-faint);margin-bottom:.4rem}
${css}
</style>
<h1>FG Notation — rendered output</h1>
${html}`,
	"utf8",
);

console.log(`wrote ${outHtml}`);
