// Transforms the tcg-pocket-tier-list skill's JSON output into src/data/meta.json,
// consumed by the /decks ranking page. Keeps the top N archetypes (already sorted
// by Wilson lower bound), tags rows that have a curated guide (matched by
// Limitless display name via limitless-map.json), and fetches a representative
// decklist for every deck (its best recent tournament finish on Limitless) so
// the site can render the 20-card list with real card images.
//
// The decklist comes from the hidden "Open as Image" form on each player's
// decklist page — Limitless posts structured JSON [{count,name,set,number}] to
// pocket.limitlesstcg.com/tools/imggen, which is exactly the data we need.
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
const BASE = "https://play.limitlesstcg.com";
const UA = { "user-agent": "Mozilla/5.0 (piplup-website meta updater)" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Limitless set codes P-A/P-B correspond to PROMO-A/PROMO-B in our cards.json.
function toCardId(set, number) {
  const mapped = set === "P-A" ? "PROMO-A" : set === "P-B" ? "PROMO-B" : set;
  return `${mapped}-${number}`;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Fetch the archetype page, follow its first (best finish) decklist link, and
// pull the structured decklist out of the imggen form.
async function fetchSampleList(slug) {
  const archetypeHtml = await fetchText(`${BASE}${slug}?game=POCKET`);
  const listLink = archetypeHtml.match(/href="(\/tournament\/[^"]+\/decklist)"/);
  if (!listLink) return null;
  const listUrl = `${BASE}${listLink[1]}`;
  await sleep(250);
  const listHtml = await fetchText(listUrl);
  const form = listHtml.match(/name="input" value="([^"]+)"/);
  if (!form) return null;
  const cards = JSON.parse(decodeEntities(form[1])).map((c) => ({
    id: toCardId(c.set, c.number),
    count: c.count,
    name: c.name,
    set: c.set,
    number: String(c.number),
  }));
  return { cards, listSource: listUrl };
}

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

const decks = [];
for (const [i, d] of data.decks.slice(0, TOP_N).entries()) {
  const deck = {
    rank: i + 1,
    name: d.name,
    tier: d.tier,
    wilsonLowerBoundPct: d.wilsonLowerBoundPct,
    winratePct: d.winratePct,
    sharePct: d.sharePct,
    games: d.games,
    record: `${d.wins}-${d.losses}-${d.ties}`,
    ...(nameToCuratedId[d.name] ? { curatedId: nameToCuratedId[d.name] } : {}),
  };
  try {
    const sample = await fetchSampleList(d.slug);
    if (sample) {
      deck.cards = sample.cards;
      deck.listSource = sample.listSource;
    }
    console.log(`#${deck.rank} ${deck.name}: ${sample ? sample.cards.length + " card entries" : "no decklist found"}`);
  } catch (err) {
    console.log(`#${deck.rank} ${deck.name}: decklist fetch failed (${err.message}) — row kept without cards`);
  }
  decks.push(deck);
  await sleep(250);
}

const out = {
  fetchedAt: new Date().toISOString(),
  source: data.source,
  decks,
};
await writeFile(new URL("../src/data/meta.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(
  `wrote meta.json: top ${decks.length}, ${decks.filter((d) => d.curatedId).length} curated links, ${decks.filter((d) => d.cards).length} with sample decklists, fetched ${out.fetchedAt}`,
);
