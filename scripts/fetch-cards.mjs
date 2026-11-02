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
  "B4a",
  "C1",
  "PROMO-A",
  "PROMO-B",
];
const DATA_BASE =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards";
// 全尺寸卡圖：exchange 在 2026-10-05 把 public/images/cards-by-set 改成指向外部資料庫的
// symlink，原本的 raw.githubusercontent 路徑整批 404；現在改走它正式站的 CDN（路徑結構不變）。
const IMAGE_BASE = "https://cdn.pokemon-tcg.exchange/images/cards-by-set";
// 卡名資料（上面的 database）出得比卡圖庫（exchange）快，新擴充包常常有名字沒圖。
// 圖庫還沒收錄的 set 改指 pokemon-zone 的官方 asset，檔名就是 database 的 `image` 欄位。
// 那邊擋無 UA 的請求（curl 會 403），但瀏覽器載得到，尺寸與圖庫一致（367x512）。
const FALLBACK_IMAGE_BASE = "https://assets.pokemon-zone.com/game-assets/CardPreviews";
// 判斷「哪些 set 有圖」直接對全尺寸圖探測一張：曾經改列 thumbnails 目錄，但 C1 證明縮圖會比
// 全尺寸圖先上（2026-11-02 縮圖 200、全尺寸 404），列目錄會把整包 set 指到破圖。
// 新擴充包剛發售時，上面的 database 可能連 set 檔都還沒有（C1 發售時它停在 10-12 沒更新），
// 但排行榜當天就會出現新卡。列在這裡的 set 遇到 database 404 時改抓 Limitless 的卡表
// （列表檢視一頁就有卡號＋卡名，卡圖在它的 CDN，同樣是 367x512）。代價是拿不到素材檔名，
// deckBuilderNr 只能存 null，含這些卡的牌組不出 QR。等 database 補上該 set，下次重跑就
// 自動走回正常路徑——這時把 set 從這裡拿掉即可，不拿也不會出錯。
// 不在這裡的 set 遇到 404 照舊 throw，打錯 set 代號才不會被靜靜吞掉。
const LIMITLESS_FALLBACK_SETS = new Set(["C1"]);
const LIMITLESS_CARDS = "https://pocket.limitlesstcg.com/cards";
const LIMITLESS_IMAGE_BASE = "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/pocket";
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

const decodeEntities = (s) =>
  s
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** 從 Limitless 卡表的列表檢視解析 `{ number, name }`，見 LIMITLESS_FALLBACK_SETS。 */
async function fetchLimitlessSet(set) {
  const res = await fetch(`${LIMITLESS_CARDS}/${set}?display=list`);
  if (!res.ok) throw new Error(`fetch Limitless ${set} failed: ${res.status}`);
  const html = await res.text();
  // 每列是 <td>卡號</td><td>卡名</td>，兩格都連到 /cards/{set}/{number}
  const row = new RegExp(
    `<a href="/cards/${set}/(\\d+)">\\1</a></td>\\s*<td><a href="/cards/${set}/\\1">([^<]+)</a>`,
    "g",
  );
  const cards = [...html.matchAll(row)].map((m) => ({
    set,
    number: Number(m[1]),
    name: decodeEntities(m[2].trim()),
  }));
  if (cards.length === 0) throw new Error(`Limitless ${set}: parsed 0 cards — markup changed?`);
  return cards;
}

const limitlessImageUrl = (set, number) =>
  `${LIMITLESS_IMAGE_BASE}/${set}/${set}_${String(number).padStart(3, "0")}_EN.webp`;

/** 圖庫有沒有這個 set 的全尺寸圖：探測 1 號卡，見 IMAGE_BASE 底下的註解。 */
async function hasFullImages(set) {
  const res = await fetch(`${IMAGE_BASE}/${set}/1.webp`, { method: "HEAD" });
  return res.ok;
}

const index = {};
const withoutNr = [];
for (const set of SETS) {
  const res = await fetch(`${DATA_BASE}/${set}.json`);
  if (res.status === 404 && LIMITLESS_FALLBACK_SETS.has(set)) {
    const cards = await fetchLimitlessSet(set);
    for (const card of cards) {
      const id = `${set}-${card.number}`;
      withoutNr.push(`${id} (Limitless fallback)`);
      index[id] = {
        id,
        nameEN: card.name,
        imageUrl: limitlessImageUrl(set, card.number),
        deckBuilderNr: null,
      };
    }
    console.log(`${set}: ${cards.length} cards (Limitless fallback, no deckBuilderNr)`);
    continue;
  }
  if (!res.ok) throw new Error(`fetch ${set} failed: ${res.status}`);
  const cards = await res.json();
  const hasImages = await hasFullImages(set);
  // 圖庫還沒有全尺寸圖時：Limitless 備援 set 用 Limitless 的卡圖（curl 驗得到），
  // 其餘照舊指 pokemon-zone。卡名與 deckBuilderNr 一樣取 database，只有圖換來源。
  const useLimitlessImages = !hasImages && LIMITLESS_FALLBACK_SETS.has(set);
  for (const card of cards) {
    const id = `${card.set}-${card.number}`;
    const deckBuilderNr = deckBuilderNrFromImage(card.image);
    if (deckBuilderNr === null) withoutNr.push(`${id} (${card.image ?? "no image field"})`);
    index[id] = {
      id,
      nameEN: card.name,
      imageUrl: useLimitlessImages
        ? limitlessImageUrl(card.set, card.number)
        : hasImages || !card.image
          ? `${IMAGE_BASE}/${card.set}/${card.number}.webp`
          : `${FALLBACK_IMAGE_BASE}/${card.image}`,
      deckBuilderNr,
    };
  }
  const imageNote = hasImages
    ? ""
    : useLimitlessImages
      ? " (Limitless images)"
      : " (fallback images)";
  console.log(`${set}: ${cards.length} cards${imageNote}`);
}
await writeFile(OUT, JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(index).length} cards`);

// 推不出 deckBuilderNr 的卡沒辦法放進匯入用 2 次元代碼。少數幾張通常無妨（本站不一定引用得到），
// 但這份清單要是突然暴增，就是上游改了檔名慣例——回去看 deckBuilderNrFromImage 的正則。
if (withoutNr.length) {
  console.log(`\n${withoutNr.length} cards without a deckBuilderNr:`);
  for (const line of withoutNr) console.log(`  ${line}`);
}
