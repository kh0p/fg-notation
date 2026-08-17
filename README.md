# FG Notation

Render fighting game combo notation in Obsidian — for **any** game, not just one.

````markdown
```fg:tokon
input: 236M > M > 2H > jump > M H > M H H > A > 214M > 623M > jump > H 6H > H 6H H
name: Magik Basic Assist Loop
damage: 45000
hits: 26
```
````

Each step of the combo becomes a chip, buttons are coloured using the game's own
palette, motions and directions get tooltips (`236` → "Quarter-circle forward"),
and the metadata renders as a compact stat row.

## Install

**Manually** — download `main.js`, `manifest.json` and `styles.css` from the
[latest release](https://github.com/kh0p/fg-notation/releases/latest) into
`<vault>/.obsidian/plugins/fg-notation/`, then enable it under Settings →
Community plugins.

**With [BRAT](https://github.com/TfTHacker/obsidian42-brat)** — add
`kh0p/fg-notation` as a beta plugin.

## Block syntax

The fence is `fg`, then the game, then any options:

```
fg:<game>[:<option>…]
```

| Option | Effect |
| --- | --- |
| `img` | Draw directions and motions as arrow glyphs instead of digits |
| `compact` | Drop the card chrome — just the accent bar and the combo |
| `plain` | No chips; colourised text only |
| `nobadge` | Hide the game badge |
| `sm` / `md` / `lg` | Override the size for this block |

Example: ```` ```fg:ggst:img:compact ````

### Fields

Everything is optional. A block with no `input:` line treats its bare text as
the notation, so ```` ```fg:ggst ```` followed by `5P > 2K xx 236K` just works.

`input` (aliases: `combo`, `notation`) · `name` (`title`) · `damage` (`dmg`) ·
`hits` · `character` (`char`) · `meter` (`cost`, `gauge`) · `position` (`pos`) ·
`works` · `difficulty` · `video` (`link`) · `notes` · `tags`

Field names are case-insensitive, so `Hits: 26` is the same as `hits: 26`.
Unknown `key: value` lines are kept and shown verbatim rather than dropped.

Put several combos in one block by separating them with `---`:

````markdown
```fg:sf6
input: cr.MK xx DR > 5HP > 236HP
name: Midscreen
---
input: 5HP xx 214PP xx 236236P
name: Corner, with super
```
````

## Supported games

| id | Game | Notation |
| --- | --- | --- |
| `tokon` | MARVEL Tōkon: Fighting Souls | L/M/H/U + A (Assemble) |
| `sf6` | Street Fighter 6 | LP–HK, Drive system |
| `sf3` | SF III: 3rd Strike / SFV | LP–HK |
| `tekken` | Tekken 8 / 7 | 1–4 buttons, letter directions |
| `ggst` | Guilty Gear -Strive- | P K S HS D |
| `ggxrd` | GG Xrd / +R | P K S HS D |
| `gbvsr` | Granblue Fantasy Versus: Rising | L M H U |
| `bbcf` | BlazBlue: Centralfiction | A B C D |
| `uni` | Under Night In-Birth II | A B C D |
| `mbtl` | Melty Blood: Type Lumina | A B C D |
| `dbfz` | Dragon Ball FighterZ | L M H S + assists |
| `mvc3` | Ultimate Marvel vs. Capcom 3 | L M H S + assists |
| `sg` | Skullgirls | LP–HK |
| `kof` | King of Fighters XV | A B C D |
| `cotw` | Fatal Fury: City of the Wolves | LP LK HP HK, REV |
| `mk1` | Mortal Kombat 1 | 1–4 buttons, F/B/D/U |
| `vf5` | Virtua Fighter 5 | P K G |
| `sc6` | Soulcalibur VI | A B K G |
| `generic` | Anything else | Broad numpad vocabulary |

Most have aliases — `strive`, `gg`, `t8`, `granblue`, `melty`, `umvc3` and so
on all resolve. Autocomplete lists them all.

### Adding your own

Settings → **Custom games** takes a JSON array of profiles with the same shape
as the built-ins. An `id` matching a built-in replaces it, so you can retune
colours or add a button without forking the plugin.

## How the notation is read

Three families, because the games genuinely disagree:

- **numpad** — digits are directions (`2H` is down + Heavy) and digit runs are
  greedily matched against known motions, longest first, so `632146HS` stays one
  motion instead of collapsing into `63` + `214` + `6`.
- **tekken** — digits 1–4 are *buttons*, directions are letters, and case is
  meaningful: `f` taps forward, `F` holds it. This is the only case-sensitive
  profile.
- **nrs** — Mortal Kombat: digits 1–4 are buttons, directions are `F/B/D/U`.

Beyond that the tokenizer understands connectors (`>`, `,`, `xx`, `~`, `->`,
`/`), prefixes (`j.`, `cr.`, `cl.`, `f.`, `c.`, `dl.`, `TK`, `IAD`), annotations
(`CH`, `PC`, `OTG`, `x3`, `[4]` charge, `(2)` hit counts), and plain-English
steps like `jump`, `dash` and `land`, which render as muted stage directions.

Anything it does not recognise is left alone and shown as text — an unknown move
name never gets chopped into letters.

## Autocomplete

With autocomplete on (default):

- Typing ```` ```fg: ```` offers the game list. Picking one scaffolds the whole
  block — `input:`, `name:`, `damage:`, `hits:` and the closing fence — and puts
  the cursor after `input: `.
- On an empty line inside a block, the field list appears, with an "Insert combo
  template" entry at the top when the block is still empty.

Which fields the template inserts is configurable in settings.

There are also two commands: **Insert combo block** (with a game picker) and
**Insert combo block (default game)**.

## Styling

The stylesheet exposes a Style Settings section (notation size, chip radius,
card radius, accent bar width, button fill strength, chip background) if you use
the Style Settings plugin. Colours are Obsidian theme variables throughout, so
it follows light and dark automatically.

Arrow glyphs are drawn inline as SVG rather than fetched from a wiki or combo
site, so `:img` works offline, in exports, and without hotlinking anyone's
assets.

## Development

```bash
npm install
npm run dev      # watch build
npm run build    # typecheck + minified build
node test/run.mjs      # tokenizer + block-parser tests
node test/preview.mjs  # writes preview.html showing every example rendered
```
