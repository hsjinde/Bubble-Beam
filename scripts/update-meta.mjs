// Transforms the tcg-pocket-tier-list skill's JSON output into src/data/meta.json,
// consumed by the /decks ranking page. Keeps the top N archetypes (already sorted
// by Wilson lower bound) and tags rows that have a curated guide on this site
// (matched by Limitless display name via limitless-map.json).
//
// Usage:
//   node <skill-path>/scripts/fetch-tier-list.mjs --json <tmp>/tier-list.json
//   node scripts/update-meta.mjs <tmp>/tier-list.json
import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/update-meta.mjs <tier-list.json>");
  process.exit(1);
}
const TOP_N = 20;

const data = JSON.parse(await readFile(input, "utf8"));
const map = JSON.parse(
  await readFile(new URL("../src/data/limitless-map.json", import.meta.url), "utf8"),
);

const nameToCuratedId = {};
for (const [id, entry] of Object.entries(map)) {
  if (entry && typeof entry === "object" && entry.limitlessName) {
    nameToCuratedId[entry.limitlessName] = id;
  }
}

const decks = data.decks.slice(0, TOP_N).map((d, i) => ({
  rank: i + 1,
  name: d.name,
  tier: d.tier,
  wilsonLowerBoundPct: d.wilsonLowerBoundPct,
  winratePct: d.winratePct,
  sharePct: d.sharePct,
  games: d.games,
  record: `${d.wins}-${d.losses}-${d.ties}`,
  ...(nameToCuratedId[d.name] ? { curatedId: nameToCuratedId[d.name] } : {}),
}));

const out = {
  fetchedAt: new Date().toISOString(),
  source: data.source,
  decks,
};
await writeFile(new URL("../src/data/meta.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(
  `wrote meta.json: top ${decks.length}, ${decks.filter((d) => d.curatedId).length} linked to curated guides, fetched ${out.fetchedAt}`,
);
