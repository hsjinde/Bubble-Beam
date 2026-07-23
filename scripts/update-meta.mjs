// Transforms the tcg-pocket-tier-list skill's JSON output into src/data/meta.json,
// consumed by the /decks ranking page. Keeps the top N archetypes by Wilson lower
// bound (after dropping tiny samples and same-name duplicates, see MIN_GAMES),
// tags rows that have a curated guide (matched by Limitless display name via
// limitless-map.json), and samples several public decklists per deck so the site
// can render the 20-card list with real card images *and* show how often each
// card actually shows up across the field (core cards vs flex slots).
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
// 每套牌取樣幾份公開牌表來算採用率。上游每個 archetype 頁去重後剛好提供 20 份
// （HTML 裡每列出現兩次，別被未去重的數量誤導），所以 20 就是全取。
// 實測 10 份會把差異洗掉：Mega Gardevoir 在 20 份下是「核心 8／常見 6／自由席 6」，
// 10 份則多數牌組都塌成「核心 13／自由席 0」，看不出取捨。
const LISTS_PER_DECK = 20;
// 採用率低於此值的卡不寫進 meta.json，見 aggregateUsage() 的體積說明。
const MIN_USAGE_PCT = 15;
// The ranking page sells itself as "有統計信心的最低實力", so archetypes with a
// handful of recorded games don't belong on it — a 22-game deck rides sampling
// noise into the top 20 and pushes out an established one.
const MIN_GAMES = 100;
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

// Pull the structured decklist out of a decklist page's hidden imggen form.
function parseDecklist(html) {
  const form = html.match(/name="input" value="([^"]+)"/);
  if (!form) return null;
  return JSON.parse(decodeEntities(form[1])).map((c) => ({
    id: toCardId(c.set, c.number),
    count: c.count,
    name: c.name,
    set: c.set,
    number: String(c.number),
  }));
}

// Fetch the archetype page and follow up to `limit` of its decklist links
// (Limitless publishes ~40 per archetype, ordered best finish first). The first
// list becomes the representative one; the whole batch is what card usage rates
// are computed from.
async function fetchDeckLists(slug, limit) {
  const archetypeHtml = await fetchText(`${BASE}${slug}?game=POCKET`);
  const hrefs = [
    ...new Set(
      [...archetypeHtml.matchAll(/href="(\/tournament\/[^"]+\/decklist)"/g)].map((m) => m[1]),
    ),
  ].slice(0, limit);
  const lists = [];
  for (const href of hrefs) {
    await sleep(250);
    const url = `${BASE}${href}`;
    try {
      const cards = parseDecklist(await fetchText(url));
      if (cards) lists.push({ cards, url });
    } catch {
      // 單一牌表抓失敗不該讓整套牌沒有資料——少一份樣本就好
    }
  }
  return lists.length ? lists : null;
}

// Card usage across the sampled lists: what share of lists ran the card at all,
// plus the most common copy count among those that did. This is what separates
// the core cards every list runs from the flex slots each player picks.
function aggregateUsage(lists) {
  const countsById = new Map();
  for (const { cards } of lists) {
    for (const c of cards) {
      if (!countsById.has(c.id)) countsById.set(c.id, []);
      countsById.get(c.id).push(c.count);
    }
  }
  const usage = [];
  for (const [id, counts] of countsById) {
    const usagePct = Math.round((counts.length / lists.length) * 100);
    // 濾掉一次性科技牌：meta.json 會被 meta.ts 靜態 import 進 client bundle，
    // 不設下限的話長尾會把它撐大一倍（見 CLAUDE.md 的卡片索引教訓）。
    if (usagePct < MIN_USAGE_PCT) continue;
    const tally = new Map();
    for (const n of counts) tally.set(n, (tally.get(n) ?? 0) + 1);
    // 眾數張數；同票時取張數大的（2 張比 1 張更能代表「這牌位」）
    const modalCount = [...tally.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
    usage.push({ id, usagePct, modalCount });
  }
  // id 當第二排序鍵：讓同採用率的順序穩定，重跑的 diff 才乾淨
  return usage.sort((a, b) => b.usagePct - a.usagePct || a.id.localeCompare(b.id));
}

const data = JSON.parse(await readFile(input, "utf8"));
const map = JSON.parse(
  await readFile(new URL("../src/data/limitless-map.json", import.meta.url), "utf8"),
);

// 排名變化的基準：現有的 meta.json 就是「上一次」的快照，覆寫前先讀進來比對。
// 沒有既有檔案時（第一次產生）整批不寫 previousRank，前端才不會把 20 列全標成新進榜。
const metaPath = new URL("../src/data/meta.json", import.meta.url);
let previous = null;
try {
  previous = JSON.parse(await readFile(metaPath, "utf8"));
} catch {
  console.log("no existing meta.json to diff against — this run omits rank changes");
}
const previousRanks = new Map((previous?.decks ?? []).map((d) => [d.name, d.rank]));

const nameToCuratedId = {};
for (const [id, entry] of Object.entries(map)) {
  if (entry && typeof entry === "object" && entry.limitlessName) {
    nameToCuratedId[entry.limitlessName] = id;
  }
}

// Limitless sometimes lists two archetypes under one display name (the A2 and B3
// Lucario variants both render as "Mega Lucario ex Lucario", differing only by
// slug). Since curated guides are matched by name, both rows would link to the
// same guide and read as a duplicate — keep whichever has the larger sample.
const byName = new Map();
for (const d of data.decks) {
  if (d.games < MIN_GAMES) continue;
  const prev = byName.get(d.name);
  if (!prev || d.games > prev.games) byName.set(d.name, d);
}
const eligible = [...byName.values()].sort((a, b) => b.wilsonLowerBoundPct - a.wilsonLowerBoundPct);
const dropped = data.decks.length - eligible.length;

const decks = [];
for (const [i, d] of eligible.slice(0, TOP_N).entries()) {
  const deck = {
    rank: i + 1,
    // 上次也在榜上就記其名次，不在榜上記 null（＝新進榜）
    ...(previousRanks.size
      ? { previousRank: previousRanks.has(d.name) ? previousRanks.get(d.name) : null }
      : {}),
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
    const lists = await fetchDeckLists(d.slug, LISTS_PER_DECK);
    if (lists) {
      // 第一份＝最佳賽績，仍當「代表牌表」，欄位語意與前端不變
      deck.cards = lists[0].cards;
      deck.listSource = lists[0].url;
      deck.listsSampled = lists.length;
      deck.cardUsage = aggregateUsage(lists);
    }
    console.log(
      `#${deck.rank} ${deck.name}: ${
        lists
          ? `${lists[0].cards.length} card entries, ${lists.length} lists sampled, ${deck.cardUsage.length} cards ≥${MIN_USAGE_PCT}%`
          : "no decklist found"
      }`,
    );
  } catch (err) {
    console.log(
      `#${deck.rank} ${deck.name}: decklist fetch failed (${err.message}) — row kept without cards`,
    );
  }
  decks.push(deck);
  await sleep(250);
}

const out = {
  fetchedAt: new Date().toISOString(),
  source: data.source,
  ...(previous?.fetchedAt ? { previousFetchedAt: previous.fetchedAt } : {}),
  decks,
};
await writeFile(metaPath, JSON.stringify(out, null, 2));
const moved = decks.filter((d) => typeof d.previousRank === "number" && d.previousRank !== d.rank);
console.log(
  `wrote meta.json: top ${decks.length} of ${eligible.length} eligible (${dropped} archetypes below ${MIN_GAMES} games or same-name duplicates), ${decks.filter((d) => d.curatedId).length} curated links, ${decks.filter((d) => d.cards).length} with sample decklists, ${decks.reduce((n, d) => n + (d.listsSampled ?? 0), 0)} lists sampled for usage rates, fetched ${out.fetchedAt}`,
);
if (previousRanks.size) {
  console.log(
    `rank changes vs ${previous.fetchedAt}: ${moved.filter((d) => d.previousRank > d.rank).length} up, ${moved.filter((d) => d.previousRank < d.rank).length} down, ${decks.filter((d) => d.previousRank === d.rank).length} unchanged, ${decks.filter((d) => d.previousRank === null).length} new`,
  );
}
