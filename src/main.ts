import {
	Editor,
	FuzzySuggestModal,
	MarkdownPostProcessorContext,
	MarkdownView,
	Plugin,
} from "obsidian";
import type { GameProfile } from "./types";
import { DEFAULT_SETTINGS, FgSettings } from "./settings";
import { listGames, setUserGames } from "./games";
import { extractFenceLang, isFgLang, parseBlock } from "./block";
import { renderBlock } from "./notation/render";
import { FieldSuggest, GameSuggest } from "./ui/suggest";
import { FgSettingTab } from "./ui/settings-tab";

/**
 * Recover the fence language and body for a rendered `<pre>`.
 *
 * Obsidian truncates `fg:tokon` to `fg` for the language class, and which
 * element carries that class has moved between versions — so the class is only
 * ever a fallback. The fence line from `getSectionInfo` is authoritative.
 */
function readSource(
	pre: HTMLElement,
	code: HTMLElement,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext,
): { lang: string; source: string } | null {
	const info = ctx.getSectionInfo(pre) ?? ctx.getSectionInfo(el);
	if (info) {
		const lines = info.text.split("\n");
		const lang = extractFenceLang(lines[info.lineStart] ?? "");
		if (!isFgLang(lang)) return null;
		return { lang, source: lines.slice(info.lineStart + 1, info.lineEnd).join("\n") };
	}

	// Exported / embedded contexts have no section info. Accept the class from
	// either element; it only ever tells us `fg`, so options are lost here.
	const classes = [...Array.from(pre.classList), ...Array.from(code.classList)];
	const cls = classes.find((c) => /^language-fg($|[:_-])/i.test(c));
	if (!cls) return null;
	return { lang: cls.slice("language-".length), source: code.textContent ?? "" };
}

export default class FgNotationPlugin extends Plugin {
	settings: FgSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();

		// Obsidian keys code-block processors on the info string truncated at the
		// first `:`, so this catches every `fg:*` block in normal rendering.
		this.registerMarkdownCodeBlockProcessor("fg", (source, el, ctx) => {
			const info = ctx.getSectionInfo(el);
			const lang =
				(info && extractFenceLang(info.text.split("\n")[info.lineStart] ?? "")) || "fg";
			this.paint(el, lang, source);
		});

		// Safety net for versions that key on the full `fg:tokon` string, and for
		// embeds. Every `pre > code` is checked against its own fence line.
		this.registerMarkdownPostProcessor((el, ctx) => {
			const codes = Array.from(el.querySelectorAll("pre > code")) as HTMLElement[];
			for (const code of codes) {
				const pre = code.parentElement as HTMLElement | null;
				if (!pre) continue;

				const src = readSource(pre, code, el, ctx);
				if (!src) continue;

				const container = createDiv();
				this.paint(container, src.lang, src.source);
				pre.replaceWith(container);
			}
		});

		this.addSettingTab(new FgSettingTab(this.app, this));
		this.registerEditorSuggest(new GameSuggest(this.app, this.settings));
		this.registerEditorSuggest(new FieldSuggest(this.app, this.settings));

		this.addCommand({
			id: "insert-combo-block",
			name: "Insert combo block",
			editorCallback: (editor: Editor) => {
				new GamePickerModal(this, (game) => this.insertBlock(editor, game)).open();
			},
		});

		this.addCommand({
			id: "insert-combo-block-default",
			name: "Insert combo block (default game)",
			editorCallback: (editor: Editor) => {
				const game =
					listGames().find((g) => g.id === this.settings.defaultGame) ?? listGames()[0];
				this.insertBlock(editor, game);
			},
		});
	}

	/** Render a block into `target`, surfacing failures instead of blanking. */
	private paint(target: HTMLElement, lang: string, source: string): void {
		try {
			renderBlock(target, parseBlock(lang, source), this.settings);
		} catch (e) {
			target.createDiv({
				cls: "fgn-error",
				text: `FG Notation failed to render this block: ${String(e)}`,
			});
		}
	}

	private insertBlock(editor: Editor, game: GameProfile): void {
		const fields = this.settings.templateFields.length
			? this.settings.templateFields
			: ["input"];
		const body = fields.map((f) => `${f}: `).join("\n");
		const text = `\`\`\`fg:${game.id}\n${body}\n\`\`\`\n`;

		const cursor = editor.getCursor();
		editor.replaceRange(text, cursor);
		editor.setCursor({ line: cursor.line + 1, ch: fields[0].length + 2 });
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		setUserGames(this.settings.userGames ?? []);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		setUserGames(this.settings.userGames ?? []);
		this.rerenderAll();
	}

	/** Repaint every open preview so setting changes show up immediately. */
	rerenderAll(): void {
		this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				view.previewMode?.rerender(true);
			}
		});
	}
}

class GamePickerModal extends FuzzySuggestModal<GameProfile> {
	constructor(
		private plugin: FgNotationPlugin,
		private onPick: (game: GameProfile) => void,
	) {
		super(plugin.app);
		this.setPlaceholder("Pick a game…");
	}

	getItems(): GameProfile[] {
		return listGames();
	}

	getItemText(game: GameProfile): string {
		return `${game.id} ${game.name} ${game.aliases.join(" ")}`;
	}

	onChooseItem(game: GameProfile): void {
		this.onPick(game);
	}
}
