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
        reason: `同為「${building.series}」系列，外觀一致，排在一起最像一座聚落。`,
      };
    }
  }

  const REASON_BY_CATEGORY: Record<BuildingCategory, string> = {
    住宅: "同屬住宅，湊成住宅區能容納更多寶可夢。",
    寶可夢中心: "其他主題寶可夢中心，並列展示各有風情。",
    發電: "集中發電設施能提高整區供電效率。",
    商店設施: "商店與設施擺在一起，機能生活區更完整。",
    裝飾地標: "其他裝飾地標，適合一起打造觀光／活動區。",
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
 * 建築靈感影片：熱門的 Pokopia 建築／佈局教學。全部經 YouTube oEmbed 查證存在，
 * `title`／`channel` 為原始資料；縮圖走 i.ytimg.com/vi/{id}/hqdefault.jpg，連結
 * 走 youtube.com/watch?v={id}。挑選兼顧「靈感展示 / 設計技巧 / 新手 / 實作 build」。
 */
export const VIDEOS: VideoInspiration[] = [
  {
    id: "7mnOUEO8WdE",
    title:
      "8 Amazing Builds You Need for Pokemon Pokopia Inspiration and Ideas Haunted Mansions, Farms and More",
    channel: "MSensei NTD",
    blurb: "8 個腦洞大開的建築展示，鬼屋、農場都有，找靈感首選。",
  },
  {
    id: "vWWQdwB6QTc",
    title:
      "Overwhelmed? 12 Beginner Design Tips to Plan a Pretty & Functional Starter Base in Pokopia",
    channel: "CloudySkies Gaming",
    blurb: "新手入門：12 個把起始基地規劃得又美又實用的技巧。",
  },
  {
    id: "qqZ3TNA91AM",
    title: "Pokemon Pokopia - Design Tips & Build Ideas You Should Know!",
    channel: "Crossing Channel",
    blurb: "該懂的設計原則與 build 點子，快速提升整體質感。",
  },
  {
    id: "BSzj9XqFnw0",
    title: "You Can Design BETTER In Pokopia || Easy Tips & Tricks",
    channel: "Lex Play",
    blurb: "簡單易上手的排版小技巧，讓你的島瞬間變好看。",
  },
  {
    id: "qud4uVkthmY",
    title:
      "POKOPIA Natural Aesthetic PokéCenter & Neighborhood Speed Build | PocoPoke Design Tutorial",
    channel: "Lex Play",
    blurb: "自然風寶可夢中心與街區的實作 speed build，跟著蓋。",
  },
  {
    id: "TybuNrH2FLg",
    title:
      "Pokémon Pokopia~EASY STARTER CAFE/STOREFRONT HABITAT BUILDING DESIGN~STORAGE BUILDING IDEA",
    channel: "HorribleGaming",
    blurb: "新手也能蓋的咖啡廳／店面棲地設計，附收納建築點子。",
  },
];
