// One-shot: fetch full card pools for the sets our curated decks use,
// and write a local id-keyed index so the app never hits the API at runtime.
//
// Data source: flibustier/pokemon-tcg-pocket-database (TCGdex lags behind —
// missing B3/B3a/B3b/PROMO-B as of 2026-07; see docs/superpowers/plans/deck-research.md).
// Card ids follow `${set}-${number}` with no zero padding (e.g. "B3b-41", "PROMO-A-7").
import { writeFile } from "node:fs/promises";

const SETS = [
  "A1",
  "A1a",
  "A2",
  "A2a",
  "A2b",
  "A3",
  "A3a",
  "A3b",
  "A4",
  "A4a",
  "A4b",
  "B1",
  "B1a",
  "B2",
  "B2a",
  "B2b",
  "B3",
  "B3a",
  "B3b",
  "B4",
  "PROMO-A",
  "PROMO-B",
];
const DATA_BASE =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/main/public/images/cards-by-set";
// 卡名資料（上面的 database）出得比卡圖庫（exchange）快，新擴充包常常有名字沒圖。
// 圖庫還沒收錄的 set 改指 pokemon-zone 的官方 asset，檔名就是 database 的 `image` 欄位。
// 那邊擋無 UA 的請求（curl 會 403），但瀏覽器載得到，尺寸與圖庫一致（367x512）。
const FALLBACK_IMAGE_BASE = "https://assets.pokemon-zone.com/game-assets/CardPreviews";
const IMAGE_SETS_API =
  "https://api.github.com/repos/flibustier/pokemon-tcg-exchange/contents/public/images/cards-by-set";
const OUT = new URL("../src/data/cards.json", import.meta.url);

/**
 * 從上游的素材檔名推出這張卡在遊戲牌組編輯器裡的內部編號（`deckBuilderNr`）。
 *
 *   cPK_10_000010_00_FUSHIGIDANE_C.webp → 1        （寶可夢 #1）
 *   cTR_10_000080_00_KAINOKASEKI_C.webp → 1000008  （訓練家 #8）
 *
 * 匯入用 2 次元代碼裡存的就是這個編號（見 src/lib/deck-code.ts），而遊戲把寶可夢與訓練家
 * 放在兩套各自從 1 開始的命名空間，所以訓練家一律加 TRAINER_OFFSET 區分。
 *
 * 這是一條**隱性相依**：編號並非上游自己的欄位，而是從檔名裡的 6 碼素材 id 反推的。
 * 上游哪天改了檔名慣例（或某個 set 的檔名格式不同），這裡就會整批推不出來——所以推不出來的
 * 存 null 而不是靜靜跳過，腳本結尾也會把清單印出來。
 * 格式出處：Nirostar/ptcgp-deck-qr（MIT）。
 */
const TRAINER_OFFSET = 1_000_000;
function deckBuilderNrFromImage(image) {
  const m = /^c([A-Z]+)_\d+_(\d{6})_/.exec(String(image ?? ""));
  if (!m) return null;
  const raw = Number.parseInt(m[2], 10);
  // 6 碼素材 id 是「編號 × 10」，除不盡代表這不是我們認得的那種檔名
  if (!Number.isInteger(raw) || raw % 10 !== 0) return null;
  const nr = raw / 10;
  return m[1] === "TR" ? TRAINER_OFFSET + nr : nr;
}

const listing = await fetch(IMAGE_SETS_API);
if (!listing.ok) throw new Error(`list image sets failed: ${listing.status}`);
const setsWithImages = new Set(
  (await listing.json()).filter((e) => e.type === "dir").map((e) => e.name),
);

const index = {};
const withoutNr = [];
for (const set of SETS) {
  const res = await fetch(`${DATA_BASE}/${set}.json`);
  if (!res.ok) throw new Error(`fetch ${set} failed: ${res.status}`);
  const cards = await res.json();
  const hasImages = setsWithImages.has(set);
  for (const card of cards) {
    const id = `${card.set}-${card.number}`;
    const deckBuilderNr = deckBuilderNrFromImage(card.image);
    if (deckBuilderNr === null) withoutNr.push(`${id} (${card.image ?? "no image field"})`);
    index[id] = {
      id,
      nameEN: card.name,
      imageUrl:
        hasImages || !card.image
          ? `${IMAGE_BASE}/${card.set}/${card.number}.webp`
          : `${FALLBACK_IMAGE_BASE}/${card.image}`,
      deckBuilderNr,
    };
  }
  console.log(`${set}: ${cards.length} cards${hasImages ? "" : " (fallback images)"}`);
}
await writeFile(OUT, JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(index).length} cards`);

// 推不出 deckBuilderNr 的卡沒辦法放進匯入用 2 次元代碼。少數幾張通常無妨（本站不一定引用得到），
// 但這份清單要是突然暴增，就是上游改了檔名慣例——回去看 deckBuilderNrFromImage 的正則。
if (withoutNr.length) {
  console.log(`\n${withoutNr.length} cards without a deckBuilderNr:`);
  for (const line of withoutNr) console.log(`  ${line}`);
}
