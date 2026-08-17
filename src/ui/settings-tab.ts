import {
	App,
	PluginSettingTab,
	Setting,
	SettingDefinition,
	SettingDefinitionItem,
} from "obsidian";
import type FgNotationPlugin from "../main";
import type { GameProfile } from "../types";
import { BUILTIN_GAMES, listGames } from "../games";

/**
 * Two virtual keys that expose array-valued settings as editable text. They are
 * translated in `getControlValue` / `setControlValue`.
 */
const TEMPLATE_FIELDS_KEY = "templateFieldsText";
const USER_GAMES_KEY = "userGamesJson";

/* -------------------------------------------------------------------------- */
/* Setting specs                                                              */
/*                                                                            */
/* Declared once and consumed twice: `getSettingDefinitions()` renders them    */
/* declaratively on Obsidian 1.13+ (which also makes them searchable), and     */
/* `display()` renders the same list imperatively on older versions. Keeping   */
/* one source of truth stops the two paths drifting apart.                    */
/* -------------------------------------------------------------------------- */

type Spec =
	| { kind: "heading"; name: string }
	| { kind: "toggle"; key: string; name: string; desc: string }
	| { kind: "dropdown"; key: string; name: string; desc: string; options: Record<string, string> }
	| { kind: "text"; key: string; name: string; desc: string; placeholder?: string }
	| {
			kind: "textarea";
			key: string;
			name: string;
			desc: string;
			placeholder?: string;
			rows?: number;
			validate?: (value: string) => string | void;
	  }
	| { kind: "custom"; name: string; desc: string; render: (el: HTMLElement) => void };

/** Parse the custom-games JSON, returning either the profiles or an error. */
function parseUserGames(text: string): { games: GameProfile[]; error?: string } {
	const trimmed = text.trim();
	if (!trimmed) return { games: [] };
	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (!Array.isArray(parsed)) return { games: [], error: "Expected a JSON array." };
		return { games: parsed as GameProfile[] };
	} catch (e) {
		return { games: [], error: e instanceof Error ? e.message : "Invalid JSON." };
	}
}

function renderGameList(el: HTMLElement): void {
	const list = el.createDiv({ cls: "fgn-settings-games" });
	for (const g of BUILTIN_GAMES) {
		const row = list.createDiv({ cls: "fgn-settings-game" });
		const dot = row.createSpan({ cls: "fgn-settings-dot" });
		dot.style.setProperty("--fgn-c", g.accent);
		row.createSpan({ cls: "fgn-settings-id", text: g.id });
		row.createSpan({ cls: "fgn-settings-name", text: g.name });
	}
}

export class FgSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: FgNotationPlugin) {
		super(app, plugin);
	}

	private specs(): Spec[] {
		const gameOptions: Record<string, string> = {};
		for (const g of listGames()) gameOptions[g.id] = `${g.id} — ${g.name}`;

		return [
			{
				kind: "dropdown",
				key: "defaultGame",
				name: "Default game",
				desc: "Used when a block is written as ```fg with no game id.",
				options: gameOptions,
			},
			{
				kind: "dropdown",
				key: "size",
				name: "Size",
				desc: "Base size of rendered notation. A block can override this with :sm, :md or :lg.",
				options: { sm: "Small", md: "Medium", lg: "Large" },
			},

			{ kind: "heading", name: "Appearance" },
			{
				kind: "toggle",
				key: "chips",
				name: "Chips",
				desc: "Draw each step of the combo as a rounded chip. Off renders plain coloured text.",
			},
			{
				kind: "toggle",
				key: "colorButtons",
				name: "Colour buttons",
				desc: "Tint attack buttons using each game's palette.",
			},
			{
				kind: "toggle",
				key: "iconsByDefault",
				name: "Arrow icons by default",
				desc: "Render directions and motions as arrow glyphs everywhere. A block can force this on with :img.",
			},
			{
				kind: "toggle",
				key: "showBadge",
				name: "Game badge",
				desc: "Show the game's short name in the card header.",
			},
			{
				kind: "toggle",
				key: "showTooltips",
				name: "Tooltips",
				desc: "Describe each token on hover (e.g. 236 → Quarter-circle forward).",
			},
			{
				kind: "toggle",
				key: "showCopyButton",
				name: "Copy button",
				desc: "Show a button that copies the raw notation to the clipboard.",
			},

			{ kind: "heading", name: "Editor" },
			{
				kind: "toggle",
				key: "autocomplete",
				name: "Autocomplete",
				desc: "Suggest game ids after ```fg: and field names inside a block.",
			},
			{
				kind: "text",
				key: TEMPLATE_FIELDS_KEY,
				name: "Template fields",
				desc: "Comma-separated fields inserted when you pick a game or accept the template.",
				placeholder: "input, name, damage, hits",
			},

			{ kind: "heading", name: "Games" },
			{
				kind: "custom",
				name: "Supported games",
				desc: "Ids you can write after fg:. Most also accept aliases.",
				render: renderGameList,
			},
			{
				kind: "textarea",
				key: USER_GAMES_KEY,
				name: "Custom games",
				desc: "JSON array of extra game profiles. Same shape as the built-ins; an id that matches a built-in replaces it.",
				placeholder: "[]",
				rows: 8,
				validate: (value) => parseUserGames(value).error,
			},
		];
	}

	/* ---------------------------------------------------------------- */
	/* Value plumbing                                                   */
	/* ---------------------------------------------------------------- */

	getControlValue(key: string): unknown {
		const s = this.plugin.settings;
		if (key === TEMPLATE_FIELDS_KEY) return s.templateFields.join(", ");
		if (key === USER_GAMES_KEY) {
			return s.userGames.length ? JSON.stringify(s.userGames, null, 2) : "";
		}
		return (s as unknown as Record<string, unknown>)[key];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const s = this.plugin.settings;
		if (key === TEMPLATE_FIELDS_KEY) {
			s.templateFields = String(value)
				.split(",")
				.map((f) => f.trim())
				.filter(Boolean);
		} else if (key === USER_GAMES_KEY) {
			const { games, error } = parseUserGames(String(value));
			if (error) return; // `validate` surfaces the message; keep the old value.
			s.userGames = games;
		} else {
			(s as unknown as Record<string, unknown>)[key] = value;
		}
		await this.plugin.saveSettings();
	}

	/* ---------------------------------------------------------------- */
	/* Declarative rendering (Obsidian 1.13+)                           */
	/* ---------------------------------------------------------------- */

	getSettingDefinitions(): SettingDefinitionItem[] {
		const items: SettingDefinitionItem[] = [];
		// Groups hold leaf settings only — this tab never nests a group in a group.
		let group: SettingDefinition[] | null = null;

		const add = (def: SettingDefinition) => {
			if (group) group.push(def);
			else items.push(def);
		};

		for (const spec of this.specs()) {
			if (spec.kind === "heading") {
				const groupItems: SettingDefinition[] = [];
				group = groupItems;
				items.push({ type: "group", heading: spec.name, items: groupItems });
				continue;
			}

			switch (spec.kind) {
				case "toggle":
					add({
						name: spec.name,
						desc: spec.desc,
						control: { type: "toggle", key: spec.key },
					});
					break;
				case "dropdown":
					add({
						name: spec.name,
						desc: spec.desc,
						control: { type: "dropdown", key: spec.key, options: spec.options },
					});
					break;
				case "text":
					add({
						name: spec.name,
						desc: spec.desc,
						control: { type: "text", key: spec.key, placeholder: spec.placeholder },
					});
					break;
				case "textarea":
					add({
						name: spec.name,
						desc: spec.desc,
						control: {
							type: "textarea",
							key: spec.key,
							placeholder: spec.placeholder,
							rows: spec.rows,
							validate: spec.validate,
						},
					});
					break;
				case "custom":
					add({
						name: spec.name,
						desc: spec.desc,
						render: (setting: Setting) => {
							spec.render(setting.descEl);
						},
					});
					break;
			}
		}

		return items;
	}

	/* ---------------------------------------------------------------- */
	/* Imperative fallback (Obsidian < 1.13, where the API above is      */
	/* absent and this method is called instead)                         */
	/* ---------------------------------------------------------------- */

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const spec of this.specs()) {
			if (spec.kind === "heading") {
				new Setting(containerEl).setName(spec.name).setHeading();
				continue;
			}

			const setting = new Setting(containerEl).setName(spec.name).setDesc(spec.desc);

			switch (spec.kind) {
				case "toggle":
					setting.addToggle((t) =>
						t
							.setValue(this.getControlValue(spec.key) === true)
							.onChange((v) => void this.setControlValue(spec.key, v)),
					);
					break;
				case "dropdown":
					setting.addDropdown((d) => {
						for (const [value, label] of Object.entries(spec.options)) {
							d.addOption(value, label);
						}
						d.setValue(String(this.getControlValue(spec.key) ?? "")).onChange(
							(v) => void this.setControlValue(spec.key, v),
						);
					});
					break;
				case "text":
					setting.addText((t) => {
						if (spec.placeholder) t.setPlaceholder(spec.placeholder);
						t.setValue(String(this.getControlValue(spec.key) ?? "")).onChange(
							(v) => void this.setControlValue(spec.key, v),
						);
					});
					break;
				case "textarea":
					setting.addTextArea((t) => {
						if (spec.placeholder) t.setPlaceholder(spec.placeholder);
						t.setValue(String(this.getControlValue(spec.key) ?? "")).onChange(
							(v) => void this.setControlValue(spec.key, v),
						);
						if (spec.rows) t.inputEl.rows = spec.rows;
						t.inputEl.addClass("fgn-settings-json");
					});
					break;
				case "custom":
					spec.render(setting.descEl);
					break;
			}
		}
	}
}
