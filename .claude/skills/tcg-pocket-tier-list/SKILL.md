---
name: tcg-pocket-tier-list
description: Fetch live Pokémon TCG Pocket tournament data from Limitless (play.limitlesstcg.com) and produce a statistically honest tier list ranked by Wilson score lower bound of win rate. Use this whenever the user asks about the TCG Pocket meta, deck tier lists, deck win rates, "現在什麼牌組最強", "meta 環境", "更新資料", "更新排行榜", updating deck tiers or the Top 20 ranking on their site, or anything involving Limitless TCG Pocket data — even if they don't say "tier list" explicitly. Also use it to refresh the piplup-website /decks ranking (src/data/meta.json) together with the curated guides that describe it (src/data/decks.ts — both the tiers and the prose quoting ranks/usage rates); refreshing the ranking always means refreshing both. Also covers the ranking's 繁中 deck names (src/data/pokemon-names.json + deck-name.ts) — use it when a deck name on /decks shows up in English instead of Chinese, or when a new Pokémon needs a 繁中 translation added.
---

# TCG Pocket Tier List

Produce a tier list of the current Pokémon TCG Pocket competitive meta from live
Limitless tournament data, ranked by the **Wilson score lower bound** of each
deck's win rate — not raw win rate.

## Why Wilson score

The Limitless meta table contains ~500 archetypes, but most have only 1–2
recorded games. A deck at "77% win rate" over 1 game is noise; sorting by raw
win rate puts pure noise at the top and bottom. The Wilson lower bound (95%)
answers "how good is this deck _at least_" — small samples sink toward the
bottom, large consistent samples rise. Ties count as half a win.

## Workflow

1. Run the bundled script (requires Node 18+; no dependencies):

   ```bash
   node <skill-path>/scripts/fetch-tier-list.mjs --json <scratchpad>/tier-list.json
   ```

   It fetches `https://play.limitlesstcg.com/decks?game=pocket`, parses the
   server-rendered meta table (all archetypes are in the HTML, including rows
   hidden behind "show more" — no JS execution needed), computes Wilson scores,
   and prints a markdown tier list. `--json` additionally writes the full
   parsed dataset. Useful flags: `--min-share 0.5` (main-table cutoff, %),
   `--url <url>` (e.g. a specific format/set variant of the page).

2. Present the tier list to the user **in the conversation's language**
   (translate headings and commentary; keep English deck names as-is — they are
   proper nouns matching what players see in Limitless). That applies to the
   **conversation only** — the website's `/decks` table has shown 繁中 names
   with the English original underneath since 2026-08-17, and keeping it that
   way needs a step of its own (see "Deck name translations" below). Lead with the top
   tiers and notable movements; don't dump all 500 rows. Mention sample sizes
   when a placement is surprising — that's the whole point of the method.

3. If the script fails (HTTP error, "markup changed"), fetch the page manually
   and inspect it — Limitless may have changed their HTML. The parser expects
   `<table class="meta">` with `<tr data-share="..." data-winrate="...">` rows.

## Updating the piplup-website /decks ranking (meta.json)

The piplup-website (repo `Bubble-Beam`) renders a Top 20 ranking table on
`/decks` from `src/data/meta.json`. To refresh it, from the project root:

```bash
node <skill-path>/scripts/fetch-tier-list.mjs --json <scratchpad>/tier-list.json
node scripts/update-meta.mjs <scratchpad>/tier-list.json
```

`update-meta.mjs` slices the top 20, stamps `fetchedAt`, tags rows that have
curated guides (matched by Limitless name via `src/data/limitless-map.json`),
and fetches a representative decklist for every deck: archetype page → first
(best finish) player decklist → the hidden imggen form's JSON payload
(`[{count,name,set,number}]` — pocket.limitlesstcg.com/tools/imggen is
POST-only, so there is no hotlinkable image; the site renders the list itself
with its own card images and offers an "open as image" POST button). ~40
sequential fetches with 250ms delays, takes ~30s.

If the validation step reports card ids missing from `src/data/cards.json`, a
new expansion set was probably released — add it to `SETS` in
`scripts/fetch-cards.mjs` and re-run `node scripts/fetch-cards.mjs` (source:
flibustier/pokemon-tcg-pocket-database; check which set files exist with a
HEAD request before adding).

After updating, verify `/decks` in the browser (20 rows, **every row's deck
name in 繁中**, expanding a non-curated row shows its card grid, links work,
資料日期 updated), check deck-name coverage (right below) and curated tier
drift ("Refreshing the curated guides") in the same pass, then commit
`src/data/meta.json` (and any tier/name/card-index changes) together.

### Deck name translations (pokemon-names.json) — check every refresh

`/decks` renders each deck name as 繁中 on top with the Limitless English
underneath. The Chinese comes from `toDeckNameTC()` in `src/data/deck-name.ts`,
which translates the name word by word against `src/data/pokemon-names.json`
and **returns null — falling back to English-only — if even one word is
missing**. So a refresh that brings in a Pokémon the table doesn't know yet
silently turns those rows back into English. Nothing errors; the page just
gets less Chinese.

Check it right after `update-meta.mjs`:

```bash
npx tsx -e "import {toDeckNameTC} from './src/data/deck-name.ts'; import meta from './src/data/meta.json' with { type: 'json' }; const miss = meta.decks.filter(d => !toDeckNameTC(d.name)); console.log(miss.length ? miss.map(d => d.name).join('\n') : 'all translated');"
```

Anything it prints is a deck whose name has an unknown word. Find the word,
then add it to `names` in `pokemon-names.json`:

- **Never invent a translation.** Look it up at the official Taiwan Pokédex
  `https://tw.portal-pokemon.com/play/pokedex/{4-digit dex number}` (the page
  title is the 繁中 name), or Bulbapedia's "In other languages" section. If you
  can't confirm one, leave it out — that row stays English, which is the
  designed fallback, and a made-up name would be read as official.
- Keys are the raw strings as they appear in the Limitless name, **without
  `Mega` and `ex`** — those are handled by `deck-name.ts` (Mega stays English,
  ex is glued to the name: `Mega阿勃梭魯ex`). Keys may contain spaces
  (`Gouging Fire`, `Charizard Y`); matching is longest-prefix.
- The house style comes from `decks.ts`, not from official Mega naming. Don't
  "fix" `Mega` to 「超級」 in one place only — 26 curated deck names use the
  `Mega` form, and two conventions on one page is worse than not translating.

Re-run the check until it prints `all translated`, then re-read the table in
the browser.

### The two timestamps are UTC — the page shows them in Taiwan time

`fetchedAt` and `previousFetchedAt` are stored as UTC ISO strings, but readers
are in Taiwan (UTC+8). Any run after 16:00 UTC belongs to the _next_ Taiwan
calendar day, so slicing the raw string yields a date that looks a day stale —
this is what "資料更新日期都沒動過" means when the pipeline clearly did run.
The page formats both through `formatSnapshotDate()` in `src/data/meta.ts`
(adds 8h, then slices). When checking 資料日期 above, compare it against the
**Taiwan** date of the run, not the ISO string in the file.

Keep the stored values UTC — `scripts/generate-sitemap.mjs` uses `fetchedAt`
as `lastmod` and wants it that way. And don't rewrite the helper as `Intl`
with `timeZone: "Asia/Taipei"`: SSR runs on Cloudflare Workers, whose ICU
timezone data may not match local Node, and a server/client disagreement here
is a hydration mismatch that dev (plain Node) won't reproduce. Taiwan has no
DST, so the fixed offset is permanently correct.

`previousFetchedAt` is the _previous_ `meta.json`'s `fetchedAt`, so both dates
collapse to the same day if the pipeline runs twice in one Taiwan day — which
the project's CLAUDE.md already forbids for a worse reason (the second run
wipes every real rank movement to "unchanged", unrecoverably).

## Refreshing the curated guides (same pass — not optional)

**The user's standing instruction: updating the ranking means updating the
table _and_ the prose that describes it.** `meta.json` is regenerated by the
script, but `src/data/decks.ts` is hand-written and will happily keep
describing last month's meta. Two things drift, and both are checked in the
same pass as the data refresh.

The page copy on `/decks` itself needs no edit — its dates come from
`formatSnapshotDate(meta.fetchedAt)` and its counts from `meta.decks.length`,
so they follow the data automatically. It's `decks.ts` that goes stale. (The
one hand-written sentence in that intro is the 「牌組名以繁體中文顯示，下方小字
為 Limitless 的英文原名」 line — it describes how the table renders, not the
data, so it only needs touching if the deck-name display itself changes.)

### 1. Tiers

Requires `src/data/limitless-map.json` (the piplup-website deck guide has one):

1. Read the map: it links site deck ids → `limitlessName` (match on this; slugs
   drift when Limitless renames set suffixes).
2. For each mapped deck, look up its archetype in the script's JSON output by
   `name` and take the computed `tier`.
3. The site's `Tier` type is `"S" | "A" | "B" | "C"` — clamp the script's
   `D` tier to `C`.
4. Show the user a before/after table of proposed tier changes and get their
   OK, then edit the `tier:` fields in `src/data/decks.ts` with the Edit tool.
   Don't add/remove decks — curation stays human.
5. If a mapped name no longer appears in the data (archetype fell off the
   table or was renamed), say so instead of guessing; the user may need to
   update the map.

### 2. Prose that quotes the meta

`summary` and `strategy` strings make claims that were only true of one
snapshot — 「使用率第二」「約佔 10%」「當前賽場登場率第一」「目前勝率極高的主流
牌組」「在現環境站穩腳步」. Nothing recomputes these; they just quietly become
wrong. Find the candidates:

```
使用率|登場率|第[一二三]|約佔|[0-9]+(\.[0-9]+)?\s*%|目前|當前|現環境|主流|勝率
```

This is **cross-check-and-judge, not find-replace** — most hits are still
accurate and must be left alone. For each hit, find that deck's current row in
`meta.json` (its `curatedId` equals the deck's `id`) and compare against
`rank` / `sharePct` / `tier`. Edit only what the new data contradicts, and show
the user before/after, same as tiers.

When a deck has dropped out of the Top 20 there is no current number to
substitute — **delete the ranking claim** instead of swapping in a fresh one,
so it can't go stale again. Claims about the card's own behaviour (damage,
combo lines) aren't ranking claims; leave them.

Editing `decks.ts` by hand is deliberate: it has pre-existing prettier
violations, so `prettier --write` on it would sweep unrelated reformatting into
the diff. Keep edits surgical and prettier-clean.

## Method details (for explaining to users)

- successes = wins + 0.5 × ties; n = wins + losses + ties
- Wilson lower bound at z = 1.96 (95% confidence)
- Tier thresholds on the lower bound: S ≥ 52%, A ≥ 50%, B ≥ 48%, C ≥ 45%,
  D < 45%
- Thresholds are calibrated to this game's typical spread (mirror-heavy meta
  keeps most win rates within ~45–55%); if the whole table shifts, tiers still
  rank correctly relative to each other.
