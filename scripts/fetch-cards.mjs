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

const listing = await fetch(IMAGE_SETS_API);
if (!listing.ok) throw new Error(`list image sets failed: ${listing.status}`);
const setsWithImages = new Set(
  (await listing.json()).filter((e) => e.type === "dir").map((e) => e.name),
);

const index = {};
for (const set of SETS) {
  const res = await fetch(`${DATA_BASE}/${set}.json`);
  if (!res.ok) throw new Error(`fetch ${set} failed: ${res.status}`);
  const cards = await res.json();
  const hasImages = setsWithImages.has(set);
  for (const card of cards) {
    const id = `${card.set}-${card.number}`;
    index[id] = {
      id,
      nameEN: card.name,
      imageUrl:
        hasImages || !card.image
          ? `${IMAGE_BASE}/${card.set}/${card.number}.webp`
          : `${FALLBACK_IMAGE_BASE}/${card.image}`,
    };
  }
  console.log(`${set}: ${cards.length} cards${hasImages ? "" : " (fallback images)"}`);
}
await writeFile(OUT, JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(index).length} cards`);
