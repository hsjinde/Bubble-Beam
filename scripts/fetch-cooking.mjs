// One-shot: 抓 Pokopia 的料理資料，寫成本地索引，讓 /pokopia/cooking 不必在執行期打上游。
//
// 兩個上游各補各的（比照 fetch-habitats.mjs 的雙上游作法）：
//   pokopiaguide.com/zh/cooking   全 34 道（含 DLC）的結構化資料：口味、素材、器具、
//                                 所需特長、強化招式、供奉效果、售價。這站是 Next.js，
//                                 整份資料就在 RSC flight payload 裡，不必刮 DOM。
//   pokopia.pokemonhubs.com       本篇 24 道的**官方繁中名**。guide 的譯名是自譯，
//                                 莓果整組對錯（ヒメリのみ/Leppa 被譯成「蘋野果」，
//                                 官方是「慕柑果」），所以名字一律以 hubs 為準。
//   cooking-overrides.json        手寫：兩站 slug 的對接表、食材譯名修正、食材口味表。
//
// hubs 沒收錄 DLC 那 10 道，那批退回 guide 名並標 nameSource="guide"，UI 上顯示「暫譯」。
//
// 料理等級（本站定義，寫進 level 欄位）：供奉效果的三段強度。
//   Lv1 = 生食材直接供奉（「稍微」），Lv2 = 效果句寫「較容易」，Lv3 = 效果句寫「更容易」。
// 這條規則有兩個獨立佐證：本篇 Lv3 恰好就是 guide 標售價 500 的那 8 道（每種器具各 2 道，
// 對應器具的第三階配方），而 gamewith 的「かなり効果が上昇する料理」清單也正好是同一批
// （含 DLC 共 11 道）。所以強度不是本站臆測，是兩份上游各自算出來一樣。
//
// Usage:
//   node scripts/fetch-cooking.mjs
import { readFile, writeFile } from "node:fs/promises";

const GUIDE = "https://pokopiaguide.com/zh/cooking";
const HUBS = "https://pokopia.pokemonhubs.com/cooking/";
const HUBS_ITEMS = "https://pokopia.pokemonhubs.com/items/";
/** hubs 沒收錄的食材（DLC 兩種）退回 guide 的圖。 */
const GUIDE_INGREDIENT_IMAGE = "https://pokopiaguide.com/images/cooking/ingredients/";
const UA = { "user-agent": "Mozilla/5.0 (piplup-website cooking fetcher)" };
const OUT = new URL("../src/data/pokopia/cooking.json", import.meta.url);
const OVERRIDES = new URL("../src/data/pokopia/cooking-overrides.json", import.meta.url);

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/**
 * 從 Next.js 的 RSC flight payload 取出 recipes 陣列。
 *
 * payload 是一串 `self.__next_f.push([1,"…"])`，把字串接起來後裡面**又**是一層
 * JSON 字串（所以引號是 `\"`），反跳脫一次才解得開。直接刮 DOM 也行，但那邊的
 * 口味／效果是散在 class 裡的膠囊，payload 這份是同一批資料的原始欄位。
 */
function parseGuideRecipes(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map((m) =>
    JSON.parse(m[1]),
  );
  const flight = chunks.join("").replace(/\\"/g, '"').replace(/\\\\/g, "\\");

  const key = '"recipes":[';
  const at = flight.indexOf(key);
  if (at === -1) throw new Error("guide: recipes payload not found — upstream likely changed");

  // 從 '[' 起做括號配對，取出完整陣列
  let depth = 0;
  const start = at + key.length - 1;
  for (let p = start; p < flight.length; p++) {
    if (flight[p] === "[") depth++;
    else if (flight[p] === "]" && --depth === 0) return JSON.parse(flight.slice(start, p + 1));
  }
  throw new Error("guide: unterminated recipes array");
}

/** hubs 的料理總表：slug → 官方繁中名（順便帶回具名素材，用來對帳）。 */
function parseHubsNames(html) {
  const out = new Map();
  for (const m of html.matchAll(
    /<a class="item-card cooking-card-row" href="\/items\/([^"/]+)\/">([\s\S]*?)<\/a>/g,
  )) {
    const name = m[2].match(/item-name">([^<]+)/)?.[1]?.trim();
    if (!name) continue;
    const ingredients = [...m[2].matchAll(/recipe-ing-thumb" src="[^"]+" alt="([^"]*)"/g)].map(
      (x) => x[1],
    );
    out.set(m[1], { name, ingredients });
  }
  return out;
}

/**
 * hubs 道具總表的「食物」區：slug → { name, image }。
 *
 * 食材圖走這裡而不是 guide，是因為手寫食材表有 4 種不入菜、只能生供奉的食物
 * （糖果、咖哩飯…），guide 的料理頁沒有它們的圖。圖片網址存完整字串而不是片段，
 * 因為 DLC 兩種要退回 guide 的基底，兩個來源混在同一欄。
 */
function parseHubsIngredients(html) {
  const from = html.indexOf('id="food"');
  const to = html.indexOf('id="materials"');
  if (from === -1 || to === -1) throw new Error("hubs: food section not found");
  const out = new Map();
  for (const m of html.slice(from, to).matchAll(/href="\/items\/([^"/]+)\/"([\s\S]*?)<\/a>/g)) {
    const name = m[2].match(/item-name">([^<]+)/)?.[1]?.trim();
    const image = m[2].match(/class="item-img" src="([^"]+)"/)?.[1];
    if (name) out.set(m[1], { name, image });
  }
  return out;
}

const overrides = JSON.parse(await readFile(OVERRIDES, "utf8"));

const [guideHtml, hubsHtml, hubsItemsHtml] = await Promise.all([
  fetchText(GUIDE),
  fetchText(HUBS),
  fetchText(HUBS_ITEMS),
]);
const hubsIngredients = parseHubsIngredients(hubsItemsHtml);
const guideRecipes = parseGuideRecipes(guideHtml);
const hubsNames = parseHubsNames(hubsHtml);
console.log(`guide: ${guideRecipes.length} recipes / hubs: ${hubsNames.size} names`);

if (guideRecipes.length < 34) console.log("⚠ guide 少於 34 道，上游可能改版或分頁了");
if (hubsNames.size < 24) console.log("⚠ hubs 少於 24 道，上游可能改版了");

/**
 * guide 的素材譯名 → hubs 官方譯名（只列兩邊不一致的，其餘原樣通過）。
 *
 * 做子字串替換而不是整字查表，因為同一份對照也要修 DLC 的料理名
 * （「蘋野果冰沙」→「慕柑果冰沙」）。長的 key 先替換，免得短 key 先吃掉一半。
 */
const NAME_FIXES = Object.entries(overrides.ingredientNames).sort(
  (a, b) => b[0].length - a[0].length,
);
const fixName = (s) => NAME_FIXES.reduce((acc, [from, to]) => acc.split(from).join(to), s);

/** 供奉效果強度 → 料理等級。上游用「較容易 / 更容易」區分兩段，生食材是第一段。 */
function levelOf(effect) {
  return effect.includes("更") ? 3 : 2;
}

const unmapped = [];
const recipes = guideRecipes.map((r) => {
  const hubsSlug = overrides.recipeSlugs[r.id];
  const hubs = hubsSlug ? hubsNames.get(hubsSlug) : undefined;
  if (!r.isDlc && !hubs) unmapped.push(r.id);

  const ingredients = [
    { name: fixName(r.baseIngredient), wildcard: false },
    ...(r.specialIngredients ?? []).map((x) => ({
      name: fixName(x.name),
      wildcard: Boolean(x.isWildcard),
    })),
  ];

  return {
    id: r.id,
    name: hubs?.name ?? fixName(r.name),
    nameSource: hubs ? "hubs" : "guide",
    category: r.category,
    tool: r.tool,
    toolId: r.toolId,
    flavor: r.flavor ?? "plain",
    move: overrides.moves[r.powersUpId] ?? r.powersUp,
    // 少數料理的招式強化幅度更大，上游用一個布林標它
    strongMove: Boolean(r.enhanced),
    specialty: r.requiredSpecialty ? (overrides.specialties[r.requiredSpecialty] ?? null) : null,
    ingredients,
    price: r.price ?? null,
    ...(r.isDlc ? { dlc: true } : {}),
    effect: r.offeringEffect,
    level: levelOf(r.offeringEffect),
  };
});

if (unmapped.length)
  console.log(`⚠ 本篇料理對不到 hubs 名（用 guide 名頂替）：${unmapped.join(", ")}`);

// 對帳：guide 的售價 500 應該剛好等於本站判定的 Lv3（本篇部分）。不一致就是上游改了資料，
// 要回頭確認 levelOf 的規則還成不成立，而不是默默出一份自相矛盾的檔。
const priced = recipes.filter((r) => !r.dlc);
const mismatch = priced.filter((r) => (r.price === 500) !== (r.level === 3));
if (mismatch.length) {
  console.log(
    `⚠ 售價與等級判定不一致：${mismatch.map((r) => `${r.id}(${r.price}/${r.level})`).join(", ")}`,
  );
} else {
  console.log(`✓ 本篇 ${priced.filter((r) => r.level === 3).length} 道 Lv3 與售價 500 完全一致`);
}

// 手寫食材表補上圖片，順便拿 hubs 的名字對帳——名字不一致代表上游改譯名了，
// 該回頭同步 overrides，而不是讓站上顯示一個上游已經不用的名字。
const renamed = [];
const ingredientsOut = overrides.ingredients.map((ing) => {
  const hubs = hubsIngredients.get(ing.id);
  if (hubs && hubs.name !== ing.name)
    renamed.push(`${ing.id}: 本站「${ing.name}」/ hubs「${hubs.name}」`);
  return {
    ...ing,
    image: hubs?.image ?? `${GUIDE_INGREDIENT_IMAGE}${ing.id}.webp`,
  };
});
const noImage = ingredientsOut.filter((i) => !i.image);
if (renamed.length) console.log(`⚠ 食材譯名與 hubs 不一致：\n  ${renamed.join("\n  ")}`);
if (noImage.length) console.log(`⚠ 沒有圖的食材：${noImage.map((i) => i.id).join(", ")}`);

const payload = {
  updatedAt: new Date().toISOString().slice(0, 10),
  recipes,
  ingredients: ingredientsOut,
};
await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `wrote ${recipes.length} recipes (${recipes.filter((r) => r.dlc).length} DLC) + ` +
    `${overrides.ingredients.length} ingredients → src/data/pokopia/cooking.json`,
);
