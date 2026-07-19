---
name: tcg-pocket-tier-list
description: Fetch live Pokémon TCG Pocket tournament data from Limitless (play.limitlesstcg.com) and produce a statistically honest tier list ranked by Wilson score lower bound of win rate. Use this whenever the user asks about the TCG Pocket meta, deck tier lists, deck win rates, "現在什麼牌組最強", "meta 環境", "更新資料", "更新排行榜", updating deck tiers or the Top 20 ranking on their site, or anything involving Limitless TCG Pocket data — even if they don't say "tier list" explicitly. Also use it to refresh the piplup-website /decks ranking (src/data/meta.json) and curated deck tiers (src/data/decks.ts).
---

# TCG Pocket Tier List

Produce a tier list of the current Pokémon TCG Pocket competitive meta from live
Limitless tournament data, ranked by the **Wilson score lower bound** of each
deck's win rate — not raw win rate.

## Why Wilson score

The Limitless meta table contains ~500 archetypes, but most have only 1–2
recorded games. A deck at "77% win rate" over 1 game is noise; sorting by raw
win rate puts pure noise at the top and bottom. The Wilson lower bound (95%)
answers "how good is this deck *at least*" — small samples sink toward the
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
   proper nouns matching what players see in Limitless). Lead with the top
   tiers and notable movements; don't dump all 500 rows. Mention sample sizes
   when a placement is surprising — that's the whole point of the method.

3. If the script fails (HTTP error, "markup changed"), fetch the page manually
   and inspect it — Limitless may have changed their HTML. The parser expects
   `<table class="meta">` with `<tr data-share="..." data-winrate="...">` rows.

## Updating the piplup-website /decks ranking (meta.json)

The piplup-website (`D:\piplup-website`) renders a Top 20 ranking table on
`/decks` from `src/data/meta.json`. To refresh it:

```bash
node <skill-path>/scripts/fetch-tier-list.mjs --json <scratchpad>/tier-list.json
cd D:\piplup-website
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

After updating, verify `/decks` in the browser (20 rows, expanding a
non-curated row shows its card grid, links work, 資料日期 updated), check
curated tier drift (next section) in the same pass, then commit
`src/data/meta.json` (and any tier/card-index changes) together.

## Updating a site's curated deck tiers (optional follow-up)

If the working project contains `src/data/limitless-map.json` (the
piplup-website deck guide has one), the user's curated decks can be synced to
live data:

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

## Method details (for explaining to users)

- successes = wins + 0.5 × ties; n = wins + losses + ties
- Wilson lower bound at z = 1.96 (95% confidence)
- Tier thresholds on the lower bound: S ≥ 52%, A ≥ 50%, B ≥ 48%, C ≥ 45%,
  D < 45%
- Thresholds are calibrated to this game's typical spread (mirror-heavy meta
  keeps most win rates within ~45–55%); if the whole table shifts, tiers still
  rank correctly relative to each other.
