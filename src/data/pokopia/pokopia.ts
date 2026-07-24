import buildingsData from "./buildings.json";
import collectionsData from "./collections.json";
import type {
  Bookmark,
  Building,
  BuildingCategory,
  BuildingSeries,
  Collection,
  VideoInspiration,
} from "./types";

export type { Building, BuildingCategory, BuildingSeries, Collection, Bookmark, VideoInspiration };

export const buildings = buildingsData as Building[];
export const collections = collectionsData as Collection[];

const buildingsMap: Record<string, Building> = Object.fromEntries(buildings.map((b) => [b.id, b]));

export function getBuilding(id: string): Building | undefined {
  return buildingsMap[id];
}

/**
 * 建築圖片基底：圖片直接引用上游 pokopiadex.com 的資產（社群資料庫用的同一組
 * 卡圖來源，實測允許跨網域引用）。刻意不重新托管，維持與 CardImage 一致的 hotlink
 * 策略；載入失敗時 BuildingImage 會退回功能色塊。
 */
const IMAGE_BASE = "https://pokopiadex.com/images/items/";

export function buildingImageUrl(building: Building): string {
  return IMAGE_BASE + building.image;
}

/** 功能分類的固定顯示順序（住宅最多，擺第一）。 */
export const CATEGORIES: BuildingCategory[] = [
  "住宅",
  "寶可夢中心",
  "發電",
  "商店設施",
  "裝飾地標",
];

/**
 * 每個功能分類的色票：用於建築 tile 的色塊與分類 chip。刻意選暖色相鄰但可區分的
 * 色相，皆為淺底深字、對比達 WCAG AA（chip 內有文字，非唯一識別，仍附文字標籤）。
 */
export const CATEGORY_META: Record<BuildingCategory, { bg: string; ink: string }> = {
  住宅: { bg: "#f3e2c9", ink: "#6b4a1c" },
  寶可夢中心: { bg: "#f8d5cf", ink: "#8f3a34" },
  發電: { bg: "#f7e6b8", ink: "#7a5a12" },
  商店設施: { bg: "#e3e0d0", ink: "#4f4a37" },
  裝飾地標: { bg: "#e7ddc0", ink: "#5f5326" },
};

/** 住宅系列的顯示順序（次要篩選用）。 */
export const SERIES: BuildingSeries[] = [
  "城市",
  "沙地",
  "石頭",
  "灰色",
  "橙色",
  "粉色",
  "黃色",
  "葉片",
  "特色",
];

/** 每個功能分類的建築數量（給篩選 UI 顯示）。 */
export function countByCategory(): Record<BuildingCategory, number> {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    BuildingCategory,
    number
  >;
  for (const b of buildings) counts[b.category] += 1;
  return counts;
}

/**
 * 搭配靈感（本站整理，非官方資料）：同系列的住宅彼此最好搭；非住宅則推同功能的其他
 * 建築。回傳建議 id 與一句理由，供詳情面板顯示。
 */
export function getPairing(id: string): { recommendedIds: string[]; reason: string } {
  const building = buildingsMap[id];
  if (!building) return { recommendedIds: [], reason: "" };

  if (building.series && building.series !== "特色") {
    const siblings = buildings
      .filter((b) => b.id !== id && b.series === building.series)
      .map((b) => b.id);
    if (siblings.length > 0) {
      return {
        recommendedIds: siblings,
        reason: `同屬「${building.series}」風格系列，整體視覺協調一致，極適合規劃為風格獨特的城鎮園區。`,
      };
    }
  }

  const REASON_BY_CATEGORY: Record<BuildingCategory, string> = {
    住宅: "同屬住宅建築，並列規劃可打造熱鬧便利的住宅生活區，容納更多寶可夢夥伴。",
    寶可夢中心: "同為寶可夢中心主題建築，搭配展示能展現豐富多樣的建築特色。",
    發電: "集中發電設施規劃，能有效提升整座園區的供電運轉效率。",
    商店設施: "結合商店與休閒設施，讓生活機能區更加健全齊備。",
    裝飾地標: "搭配其他裝飾地標，極適合共同打造兼具觀光與休閒價值的特色園區。",
  };
  const peers = buildings
    .filter((b) => b.id !== id && b.category === building.category)
    .map((b) => b.id)
    .slice(0, 4);
  return { recommendedIds: peers, reason: REASON_BY_CATEGORY[building.category] };
}

/** 含指定建築的主題選集。 */
export function getCollectionsFor(id: string): Collection[] {
  return collections.filter((c) => c.buildingIds.includes(id));
}

/**
 * 書籤導航：全部為查證過的真實網址（2026-07 確認）。官方遊戲頁、Nintendo 商店、
 * 本站資料來源（pokemonhubs 社群資料庫）與其攻略／雲島代碼、以及 GO Taiwan 社群。
 */
export const BOOKMARKS: Bookmark[] = [
  {
    label: "官方遊戲情報",
    url: "https://www.pokemon.com/us/pokemon-news/pokemon-pokopia-is-available-now-on-nintendo-switch-2",
    icon: "home",
  },
  {
    label: "Nintendo 商店",
    url: "https://www.nintendo.com/us/store/products/pokemon-pokopia-switch-2/",
    icon: "cart",
  },
  {
    label: "建築資料庫",
    url: "https://pokopia.pokemonhubs.com/buildings/",
    icon: "book",
  },
  {
    label: "攻略・雲島代碼",
    url: "https://pokopia.pokemonhubs.com/guides/",
    icon: "compass",
  },
  {
    label: "GO Taiwan IG",
    url: "https://www.instagram.com/g.o_taiwan",
    icon: "camera",
  },
  {
    label: "GO Taiwan FB",
    url: "https://www.facebook.com/PokemonGotaiwan",
    icon: "chat",
  },
];

/**
 * 建築靈感影片：Pokopia 建築教學／展示，按「建築內容類型」分 7 區（見 VideoGroup）。
 * 日系精緻建築主播（使用者精選清單）與英文速建教學不分語言、按內容混排。
 * `title`／`channel` 為 YouTube 原始資料（標題保留日文／英文原文，符合本站專有名詞慣例）；
 * 縮圖走 i.ytimg.com/vi/{id}/hqdefault.jpg，連結走 youtube.com/watch?v={id}。
 *
 * 選片依據（2026-07）：從使用者精選清單的主播出發，抓各頻道 videos 頁的觀看數／發布時間
 * 取「近期熱門」，並逐支用 YouTube oEmbed 查證存在＋取回官方標題（同時濾掉混入頻道的
 * 他遊戲影片，如 Disney Dreamlight Valley）。更新時沿用同一套查證流程，別憑印象填 id。
 */
export const VIDEOS: VideoInspiration[] = [
  // ── 城市・街景 ─────────────────────────────────────────────────
  {
    id: "ZgwE9xk-MOQ",
    title: "【島紹介】ぽこポケとは思えない「サイバーパンクな街」が凄すぎる！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "賽博龐克風城市島導覽，霓虹高樓的震撼範例。",
    group: "city",
  },
  {
    id: "jmbUoFY4B24",
    title:
      "Pokémon Pokopia~PALETTE TOWN ENTRY DESIGN & SKYSCRAPERS~BUILDING A HUGE MODERN CITY~#pokopia  #7",
    channel: "HorribleGaming",
    blurb: "Palette Town 主題的都會入口與摩天樓群，大城市感十足。",
    group: "city",
  },
  {
    id: "vghz7UzZNqs",
    title: "【島紹介】1000時間プレイで作られた超巨大建築が凄すぎる！【ぽこあポケモン】",
    channel: "すくると",
    blurb: "遊玩上千小時打造的超巨大建築島導覽，開眼界找靈感。",
    group: "city",
  },
  // ── 住宅・別墅 ─────────────────────────────────────────────────
  {
    id: "2PXUx1F1_VA",
    title: "【ぽこポケ】初期地形を生かす⛱️レストランの再建と海辺の自宅づくり🏝️",
    channel: "Haruchi create",
    blurb: "活用初期地形，重建餐廳並蓋海邊自宅（發售初期經典）。",
    group: "house",
  },
  {
    id: "-5um9Org_Ys",
    title: "【ぽこポケ】初期地形を生かす🔰地下倉庫のある水車小屋作り",
    channel: "Haruchi create",
    blurb: "有地下倉庫的水車小屋，順著地形而建的機能住宅（你清單精選）。",
    group: "house",
  },
  {
    id: "tEU_Az77RT0",
    title:
      "Pokémon Pokopia~BEGINNER PLAYER HOME STORAGE HOUSE DESIGN~BUILDING A HOME IN #pokopia~Home Design",
    channel: "HorribleGaming",
    blurb: "新手玩家家園＋收納屋，機能與外觀一次到位。",
    group: "house",
  },
  {
    id: "8JHUVsq-L2Y",
    title:
      "Pokémon Pokopia~REALISTIC MODERN VILLA HABITAT HOME DESIGN~BLEAK BEACH~SPEED BUILD~#pokopia",
    channel: "HorribleGaming",
    blurb: "寫實現代別墅，蓋在荒涼海灘上的質感住宅。",
    group: "house",
  },
  // ── 商店・餐飲 ─────────────────────────────────────────────────
  {
    id: "aLZAW3kcS9M",
    title:
      "【ぽこあ建築】ドライブスルー付き！ぽこあポケモンの世界にマクドナルドを復活させてみた【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "附得來速車道的麥當勞，速食店招牌的還原度爆表。",
    group: "shop",
  },
  {
    id: "yQo5BmnfX2w",
    title:
      "【ぽこポケ】使い方次第で別のアイテムに！アイスクリーム屋さんの作り方＆解説【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "冰淇淋店做法解說，教你用道具巧手拼出小店（你清單精選）。",
    group: "shop",
  },
  {
    id: "TybuNrH2FLg",
    title:
      "Pokémon Pokopia~EASY STARTER CAFE/STOREFRONT HABITAT BUILDING DESIGN~STORAGE BUILDING IDEA",
    channel: "HorribleGaming",
    blurb: "新手也能蓋的咖啡廳／店面，附收納建築點子。",
    group: "shop",
  },
  // ── 主題・地標・遊樂 ───────────────────────────────────────────
  {
    id: "WNUGARMiE_8",
    title: "【ぽこあポケモン】本の中から現れる「幻想的な神殿」の作り方│建築│Pokopia",
    channel: "かぴぱか create",
    blurb: "從書中浮現的幻想神殿，充滿故事感的主題地標。",
    group: "landmark",
  },
  {
    id: "Tv9aIqSlPio",
    title:
      "期間限定ジラーチイベント！イベント限定アイテムで可愛い星空が見える家を建築してみた！【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "基拉祈活動限定，能望見星空的浪漫主題屋。",
    group: "landmark",
  },
  {
    id: "7nBNt4n2CYw",
    title:
      "【ぽこあポケモン】ガチで作りこんだ「巨大水上遊園地」のクオリティが限界突破すぎる…！【観覧車】ぽこポケ│建築",
    channel: "かぴぱか create",
    blurb: "有摩天輪的巨大水上遊樂園，大型主題設施天花板。",
    group: "landmark",
  },
  // ── 機關・自動化 ───────────────────────────────────────────────
  {
    id: "XuwJzDk9y8w",
    title: "The ONLY Crafting Base You Need in Pokopia! This Build FIXES Storage",
    channel: "zoibean",
    blurb: "一次解決收納痛點的製作基地，機能流必看。",
    group: "automation",
  },
  {
    id: "L_YmoChE4O4",
    title: "【ぽこポケ】不具合を解決した野菜と木の実自動化施設の徹底解説！サラサラ岩｜クロック回路",
    channel: "わむのスローライフっぽい",
    blurb: "蔬菜與木之實全自動化設施徹底解說，電路機關硬核向。",
    group: "automation",
  },
  {
    id: "uHzBdlva08Y",
    title:
      "Pokémon Pokopia~INDUSTRIAL CRAFTING & STORAGE WAREHOUSE~PALETTE TOWN MODERN CITY DESIGN~#pokopia #11",
    channel: "HorribleGaming",
    blurb: "工業風製作＋倉儲廠房，把機能區蓋得有模有樣。",
    group: "automation",
  },
  // ── 自然造景 ───────────────────────────────────────────────────
  {
    id: "spDVWmZlqh4",
    title:
      "Pokémon Pokopia~NATURAL CAMPSITE DESIGN~OVERGROWN NATURAL TOWN AESTHETIC~MULTIPLE HABITATS~ #pokopia",
    channel: "HorribleGaming",
    blurb: "野趣露營地，蔓草叢生的自然風小鎮造景。",
    group: "nature",
  },
  {
    id: "qud4uVkthmY",
    title:
      "POKOPIA Natural Aesthetic PokéCenter & Neighborhood Speed Build | PocoPoke Design Tutorial",
    channel: "Lex Play",
    blurb: "自然風寶可夢中心與街區的實作 speed build，跟著蓋。",
    group: "nature",
  },
  {
    id: "Bi_xDPh9Vmo",
    title:
      "【ぽこあ建築】癒やし効果あり？草・虫ポケモン達がのんびり暮らせる楽園を建築【ぽこあポケモン】",
    channel: "涼太ぱんけーき♭",
    blurb: "草系與蟲系寶可夢的療癒樂園，綠意盎然的棲地造景。",
    group: "nature",
  },
  // ── 設計技巧・綜合 ─────────────────────────────────────────────
  {
    id: "NnJHT0kCq5s",
    title: "【ぽこポケ】置くだけでかわいい！5種類の乗り物の作り方＆解説【ぽこあポケモン建築】",
    channel: "すくると",
    blurb: "只要擺上就很可愛，5 種載具小物的做法解說。",
    group: "tips",
  },
  {
    id: "vWWQdwB6QTc",
    title:
      "Overwhelmed? 12 Beginner Design Tips to Plan a Pretty & Functional Starter Base in Pokopia",
    channel: "CloudySkies Gaming",
    blurb: "新手入門：12 個把起始基地規劃得又美又實用的技巧。",
    group: "tips",
  },
  {
    id: "7mnOUEO8WdE",
    title:
      "8 Amazing Builds You Need for Pokemon Pokopia Inspiration and Ideas Haunted Mansions, Farms and More",
    channel: "MSensei NTD",
    blurb: "8 個腦洞大開的建築展示，鬼屋、農場都有，找靈感首選。",
    group: "tips",
  },
];
