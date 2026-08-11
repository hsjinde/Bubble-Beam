// One-shot: scrape the Pokopia habitat list and write a local index so the app
// can answer "I want Pokémon X — which habitat attracts it?" without hitting the
// upstream site at runtime.
//
// 兩個上游 ＋ 一份手動資料，各補各的：
//   pokopia.pokemonhubs.com  棲息地 → 出沒寶可夢（本篇 209 ＋ DLC 36），含圖鑑編號與分類
//   pokopiaguide.com/zh      棲息地 → 建造材料（本篇 208 ＋ DLC 24），hubs 完全沒有這塊
//   habitat-materials.json   DLC 36 筆的建造材料，覆寫上一行（guide 的 DLC 那批不全）
// 前兩邊是不同的粉絲翻譯（hubs「岩影的草地」＝ guide「岩蔭草叢」），名稱對不起來，
// 所以繁中名一律採 hubs 那份（既有資料，不改動），guide 只借材料欄位過來。
//
// Images are hotlinked like the buildings are, so only the path fragment is
// stored — 但 DLC 那批不在 pokopiadex 上（HAB-210.png 在那邊是 404），改由 hubs
// 自己的 /assets/ 提供，所以要靠 `dlc` 旗標分流基底網址（見 habitats.ts）。
// Pokémon sprites are derivable from the slug (`sprites/{slug}.png`), so they
// aren't stored at all.
//
// Usage:
//   node scripts/fetch-habitats.mjs
import { readFile, writeFile } from "node:fs/promises";

const BASE = "https://pokopia.pokemonhubs.com";
const GUIDE = "https://pokopiaguide.com/zh/habitat";
const UA = { "user-agent": "Mozilla/5.0 (piplup-website habitat fetcher)" };
const OUT = new URL("../src/data/pokopia/habitats.json", import.meta.url);
const OVERLAY = new URL("../src/data/pokopia/habitat-materials.json", import.meta.url);
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

/**
 * 從列表頁抓出這一頁的棲息地（slug／編號／繁中名／圖片路徑／是否 DLC）。
 *
 * 上游把卡片包在 `<section data-section="main|dlc">` 底下，DLC 那批**從 No.001
 * 重新編號**，所以 `no` 在全表不唯一——分區旗標是後面排序與去重的依據，不能只看編號。
 */
function parseListPage(html) {
  const out = [];
  for (const chunk of html.split(/<section class="list-section" data-section="/).slice(1)) {
    const dlc = chunk.startsWith("dlc");
    for (const m of chunk.matchAll(/<a class="habitat-card"[\s\S]*?<\/a>/g)) {
      const block = m[0];
      const slug = block.match(/href="\/habitats\/([^"/]+)\//)?.[1];
      if (!slug) continue;
      const no = Number(block.match(/class="habitat-num"[^>]*>\s*No\.(\d+)/)?.[1] ?? 0);
      const name = textOf(block.match(/class="habitat-name"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
      // 完整網址只取 /images/habitats/ 之後的片段，基底放在前端（比照建築的做法）
      const image = block.match(/\/images\/habitats\/([^"?]+)/)?.[1] ?? "";
      out.push({ id: slug, no, name, image, ...(dlc ? { dlc: true } : {}) });
    }
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

/**
 * pokopiaguide 的棲息地總表：一頁就有全部 232 筆，每張卡片帶建造材料與出沒寶可夢。
 *
 * 這站是 Next.js SSR，卡片以 `#<!-- -->001` 這種被註解切開的編號起頭（React 為了
 * hydration 插進去的分隔符），拿它當切段錨點比配對 `<article>` 穩。
 * 寶可夢只有頭像連結、沒有文字節點，slug 從 `/zh/pokedex/{slug}` 取——**英文 slug 是
 * 兩站唯一共通的鍵**，DLC 的比對全靠它。
 */
function parseGuideList(html) {
  const rows = [];
  const segs = html.split(/>#<!-- -->(\d{3})</).slice(1);
  for (let i = 0; i < segs.length; i += 2) {
    const no = Number(segs[i]);
    const seg = segs[i + 1];
    const name = seg.match(/alt="([^"]+)" loading="lazy" width="160"/)?.[1] ?? "";
    // 逐個 </a> 切開再解析，避免跨錨點吃到下一筆的數量（有材料卡片沒有 × N）
    const materials = [];
    for (const anchor of seg.split("</a>")) {
      const mat = anchor.match(/href="\/zh\/habitat\/materials\/[a-z0-9-]+"><img alt="([^"]+)"/);
      if (!mat) continue;
      const qty = Number(anchor.match(/>× (\d+)</)?.[1] ?? 0);
      if (qty) materials.push({ name: decodeEntities(mat[1]), qty });
    }
    const pokemon = [...seg.matchAll(/href="\/zh\/pokedex\/([a-z0-9-]+)"/g)].map((m) => m[1]);
    rows.push({ no, name, materials, pokemon });
  }
  return rows;
}

/**
 * 兩站的形態粒度不一致：hubs 記 `shellos-west-sea`／`toxtricity-amped-form`，
 * guide 只記 `shellos`／`toxtricity`；反過來也有（`paldean-wooper` vs `wooper`）。
 * 這些都是同一隻，比對時視為相同，否則整筆會被判成零重疊而白白丟掉材料。
 */
const sameSpecies = (a, b) =>
  a === b ||
  a.startsWith(`${b}-`) ||
  b.startsWith(`${a}-`) ||
  a.endsWith(`-${b}`) ||
  b.endsWith(`-${a}`);

/** 兩組寶可夢 slug 的 Jaccard 相似度（形態放寬），跨站配對用。 */
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  const used = new Set();
  let inter = 0;
  for (const x of a) {
    const hit = b.findIndex((y, i) => !used.has(i) && sameSpecies(x, y));
    if (hit >= 0) {
      used.add(hit);
      inter++;
    }
  }
  return inter / (a.length + b.length - inter);
}

/** 兩站標點習慣不同（「被丟棄的寶物」vs「被丟棄的寶物？」），比名字前先抹掉。 */
const normName = (s) => s.replace(/[的？?]/g, "");

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

// 3. 併入 pokopiaguide 的建造材料。
//
//    本篇照編號對：兩站的 No.001–209 是同一套遊戲內編號（hubs 的 slug 尾碼就是它），
//    實測 208 筆裡有 197 筆出沒寶可夢完全一致，剩下的差異只在形態 slug 的粒度。
//    DLC 對不了編號（hubs 從 1 重編、guide 接在 210 之後且順序不同），改用寶可夢
//    slug 集合的 Jaccard 相似度貪婪配對——英文 slug 是兩站唯一共通的鍵。
let guide = [];
try {
  guide = parseGuideList(await fetchText(GUIDE));
  console.log(
    `guide: ${guide.length} rows, ${guide.filter((r) => r.materials.length).length} with materials`,
  );
} catch (err) {
  console.log(`guide: ${err.message} — 略過材料合併，其餘照常產出`);
}

const DLC_MIN_SIMILARITY = 0.3; // 低於這個就當沒對到，寧缺勿錯
let merged = 0;
const unmatched = [];

if (guide.length) {
  const pool = new Set(guide.filter((r) => r.materials.length));

  for (const h of habitats.filter((x) => !x.dlc)) {
    const row = [...pool].find((r) => r.no === h.no);
    if (!row) continue;
    // 編號對上但寶可夢完全不重疊 ⇒ 上游改編號了，寧可不併也不要掛錯材料
    const sim = similarity(
      row.pokemon,
      h.pokemon.map((p) => p.id),
    );
    if (sim === 0 && row.pokemon.length && h.pokemon.length) {
      unmatched.push(`No.${h.no} ${h.name} ↔ guide #${row.no} ${row.name}（寶可夢零重疊，未併）`);
      continue;
    }
    h.materials = row.materials;
    pool.delete(row);
    merged++;
  }

  // DLC 沒有共通編號可對，改用「全域最佳優先」配對：先算完所有可能配對的分數，
  // 由高到低依序認領。逐個棲息地各自貪婪會出事——前面那筆會把後面更該配的
  // guide 列先搶走（實測「搖曳的花圃與珊瑚」會搶走「搖曳的花圃」該拿的那筆）。
  const dlcHabitats = habitats.filter((x) => x.dlc);
  const candidates = [];
  for (const h of dlcHabitats) {
    const ids = h.pokemon.map((p) => p.id);
    for (const row of pool) {
      const score = Math.max(
        similarity(row.pokemon, ids),
        // 兩站翻譯多半不同，一旦真的同名就是強證據，直接壓過寶可夢清單的落差
        normName(row.name) === normName(h.name) ? 0.9 : 0,
      );
      if (score >= DLC_MIN_SIMILARITY) candidates.push({ h, row, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const claimed = new Set();
  for (const c of candidates) {
    if (claimed.has(c.h) || !pool.has(c.row)) continue;
    claimed.add(c.h);
    pool.delete(c.row);
    c.h.materials = c.row.materials;
    merged++;
  }
  for (const h of dlcHabitats) {
    // guide 收錄不全是常態，DLC 的材料本來就以 habitat-materials.json 為準；
    // 真的沒有材料會在第 4 步結束後另外報出來
    if (!claimed.has(h)) unmatched.push(`DLC No.${h.no} ${h.name}（guide 查無對應）`);
  }

  for (const row of pool) {
    unmatched.push(`guide #${row.no} ${row.name}（hubs 查無對應，未使用）`);
  }
}

// 4. 蓋上手動維護的 DLC 材料（src/data/pokopia/habitat-materials.json）。
//
//    pokopiaguide 只收錄 36 筆 DLC 裡的 20 筆，而且實測有數筆漏列材料（獨木舟碼頭少了
//    Floating logs、被丟棄的寶物少了 Big treasure chest），所以 DLC 這段是**覆寫**而非補洞；
//    本篇仍然完全以 guide 為準。資料來源與翻譯規則寫在那個檔的 _comment 裡。
let overlaid = 0;
try {
  const overlay = JSON.parse(await readFile(OVERLAY, "utf8"));
  const byHabitatId = new Map(habitats.map((h) => [h.id, h]));
  for (const [id, materials] of Object.entries(overlay)) {
    if (id.startsWith("_")) continue; // _comment
    const h = byHabitatId.get(id);
    if (!h) {
      // 上游改了 slug 就會走到這裡——靜靜跳過的話材料會無聲消失
      unmatched.push(`overlay ${id}（habitats 查無此 slug，材料沒有套用）`);
      continue;
    }
    h.materials = materials;
    overlaid++;
  }
} catch (err) {
  console.log(`overlay: ${err.message} — 略過手動材料，DLC 只會有 guide 那份`);
}

const dlcWithout = habitats.filter((h) => h.dlc && !h.materials?.length);
if (dlcWithout.length) {
  unmatched.push(...dlcWithout.map((h) => `DLC ${h.id} ${h.name}（最後仍然沒有材料）`));
}

// 本篇照編號排，DLC 自成一段接在後面（兩邊的 No. 各自從 1 起算）
habitats.sort(
  (a, b) =>
    Number(a.dlc ?? false) - Number(b.dlc ?? false) || a.no - b.no || a.id.localeCompare(b.id),
);
await writeFile(OUT, JSON.stringify(habitats, null, 2));

const withPokemon = habitats.filter((h) => h.pokemon.length).length;
const withMaterials = habitats.filter((h) => h.materials?.length).length;
const species = new Set(habitats.flatMap((h) => h.pokemon.map((p) => p.id))).size;
console.log(
  // guide 命中數含被 overlay 蓋掉的那批 DLC，所以 guide + overlay 會大於 withMaterials
  `wrote habitats.json: ${habitats.length} habitats (${habitats.filter((h) => h.dlc).length} DLC, ${withPokemon} with pokemon, ${failed} failed), ${species} distinct species, ${withMaterials} with materials（guide 命中 ${merged}、overlay 覆寫 ${overlaid}，重疊部分以 overlay 為準）`,
);
if (unmatched.length) console.log(`未配對 ${unmatched.length} 筆：\n  ${unmatched.join("\n  ")}`);
