import cookingData from "./cooking.json";
import type { Flavor, Ingredient, Recipe, RecipeCategory } from "./types";

export type { Flavor, Ingredient, Recipe, RecipeCategory };

/**
 * 料理資料與口味／等級的對照表。
 *
 * **這個模組刻意獨立於 `pokopia.ts`**（同 habitats.ts 的理由）：只有 /pokopia/cooking
 * 需要它，放進 pokopia.ts 會讓 /pokopia 主頁也一起載入同一個 chunk。
 *
 * 資料本身由 scripts/fetch-cooking.mjs 從兩個上游合出來（見該腳本抬頭），
 * 這裡只放「怎麼呈現」的常數與查詢。
 */

const data = cookingData as {
  updatedAt: string;
  recipes: Recipe[];
  ingredients: Ingredient[];
};

export const recipes = data.recipes;
export const ingredients = data.ingredients;
export const updatedAt = data.updatedAt;

/**
 * 口味 → 供奉效果。
 *
 * 苔卡比獸的當日 buff 只看供奉物的**口味**，六種口味各對應一種效果，
 * 所以玩家實際上是「今天想要什麼 → 挑那個口味 → 挑該口味最強的一道」。
 * `effect` 是效果本身，`goal` 是玩家會用的說法（拿來當篩選按鈕的說明）。
 */
/**
 * `dot` 只當**色點**用，不承載文字——比照 CATEGORY_META 的作法。這組是硬編的淺色，
 * 拿來當膠囊底色的話深色模式下會整片刺眼，所以文字一律走 pokopia token。
 */
export const FLAVORS: {
  id: Flavor;
  label: string;
  effect: string;
  goal: string;
  dot: string;
}[] = [
  {
    id: "spicy",
    label: "辣",
    effect: "棲息地更容易出現寶可夢",
    goal: "衝圖鑑、找新寶可夢",
    dot: "#e0684f",
  },
  {
    id: "sweet",
    label: "甜",
    effect: "古代之物更容易出現",
    goal: "挖化石、收集遠古之物",
    dot: "#e8a0c0",
  },
  {
    id: "bitter",
    label: "苦",
    effect: "更容易找到稀有物品",
    goal: "刷稀有素材與掉落物",
    dot: "#7a8f5c",
  },
  {
    id: "dry",
    label: "澀",
    effect: "更容易遇到鳳王／洛奇亞",
    goal: "抓傳說、收彩虹／銀色羽毛",
    dot: "#9c8bc4",
  },
  {
    id: "sour",
    label: "酸",
    effect: "商店更容易出現好物品",
    goal: "等商店上架好貨",
    dot: "#e5c04a",
  },
  {
    id: "plain",
    label: "普通",
    effect: "更容易和寶可夢變親密",
    goal: "跟寶可夢拉好感度",
    dot: "#c4b49a",
  },
];

const flavorMap = new Map(FLAVORS.map((f) => [f.id, f]));

export function getFlavor(id: Flavor) {
  // 上游若冒出新口味，寧可退回「普通」也不要讓整頁炸掉
  return flavorMap.get(id) ?? FLAVORS[FLAVORS.length - 1];
}

/** 料理分類（＝器具）的顯示順序與說明。 */
export const CATEGORIES: {
  id: RecipeCategory;
  label: string;
  tool: string;
  base: string;
  move: string;
  note: string;
}[] = [
  {
    id: "salad",
    label: "沙拉",
    tool: "砧板",
    base: "葉子",
    move: "樹葉",
    note: "砧板直接用，不必生火——最好上手的一類。",
  },
  {
    id: "soup",
    label: "湯品",
    tool: "鍋子",
    base: "新鮮水",
    move: "水槍",
    note: "鍋子要架在火堆或爐子上才能煮。",
  },
  {
    id: "bread",
    label: "麵包",
    tool: "麵包窯",
    base: "小麥",
    move: "居合斬",
    note: "得請會「燃燒」的寶可夢幫忙點火。",
  },
  {
    id: "hamburger-steak",
    label: "漢堡排",
    tool: "平底鍋",
    base: "豆子",
    move: "碎岩",
    note: "平底鍋同樣要放在火堆或爐子上。",
  },
  {
    id: "smoothie",
    label: "冰沙",
    tool: "攪拌機",
    base: "切西瓜",
    move: "衝浪",
    note: "DLC「冒泡泡海底的城鎮」解鎖的第五種器具。",
  },
];

/**
 * 供奉效果的三段強度。上游用效果句的「稍微／較容易／更容易」區分，
 * 本站換算成等級，讓「3 級料理」這個玩家常用的說法在頁面上找得到。
 * 第 1 級是生食材直接供奉，所以沒有對應的料理。
 */
export const LEVELS: { level: 1 | 2 | 3; label: string; desc: string }[] = [
  { level: 1, label: "1 級", desc: "生食材直接供奉，效果最弱" },
  { level: 2, label: "2 級", desc: "料理，效果「較容易」" },
  { level: 3, label: "3 級", desc: "料理，效果「更容易」——同口味的最強選擇" },
];

/** 3 級料理：每種口味都至少有一道，這是供奉的最佳解。 */
export const bestRecipes = recipes.filter((r) => r.level === 3);

/**
 * 每種口味的首選 3 級料理與一句推薦理由。
 *
 * **這段是本站策展，不是官方資料**（比照建築頁的「搭配靈感」）：效果強度同為 3 級時，
 * 上游不會告訴你哪道比較好做，判斷依據是實際的製作成本——要不要生火、要不要先做出
 * 另一道料理當素材、要不要專程去找帶特定特技的寶可夢、素材買不買得到。UI 上會標明。
 */
export const CURATED_PICKS: { flavor: Flavor; recipeId: string; why: string }[] = [
  {
    flavor: "spicy",
    recipeId: "crouton-salad",
    why: "同為辣味 3 級的三道裡最省事：砧板不必生火、不必找特技寶可夢，麵包拿最便宜的簡單麵包（小麥一格）就行。想衝圖鑑每天煮這道就對了。",
  },
  {
    flavor: "sweet",
    recipeId: "fluffy-bread",
    why: "甜味唯一的 3 級料理。要先請會「澆水」的寶可夢幫忙，麵包窯也得點火，但木桃果種了就能一直收，長期挖化石很划算。",
  },
  {
    flavor: "bitter",
    recipeId: "mature-hamburger",
    why: "苦味 3 級裡唯一不用 DLC 也不用特技的一道，兩種莓果都能自己種；平底鍋架在火堆上就能煎。",
  },
  {
    flavor: "dry",
    recipeId: "mashed-salad",
    why: "澀味唯一的 3 級料理，追鳳王／洛奇亞只有這條路。要帶會「搗碎」的寶可夢，但砧板不用生火，伊奈果種樹就有。",
  },
  {
    flavor: "sour",
    recipeId: "mixed-soup",
    why: "本篇酸味唯一的 3 級料理，缺點是兩段式——得先煎一份漢堡排當素材。有 DLC 的話清爽汽水冰沙更快，三樣素材買了就能打。",
  },
  {
    flavor: "plain",
    recipeId: "colorful-hamburger",
    why: "普通味的 3 級，附帶碎岩強化幅度更大這個額外好處。素材要先做一份沙拉，但簡單沙拉一片葉子就成。",
  },
];

export function recipesByFlavor(flavor: Flavor): Recipe[] {
  return recipes.filter((r) => r.flavor === flavor);
}

export function getRecipe(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}

/**
 * 料理圖：hotlink pokopiaguide 的資產（比照建築 hotlink pokopiadex 的作法）。
 * pokopiadex 只有本篇 24 道的圖、DLC 那 10 道是 404，guide 這份 34 道齊全，
 * 所以料理統一走這一個基底。載入失敗時卡片會退回文字色塊。
 *
 * 食材圖則兩個來源都有（hubs 的 pokopiadex 為主、DLC 兩種退回 guide），
 * 完整網址由抓取腳本寫進 `ingredient.image`，這裡沒有對應的組網址函式。
 */
const RECIPE_IMAGE_BASE = "https://pokopiaguide.com/images/cooking/recipes/";

export function recipeImageUrl(recipe: Recipe): string {
  return `${RECIPE_IMAGE_BASE}${recipe.id}.webp`;
}
