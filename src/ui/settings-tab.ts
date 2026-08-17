import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type FgNotationPlugin from "../main";
import type { GameProfile } from "../types";
import { BUILTIN_GAMES, listGames } from "../games";

export class FgSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: FgNotationPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const s = this.plugin.settings;
		const save = () => this.plugin.saveSettings();

		/* ---------------------------------------------------------------- */

		new Setting(containerEl)
			.setName("Default game")
			.setDesc("Used when a block is written as ```fg with no game id.")
			.addDropdown((d) => {
				for (const g of listGames()) d.addOption(g.id, `${g.id} — ${g.name}`);
				d.setValue(s.defaultGame).onChange(async (v) => {
					s.defaultGame = v;
					await save();
				});
			});

		new Setting(containerEl)
			.setName("Size")
			.setDesc("Base size of rendered notation. A block can override this with :sm, :md or :lg.")
			.addDropdown((d) => {
				d.addOption("sm", "Small");
				d.addOption("md", "Medium");
				d.addOption("lg", "Large");
				d.setValue(s.size).onChange(async (v) => {
					s.size = v as "sm" | "md" | "lg";
					await save();
				});
			});

		new Setting(containerEl).setName("Appearance").setHeading();

		new Setting(containerEl)
			.setName("Chips")
			.setDesc("Draw each step of the combo as a rounded chip. Off renders plain coloured text.")
			.addToggle((t) =>
				t.setValue(s.chips).onChange(async (v) => {
					s.chips = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Colour buttons")
			.setDesc("Tint attack buttons using each game's palette.")
			.addToggle((t) =>
				t.setValue(s.colorButtons).onChange(async (v) => {
					s.colorButtons = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Arrow icons by default")
			.setDesc("Render directions and motions as arrow glyphs everywhere. A block can force this on with :img.")
			.addToggle((t) =>
				t.setValue(s.iconsByDefault).onChange(async (v) => {
					s.iconsByDefault = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Game badge")
			.setDesc("Show the game's short name in the card header.")
			.addToggle((t) =>
				t.setValue(s.showBadge).onChange(async (v) => {
					s.showBadge = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Tooltips")
			.setDesc("Describe each token on hover (e.g. 236 → Quarter-circle forward).")
			.addToggle((t) =>
				t.setValue(s.showTooltips).onChange(async (v) => {
					s.showTooltips = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Copy button")
			.setDesc("Show a button that copies the raw notation.")
			.addToggle((t) =>
				t.setValue(s.showCopyButton).onChange(async (v) => {
					s.showCopyButton = v;
					await save();
				}),
			);

		new Setting(containerEl).setName("Editor").setHeading();

		new Setting(containerEl)
			.setName("Autocomplete")
			.setDesc("Suggest game ids after ```fg: and field names inside a block.")
			.addToggle((t) =>
				t.setValue(s.autocomplete).onChange(async (v) => {
					s.autocomplete = v;
					await save();
				}),
			);

		new Setting(containerEl)
			.setName("Template fields")
			.setDesc("Comma-separated fields inserted when you pick a game or accept the template.")
			.addText((t) =>
				t
					.setPlaceholder("input, name, damage, hits")
					.setValue(s.templateFields.join(", "))
					.onChange(async (v) => {
						s.templateFields = v
							.split(",")
							.map((f) => f.trim())
							.filter(Boolean);
						await save();
					}),
			);

		/* ---------------------------------------------------------------- */

		new Setting(containerEl).setName("Games").setHeading();

		const list = containerEl.createDiv({ cls: "fgn-settings-games" });
		for (const g of BUILTIN_GAMES) {
			const row = list.createDiv({ cls: "fgn-settings-game" });
			const dot = row.createSpan({ cls: "fgn-settings-dot" });
			dot.style.setProperty("--fgn-c", g.accent);
			row.createSpan({ cls: "fgn-settings-id", text: g.id });
			row.createSpan({ cls: "fgn-settings-name", text: g.name });
			if (g.aliases.length) {
				row.createSpan({
					cls: "fgn-settings-alias",
					text: g.aliases.join(", "),
				});
			}
		}

		new Setting(containerEl)
			.setName("Custom games")
			.setDesc(
				"JSON array of extra game profiles. Same shape as the built-ins; an id that matches a built-in replaces it.",
			)
			.addTextArea((t) => {
				t.setPlaceholder("[]")
					.setValue(
						s.userGames.length ? JSON.stringify(s.userGames, null, 2) : "",
					)
					.onChange(async (v) => {
						const text = v.trim();
						if (!text) {
							s.userGames = [];
							await save();
							return;
						}
						try {
							const parsed = JSON.parse(text);
							if (!Array.isArray(parsed)) throw new Error("expected an array");
							s.userGames = parsed as GameProfile[];
							await save();
						} catch (e) {
							// Keep typing — only complain once the JSON is plausible.
							if (text.endsWith("]")) new Notice(`Custom games: ${String(e)}`);
						}
					});
				t.inputEl.rows = 8;
				t.inputEl.addClass("fgn-settings-json");
			});
	}
}
