#!/usr/bin/env node
// Fetch the Pokémon TCG Pocket meta table from Limitless and rank decks into a
// tier list using the Wilson score lower bound (95%) of each deck's win rate.
//
// Why Wilson instead of raw win rate: most archetypes on the page have very few
// recorded games (often 1-2), where a raw win rate of 100% or 0% is pure noise.
// The Wilson lower bound answers "how good is this deck *at least*, with 95%
// confidence" — small samples get pulled toward the bottom, large consistent
// samples rise. Ties count as half a win.
//
// Usage:
//   node fetch-tier-list.mjs                 # markdown tier list to stdout
//   node fetch-tier-list.mjs --json out.json # also write full data as JSON
//   node fetch-tier-list.mjs --min-share 0.5 # main table cutoff (default 0.5%)
//   node fetch-tier-list.mjs --url <url>     # override source URL

import { writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] !== undefined ? args[i + 1] : fallback;
}

const URL_ = argValue("--url", "https://play.limitlesstcg.com/decks?game=pocket");
const JSON_OUT = argValue("--json", null);
const MIN_SHARE = parseFloat(argValue("--min-share", "0.5"));

const Z = 1.96; // 95% confidence

function wilsonLowerBound(successes, n) {
  if (n === 0) return 0;
  const p = successes / n;
  const z2 = Z * Z;
  return (
    (p + z2 / (2 * n) - Z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) /
    (1 + z2 / n)
  );
}

function tierOf(lb) {
  if (lb >= 0.52) return "S";
  if (lb >= 0.5) return "A";
  if (lb >= 0.48) return "B";
  if (lb >= 0.45) return "C";
  return "D";
}

const res = await fetch(URL_, { headers: { "user-agent": "Mozilla/5.0 (tier-list script)" } });
if (!res.ok) {
  console.error(`Fetch failed: HTTP ${res.status} for ${URL_}`);
  process.exit(1);
}
const html = await res.text();

// The page is fully server-rendered: every archetype (including rows hidden
// behind the "show more" toggle, marked class="more") is present in the HTML
// with data-share / data-winrate attributes. No JS execution needed.
const tableMatch = html.match(/<table class="meta">([\s\S]*?)<\/table>/);
if (!tableMatch) {
  console.error(
    "Could not find <table class=\"meta\"> in the page. Limitless may have changed their markup — inspect the HTML and update the parser.",
  );
  process.exit(1);
}

const rowRe =
  /<tr(?: class="more")? data-share="([^"]+)" data-winrate="([^"]+)">([\s\S]*?)<\/tr>/g;
const decks = [];
let m;
while ((m = rowRe.exec(tableMatch[1])) !== null) {
  const cells = m[3];
  const nameMatch = cells.match(/<a href="(\/decks\/[^"?]+)[^"]*">([^<]+)<\/a>/);
  const countMatch = cells.match(/<td class="landscape-only">(\d+)<\/td>/);
  const recordMatch = cells.match(/>(\d+) - (\d+) - (\d+)<\/a>/);
  if (!nameMatch || !recordMatch) continue;
  const wins = Number(recordMatch[1]);
  const losses = Number(recordMatch[2]);
  const ties = Number(recordMatch[3]);
  const games = wins + losses + ties;
  const lb = wilsonLowerBound(wins + ties * 0.5, games);
  decks.push({
    name: nameMatch[2],
    slug: nameMatch[1],
    sharePct: +(parseFloat(m[1]) * 100).toFixed(2),
    winratePct: +(parseFloat(m[2]) * 100).toFixed(2),
    players: countMatch ? Number(countMatch[1]) : null,
    wins,
    losses,
    ties,
    games,
    wilsonLowerBoundPct: +(lb * 100).toFixed(2),
    tier: tierOf(lb),
  });
}

if (decks.length === 0) {
  console.error("Parsed 0 rows — the row markup may have changed. Inspect the HTML.");
  process.exit(1);
}

decks.sort((a, b) => b.wilsonLowerBoundPct - a.wilsonLowerBoundPct);

if (JSON_OUT) {
  await writeFile(JSON_OUT, JSON.stringify({ source: URL_, fetchedAt: null, decks }, null, 2));
}

// ---- markdown report ----
const main = decks.filter((d) => d.sharePct >= MIN_SHARE);
const excluded = decks.length - main.length;
const titleMatch = html.match(/<title>([^<]*)<\/title>/);

const lines = [];
lines.push(`# TCG Pocket Tier List (Wilson score, 95% lower bound)`);
lines.push(``);
lines.push(`Source: ${URL_}`);
if (titleMatch) lines.push(`Page: ${titleMatch[1]}`);
lines.push(`Archetypes parsed: ${decks.length} (main table: share >= ${MIN_SHARE}%; ${excluded} low-share decks summarized at the end)`);
lines.push(``);

const TIERS = ["S", "A", "B", "C", "D"];
for (const t of TIERS) {
  const group = main.filter((d) => d.tier === t);
  if (group.length === 0) continue;
  lines.push(`## Tier ${t}`);
  lines.push(``);
  lines.push(`| # | Deck | Wilson LB | Raw Win % | Share | Games (W-L-T) |`);
  lines.push(`|---|------|-----------|-----------|-------|---------------|`);
  group.forEach((d, i) => {
    lines.push(
      `| ${i + 1} | ${d.name} | ${d.wilsonLowerBoundPct}% | ${d.winratePct}% | ${d.sharePct}% | ${d.games} (${d.wins}-${d.losses}-${d.ties}) |`,
    );
  });
  lines.push(``);
}

if (excluded > 0) {
  const best = decks.filter((d) => d.sharePct < MIN_SHARE).slice(0, 5);
  lines.push(`## Low-share decks (share < ${MIN_SHARE}%, ${excluded} archetypes)`);
  lines.push(``);
  lines.push(
    `Small-sample archetypes are ranked by the same formula but usually sink because few games -> low confidence. Best of them:`,
  );
  lines.push(``);
  for (const d of best) {
    lines.push(
      `- ${d.name}: LB ${d.wilsonLowerBoundPct}% (raw ${d.winratePct}%, ${d.games} games)`,
    );
  }
  lines.push(``);
}

lines.push(`---`);
lines.push(
  `Method: successes = wins + 0.5*ties; n = wins+losses+ties; Wilson lower bound at z=1.96. Tiers: S >= 52%, A >= 50%, B >= 48%, C >= 45%, D < 45% (on the lower bound, not raw win rate).`,
);

console.log(lines.join("\n"));
