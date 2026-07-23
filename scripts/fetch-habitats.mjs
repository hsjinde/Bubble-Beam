// One-shot: scrape the Pokopia habitat list and write a local index so the app
// can answer "I want Pokémon X — which habitat attracts it?" without hitting the
// upstream site at runtime.
//
// Data source: pokopia.pokemonhubs.com (the same community database the building
// guide already uses — see src/data/pokopia/types.ts). Habitat names, Pokémon
// names and categories are upstream Traditional Chinese data, used as-is.
//
// Images are hotlinked from pokopiadex.com like the buildings are, so only the
// path fragment is stored. Pokémon sprites are derivable from the slug
// (`sprites/{slug}.png`), so they aren't stored at all.
//
// Usage:
//   node scripts/fetch-habitats.mjs
import { writeFile } from "node:fs/promises";

const BASE = "https://pokopia.pokemonhubs.com";
const UA = { "user-agent": "Mozilla/5.0 (piplup-website habitat fetcher)" };
const OUT = new URL("../src/data/pokopia/habitats.json", import.meta.url);
const MAX_PAGES = 30; // 迴圈上限，避免上游分頁行為改變時無限抓下去

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// 清掉標籤與多餘空白，取出元素的純文字
function textOf(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** 從列表頁抓出這一頁的棲息地（slug／編號／繁中名／圖片路徑）。 */
function parseListPage(html) {
  const out = [];
  for (const m of html.matchAll(/<a class="habitat-card"[\s\S]*?<\/a>/g)) {
    const block = m[0];
    const slug = block.match(/href="\/habitats\/([^"/]+)\//)?.[1];
    if (!slug) continue;
    const no = Number(block.match(/class="habitat-num"[^>]*>\s*No\.(\d+)/)?.[1] ?? 0);
    const name = textOf(block.match(/class="habitat-name"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
    // 完整網址只取 /images/habitats/ 之後的片段，基底放在前端（比照建築的做法）
    const image = block.match(/\/images\/habitats\/([^"?]+)/)?.[1] ?? "";
    out.push({ id: slug, no, name, image });
  }
  return out;
}

/**
 * 從詳情頁抓出出沒寶可夢。
 *
 * 卡片有兩種形態，兩種都要收：
 *   `<a class="pokemon-card" href="/pokedex/{slug}/">`   一般寶可夢，有圖鑑頁與編號
 *   `<div class="pokemon-card pokemon-card--static">`    沒有圖鑑頁的變種（如顫弦蠑螈低音形態），
 *                                                        沒有連結也沒有編號，slug 只能從 sprite 檔名取
 *
 * 用「以卡片開頭標籤切段」而非配對結尾標籤：靜態型內部就有 <div>，配對結尾會被
 * 內層的 </div> 提早截斷（這正是第一版漏掉那筆的原因）。
 */
function parseHabitatPokemon(html) {
  const start = html.indexOf('<div class="pokemon-grid">');
  if (start === -1) return [];
  const end = html.indexOf("</main>", start);
  const scope = html.slice(start, end === -1 ? undefined : end);

  const out = [];
  for (const part of scope.split(/<(?:a|div) class="pokemon-card/).slice(1)) {
    const id =
      part.match(/href="\/pokedex\/([^"/]+)\//)?.[1] ?? part.match(/\/sprites\/([^"?]+)\.\w+/)?.[1];
    if (!id) continue;
    out.push({
      id,
      no: Number(part.match(/class="poke-num"[^>]*>\s*#(\d+)/)?.[1] ?? 0),
      name: textOf(part.match(/class="poke-name"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? ""),
      category: textOf(part.match(/class="poke-class"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? ""),
    });
  }
  return out;
}

// 1. 逐頁收集棲息地。上游第 1 頁是 /habitats/，之後是 /habitats/page/N/。
//    以「這一頁沒有帶來新的 slug」為終止條件，不寫死頁數。
const byId = new Map();
for (let page = 1; page <= MAX_PAGES; page++) {
  const url = page === 1 ? `${BASE}/habitats/` : `${BASE}/habitats/page/${page}/`;
  let html;
  try {
    html = await fetchText(url);
  } catch (err) {
    console.log(`page ${page}: ${err.message} — stopping pagination`);
    break;
  }
  const rows = parseListPage(html);
  const fresh = rows.filter((r) => !byId.has(r.id));
  for (const r of fresh) byId.set(r.id, r);
  console.log(`page ${page}: ${rows.length} cards, ${fresh.length} new (total ${byId.size})`);
  if (!fresh.length) break;
  await sleep(250);
}

if (!byId.size) throw new Error("no habitats parsed — upstream markup likely changed");

// 2. 逐一抓詳情頁補上出沒寶可夢。
const habitats = [];
let failed = 0;
for (const habitat of byId.values()) {
  await sleep(250);
  try {
    const pokemon = parseHabitatPokemon(await fetchText(`${BASE}/habitats/${habitat.id}/`));
    habitats.push({ ...habitat, pokemon });
    if (!pokemon.length) console.log(`  ${habitat.id}: no pokemon parsed`);
  } catch (err) {
    // 單一棲息地抓失敗就跳過，不要讓整批沒有產出
    failed++;
    console.log(`  ${habitat.id}: ${err.message} — skipped`);
  }
}

habitats.sort((a, b) => a.no - b.no || a.id.localeCompare(b.id));
await writeFile(OUT, JSON.stringify(habitats, null, 2));

const withPokemon = habitats.filter((h) => h.pokemon.length).length;
const species = new Set(habitats.flatMap((h) => h.pokemon.map((p) => p.id))).size;
console.log(
  `wrote habitats.json: ${habitats.length} habitats (${withPokemon} with pokemon, ${failed} failed), ${species} distinct species`,
);
