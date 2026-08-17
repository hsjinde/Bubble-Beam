/**
 * 產生排行榜牌組的「匯入用 2 次元代碼」：public/deck-qr/*.png 與 src/data/deck-qr.json。
 *
 *   node --experimental-strip-types scripts/generate-deck-qr.mjs
 *   node --experimental-strip-types scripts/generate-deck-qr.mjs --check   # 只檢查是否過期
 *
 * 已掛在 package.json 的 prebuild。它是純本地計算（不打網路），跟 subset-cards.mjs 同一類，
 * 掛進去的理由也一樣：正式建置產物一定要跟當下的 meta.json 一致。
 * 少了這層，失敗模式是「有人重跑 tcg-pocket-tier-list 更新了排行榜、忘了重產 QR 就部署」，
 * 於是玩家掃到的是**上一份快照**的牌表——畫面上完全看不出異狀，掃進遊戲才發現是另一副牌。
 *
 * 能量的解析順序（見 src/data/deck-energy.json 的說明）：
 *   1. limitless-map.json → curatedId → decks.ts 的 energy（有攻略的牌組現成就有）
 *   2. 對不到才查 deck-energy.json（手寫，補沒有攻略的那幾副）
 *   3. 都沒有就不出 QR，並在結尾印出清單——寧可少一張圖，也不要給玩家一個能量錯的牌組。
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Windows 的絕對路徑（D:\...）不是合法的 ESM 指定符，一定要轉成 file:// URL
const load = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const readJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));

const { createDeckCode, isCodableEnergy, MAX_ENERGY_TYPES } = await load("src/lib/deck-code.ts");
const { getDeck } = await load("src/data/decks.ts");
const meta = readJson("src/data/meta.json");
const cards = readJson("src/data/cards.json");
const limitlessMap = readJson("src/data/limitless-map.json");
const deckEnergy = readJson("src/data/deck-energy.json");

const IMAGE_DIR = path.join(root, "public", "deck-qr");
const INDEX_OUT = path.join(root, "src", "data", "deck-qr.json");
const checkOnly = process.argv.includes("--check");

/** Limitless 英文牌組名 → 策展 id，跟 meta.ts 的補值邏輯讀的是同一份對照。 */
const curatedIdByName = new Map(
  Object.entries(limitlessMap).flatMap(([id, entry]) =>
    typeof entry === "object" ? [[entry.limitlessName, id]] : [],
  ),
);

/** 檔名用的 slug。牌組名是 Limitless 的英文原名，轉出來一定是 ASCII。 */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveEnergy(deck) {
  const curatedId = deck.curatedId ?? curatedIdByName.get(deck.name);
  const curated = curatedId ? getDeck(curatedId) : undefined;
  const energy = curated?.energy ?? deckEnergy[deck.name];
  if (!Array.isArray(energy) || energy.length === 0) return null;
  // Dragon／Colorless 沒有代碼 id，出現就代表這筆資料還沒被人工判定過，不能硬塞
  if (!energy.every(isCodableEnergy) || energy.length > MAX_ENERGY_TYPES) return null;
  return energy;
}

const index = {};
const noEnergy = [];
const noCardNr = [];
const slugs = new Map();

for (const deck of meta.decks) {
  if (!deck.cards?.length) continue;

  const energy = resolveEnergy(deck);
  if (!energy) {
    noEnergy.push(deck.name);
    continue;
  }

  const nrs = [];
  let missing = null;
  for (const { id, count } of deck.cards) {
    const nr = cards[id]?.deckBuilderNr;
    if (typeof nr !== "number") {
      missing = id;
      break;
    }
    for (let i = 0; i < count; i++) nrs.push(nr);
  }
  if (missing) {
    noCardNr.push(`${deck.name}（${missing}）`);
    continue;
  }

  const slug = toSlug(deck.name);
  const clash = slugs.get(slug);
  if (clash) throw new Error(`slug 撞名：「${clash}」與「${deck.name}」都是 ${slug}`);
  slugs.set(slug, deck.name);

  index[deck.name] = {
    code: createDeckCode(nrs, energy),
    file: `${slug}.png`,
    energy,
  };
}

const serialized = `${JSON.stringify(index, null, 2)}\n`;

if (checkOnly) {
  const stale =
    !existsSync(INDEX_OUT) ||
    readFileSync(INDEX_OUT, "utf8") !== serialized ||
    Object.values(index).some(({ file }) => !existsSync(path.join(IMAGE_DIR, file)));
  if (stale) {
    console.error("deck-qr.json／public/deck-qr 已過期，請跑 node scripts/generate-deck-qr.mjs");
    process.exit(1);
  }
  console.log(`deck-qr 是最新的（${Object.keys(index).length} 副牌組）`);
} else {
  // 先清空再寫：牌組名每週隨環境變動，不清就會留下一堆再也沒人引用的孤兒圖檔
  rmSync(IMAGE_DIR, { recursive: true, force: true });
  mkdirSync(IMAGE_DIR, { recursive: true });
  for (const [name, { code, file }] of Object.entries(index)) {
    await QRCode.toFile(path.join(IMAGE_DIR, file), code, { width: 512, margin: 2 });
    console.log(`${file}  ${name}`);
  }
  writeFileSync(INDEX_OUT, serialized);
  console.log(`\n產生 ${Object.keys(index).length} 張 QR（共 ${meta.decks.length} 副牌組）`);
}

// 缺能量是常態：排行榜每週換血，新上榜又沒攻略的牌組就會落在這裡，補進 deck-energy.json 即可。
if (noEnergy.length) {
  console.log(
    `\n${noEnergy.length} 副牌組還沒有能量設定（不會出 QR），請補進 src/data/deck-energy.json：`,
  );
  for (const name of noEnergy) console.log(`  ${name}`);
}
// 這個清單正常應該永遠是空的。有東西代表上游卡片資料的 image 檔名推不出 deckBuilderNr，
// 回頭看 scripts/fetch-cards.mjs 的 deckBuilderNrFromImage。
if (noCardNr.length) {
  console.log(`\n${noCardNr.length} 副牌組有卡片查不到 deckBuilderNr（不會出 QR）：`);
  for (const line of noCardNr) console.log(`  ${line}`);
}
