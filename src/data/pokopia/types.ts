/**
 * Pokopia 建築指南的型別定義。
 *
 * 資料來源：pokopia.pokemonhubs.com（社群資料庫，含官方繁中譯名與描述）。
 * 建築名、描述、slug 皆為上游既有資料，未經改寫；`category`／`series` 是本站
 * 依遊戲內實際結構（功能 × 材質系列）整理的分類，非官方 metadata。
 * `pairings`（搭配靈感）與 `collections`（主題選集）是本站策展，不是官方資料——
 * UI 上會明確標示，避免被當成官方推薦。
 */

/** 功能分類：對應遊戲內建築的實際用途，取代原方案憑空發明的風格 tag。 */
export type BuildingCategory = "住宅" | "寶可夢中心" | "發電" | "商店設施" | "裝飾地標";

/** 材質／主題系列：住宅類建築的次要分軸（城市、沙地、葉片…）。 */
export type BuildingSeries =
  "城市" | "沙地" | "石頭" | "灰色" | "橙色" | "粉色" | "黃色" | "葉片" | "特色";

export interface Building {
  /** 上游 slug，穩定 id，也用於 deep-link 的 ?b= 參數 */
  id: string;
  /** 官方繁中名 */
  name: string;
  /** 英文原名（Limitless／官方英文） */
  nameEN: string;
  /** 官方繁中描述 */
  description: string;
  category: BuildingCategory;
  /** 住宅類才有系列；非住宅為 undefined */
  series?: BuildingSeries;
  /**
   * 建築圖片路徑，相對於 pokopiadex 資產基底（見 pokopia.ts 的 buildingImageUrl）。
   * 例：`shop_ui/relaxing-park-kit.png`。載入失敗時 BuildingImage 退回功能色塊。
   */
  image: string;
}

/** 搭配靈感：某建築 → 建議一起蓋的建築（本站整理，非官方）。 */
export interface Pairing {
  buildingId: string;
  recommendedIds: string[];
  /** 為什麼這樣搭（一句話理由） */
  reason: string;
}

/** 主題選集：一組真實建築的策展組合，取代原方案捏造的「社群佈局方案」。 */
export interface Collection {
  id: string;
  name: string;
  description: string;
  buildingIds: string[];
}

/** 棲息地會出沒的一隻寶可夢。 */
export interface HabitatPokemon {
  /** 上游圖鑑 slug；也用來組 sprite 網址（sprites/{id}.png） */
  id: string;
  /** 全國圖鑑編號；沒有圖鑑頁的變種形態（如無殼海兔東海形態）為 0 */
  no: number;
  /** 官方繁中名 */
  name: string;
  /** 分類（如「迷你龜寶可夢」）；變種形態的卡片沒有這欄，為空字串 */
  category: string;
}

/** 一個棲息地（來源：scripts/fetch-habitats.mjs 產生的 habitats.json）。 */
export interface Habitat {
  /** 上游 slug，穩定 id，也用於 deep-link 的 ?h= 參數 */
  id: string;
  /** 上游編號（No.001） */
  no: number;
  /** 官方繁中名 */
  name: string;
  /** 圖片路徑，相對於 pokopiadex 的 /images/habitats/（例：`habitat_ui/tall-grass-001.png`） */
  image: string;
  pokemon: HabitatPokemon[];
}

/** 外部書籤連結（皆為查證過的真實網址）。 */
export interface Bookmark {
  label: string;
  url: string;
  /** inline SVG path 的識別鍵，對應 BookmarkNav 的圖示表 */
  icon: string;
}

/**
 * 影片分區：以「建築內容類型」為軸，讓玩家依想蓋的東西找靈感。
 * 日系精緻建築與英文速建教學不分語言、按內容混排（使用者定調）。
 */
export type VideoGroup =
  | "city" // 城市・街景
  | "house" // 住宅・別墅
  | "shop" // 商店・餐飲
  | "landmark" // 主題・地標・遊樂
  | "automation" // 機關・自動化
  | "nature" // 自然造景
  | "tips"; // 設計技巧・綜合

/** YouTube 建築靈感影片（皆經 oEmbed 查證存在，標題／頻道為原始資料）。 */
export interface VideoInspiration {
  /** YouTube 影片 id，縮圖與連結都由它組出 */
  id: string;
  /** 原始影片標題 */
  title: string;
  /** 頻道名 */
  channel: string;
  /** 一句繁中說明它適合看什麼 */
  blurb: string;
  /** 所屬分區；決定在「房屋・住宅設計」或「設計技巧・其他建築」下呈現 */
  group: VideoGroup;
}
