import { Notice, setIcon } from "obsidian";
import type { BlockOptions, Combo, GameProfile, Move, ParsedBlock, Token } from "../types";
import type { FgSettings } from "../settings";
import { resolveGame } from "../games";
import { tokenize } from "./tokenize";
import { chargeIcon, directionIcon, spinIcon } from "../icons";

interface RenderCtx {
	profile: GameProfile;
	opts: BlockOptions;
	settings: FgSettings;
	/** Effective icon mode. */
	icons: boolean;
}

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

function tip(el: HTMLElement, text: string | undefined, ctx: RenderCtx) {
	if (!text) return;
	el.setAttr("aria-label", text);
	if (ctx.settings.showTooltips) el.setAttr("title", text);
}

function renderDirectionIcon(parent: HTMLElement, dir: string): boolean {
	const svg = directionIcon(dir);
	if (!svg) return false;
	parent.appendChild(svg);
	return true;
}

function renderToken(parent: HTMLElement, t: Token, ctx: RenderCtx): void {
	switch (t.kind) {
		case "button": {
			const el = parent.createSpan({ cls: "fgn-tk fgn-tk--btn", text: t.label });
			if (ctx.settings.colorButtons && t.color) el.style.setProperty("--fgn-c", t.color);
			else el.addClass("fgn-tk--mono");
			tip(el, t.title, ctx);
			return;
		}

		case "direction": {
			if (ctx.icons && t.icon) {
				const el = parent.createSpan({ cls: "fgn-tk fgn-tk--dir fgn-tk--icon" });
				if (!renderDirectionIcon(el, t.raw)) el.setText(t.label);
				tip(el, t.title, ctx);
				return;
			}
			const el = parent.createSpan({ cls: "fgn-tk fgn-tk--dir", text: t.label });
			tip(el, t.title, ctx);
			return;
		}

		case "motion": {
			if (ctx.icons) {
				const el = parent.createSpan({ cls: "fgn-tk fgn-tk--motion fgn-tk--icon" });
				if (t.raw === "360" || t.raw === "720") {
					el.appendChild(spinIcon(t.raw === "720"));
				} else if (t.icon?.startsWith("charge")) {
					el.appendChild(chargeIcon());
					renderDirectionIcon(el, t.raw[t.raw.length - 1]);
				} else {
					for (const d of t.raw) renderDirectionIcon(el, d);
				}
				tip(el, t.title, ctx);
				return;
			}
			const el = parent.createSpan({ cls: "fgn-tk fgn-tk--motion", text: t.label });
			tip(el, t.title, ctx);
			return;
		}

		case "mechanic": {
			const el = parent.createSpan({ cls: "fgn-tk fgn-tk--mech", text: t.label });
			if (t.color) el.style.setProperty("--fgn-c", t.color);
			tip(el, t.title, ctx);
			return;
		}

		case "modifier": {
			const el = parent.createSpan({
				cls: `fgn-tk fgn-tk--mod${t.cls ? ` ${t.cls}` : ""}`,
				text: t.label,
			});
			tip(el, t.title, ctx);
			return;
		}

		case "punct": {
			if (t.cls === "fgn-sp") {
				parent.createSpan({ cls: "fgn-sp" });
				return;
			}
			const el = parent.createSpan({
				cls: `fgn-tk fgn-tk--punct${t.cls ? ` ${t.cls}` : ""}`,
				text: t.label,
			});
			tip(el, t.title, ctx);
			return;
		}

		default: {
			const el = parent.createSpan({ cls: "fgn-tk fgn-tk--text", text: t.label });
			tip(el, t.title, ctx);
		}
	}
}

function renderMove(parent: HTMLElement, move: Move, ctx: RenderCtx): void {
	const chip = parent.createSpan({
		cls: ctx.settings.chips && !ctx.opts.plain ? "fgn-move fgn-move--chip" : "fgn-move",
	});
	for (const t of move.tokens) renderToken(chip, t, ctx);

	if (move.connector) {
		const c = move.connector;
		const el = parent.createSpan({
			cls: `fgn-conn ${c.cls ?? ""}`.trim(),
			text: c.label,
		});
		tip(el, c.title, ctx);
	}
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

function prettyNumber(v: string): string {
	return /^\d{4,}$/.test(v) ? Number(v).toLocaleString() : v;
}

interface Stat {
	key: string;
	value: string;
	cls?: string;
}

function collectStats(combo: Combo): Stat[] {
	const stats: Stat[] = [];
	if (combo.damage) stats.push({ key: "Damage", value: prettyNumber(combo.damage), cls: "is-dmg" });
	if (combo.hits) stats.push({ key: "Hits", value: combo.hits, cls: "is-hits" });
	if (combo.meter) stats.push({ key: "Meter", value: combo.meter, cls: "is-meter" });
	if (combo.character) stats.push({ key: "Character", value: combo.character });
	if (combo.position) stats.push({ key: "Position", value: combo.position });
	if (combo.worksOn) stats.push({ key: "Works on", value: combo.worksOn });
	if (combo.difficulty) stats.push({ key: "Difficulty", value: combo.difficulty });
	for (const e of combo.extra) stats.push({ key: e.key, value: e.value });
	return stats;
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function renderCombo(
	parent: HTMLElement,
	combo: Combo,
	ctx: RenderCtx,
	showBadge: boolean,
): void {
	const card = parent.createDiv({ cls: "fgn-card" });

	const hasHead = !!combo.name || showBadge || ctx.settings.showCopyButton;
	if (hasHead) {
		const head = card.createDiv({ cls: "fgn-head" });
		if (combo.name) head.createDiv({ cls: "fgn-name", text: combo.name });
		else head.createDiv({ cls: "fgn-name fgn-name--empty" });

		const tools = head.createDiv({ cls: "fgn-tools" });

		if (showBadge) {
			const badge = tools.createSpan({ cls: "fgn-badge", text: ctx.profile.short });
			tip(badge, ctx.profile.name, ctx);
		}

		if (ctx.settings.showCopyButton && combo.input) {
			const btn = tools.createEl("button", { cls: "fgn-copy", attr: { type: "button" } });
			setIcon(btn, "copy");
			btn.setAttr("aria-label", "Copy notation");
			btn.addEventListener("click", async (ev) => {
				ev.preventDefault();
				await navigator.clipboard.writeText(combo.input);
				setIcon(btn, "check");
				new Notice("Notation copied");
				window.setTimeout(() => setIcon(btn, "copy"), 1200);
			});
		}
	}

	const stats = collectStats(combo);
	if (stats.length) {
		const row = card.createDiv({ cls: "fgn-stats" });
		for (const s of stats) {
			const pill = row.createSpan({ cls: `fgn-stat ${s.cls ?? ""}`.trim() });
			pill.createSpan({ cls: "fgn-stat-k", text: s.key });
			pill.createSpan({ cls: "fgn-stat-v", text: s.value });
		}
	}

	if (combo.input.trim()) {
		const seq = card.createDiv({ cls: "fgn-seq" });
		for (const move of tokenize(combo.input, ctx.profile)) {
			renderMove(seq, move, ctx);
		}
	}

	if (combo.tags?.length) {
		const row = card.createDiv({ cls: "fgn-tags" });
		for (const t of combo.tags) row.createSpan({ cls: "fgn-tag", text: `#${t}` });
	}

	if (combo.notes) card.createDiv({ cls: "fgn-notes", text: combo.notes });

	if (combo.video) {
		const a = card.createEl("a", {
			cls: "fgn-video",
			text: "Watch",
			href: combo.video,
		});
		a.setAttr("target", "_blank");
		a.setAttr("rel", "noopener");
	}
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export function renderBlock(
	container: HTMLElement,
	block: ParsedBlock,
	settings: FgSettings,
): void {
	const profile = resolveGame(block.gameId || settings.defaultGame);
	const opts = block.options;

	const ctx: RenderCtx = {
		profile,
		opts,
		settings,
		icons: opts.img || settings.iconsByDefault,
	};

	const size = opts.size ?? settings.size;
	const root = container.createDiv({
		cls: `fgn fgn--${size}${opts.compact ? " fgn--compact" : ""}${opts.plain ? " fgn--plain" : ""}`,
	});
	root.setAttr("data-game", profile.id);
	root.style.setProperty("--fgn-accent", profile.accent);

	for (const err of block.errors) {
		root.createDiv({ cls: "fgn-error", text: err });
	}

	const showBadge = settings.showBadge && !opts.nobadge;
	block.combos.forEach((combo, i) => {
		renderCombo(root, combo, ctx, showBadge && i === 0);
	});
}
