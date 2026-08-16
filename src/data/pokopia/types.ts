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

/**
 * 建造一個棲息地所需的材料。本篇來源是 pokopiaguide.com（hubs 完全沒有這塊資料），
 * DLC 那 36 筆改由手寫的 habitat-materials.json 覆寫（見 scripts/fetch-habitats.mjs）。
 */
export interface HabitatMaterial {
  /** 材料名（本篇與 DLC 皆已完整中文化對齊官方/社群繁中譯名）。 */
  name: string;
  qty: number;
}

/** 一個棲息地（來源：scripts/fetch-habitats.mjs 產生的 habitats.json）。 */
export interface Habitat {
  /** 上游 slug，穩定 id，也用於 deep-link 的 ?h= 參數 */
  id: string;
  /**
   * 上游編號（No.001）。**全表不唯一**——上游把 DLC 從 No.001 重新編號，
   * 所以要當 key 用時得配 `dlc` 一起看，穩定的唯一鍵只有 `id`。
   */
  no: number;
  /** 官方繁中名 */
  name: string;
  /**
   * 圖片路徑。本篇相對於 pokopiadex 的 /images/habitats/（`habitat_ui/tall-grass-001.png`），
   * DLC 那批 pokopiadex 上沒有（404），改相對於 hubs 自己的資產目錄——
   * 基底由 `dlc` 分流，見 habitats.ts 的 habitatImageUrl。
   */
  image: string;
  /** DLC「冒泡泡海底的城鎮」新增的海底棲息地 */
  dlc?: boolean;
  pokemon: HabitatPokemon[];
  /** 建造材料；上游對不起來時為 undefined（245 筆中僅剩 1 筆本篇查無） */
  materials?: HabitatMaterial[];
}

/**
 * 料理／食材的口味。供奉給苔卡比獸時，**決定當天 buff 的是口味而不是料理本身**，
 * 所以這是整個料理頁的主軸。`plain`（普通）在上游是「沒有特殊口味」，不是第七種味道。
 */
export type Flavor = "plain" | "sweet" | "spicy" | "bitter" | "dry" | "sour";

/** 料理分類，對應四種（DLC 後五種）料理器具。 */
export type RecipeCategory = "salad" | "soup" | "bread" | "hamburger-steak" | "smoothie";

/** 一道料理的素材。`wildcard` 是「任意麵包」「任意食材」這種不指定的格子。 */
export interface RecipeIngredient {
  name: string;
  wildcard: boolean;
}

/** 一道料理（來源：scripts/fetch-cooking.mjs 產生的 cooking.json）。 */
export interface Recipe {
  /** pokopiaguide 的 slug，穩定 id，也用於卡片圖與 deep-link 的 ?r= 參數 */
  id: string;
  name: string;
  /**
   * 名字的出處。`hubs`＝官方繁中名；`guide`＝DLC 那 10 道 hubs 尚未收錄，
   * 退回 pokopiaguide 的社群譯名，UI 上標「暫譯」以免被當成官方名。
   */
  nameSource: "hubs" | "guide";
  category: RecipeCategory;
  /** 料理器具（砧板／鍋子／麵包窯／平底鍋／攪拌機） */
  tool: string;
  toolId: string;
  flavor: Flavor;
  /** 吃下去會強化的招式（樹葉／水槍／居合斬／碎岩／衝浪） */
  move: string;
  /** 少數料理的招式強化幅度更大 */
  strongMove: boolean;
  /** 需要帶某個特技的寶可夢才做得出來（如「燃燒」「搗碎」），不需要則為 null */
  specialty: string | null;
  ingredients: RecipeIngredient[];
  /** 賣出價（生活幣）。本篇 100／200／500 三階，DLC 上游沒給就是 null */
  price: number | null;
  dlc?: boolean;
  /** 供奉後的當日效果原文（如「棲息地更容易出現寶可夢」） */
  effect: string;
  /** 供奉效果強度：2＝較容易、3＝更容易。1 是生食材，只出現在 Ingredient 上 */
  level: 2 | 3;
}

/** 可直接供奉（不下鍋）的食材。 */
export interface Ingredient {
  id: string;
  name: string;
  /** 日文名，只用來對照上游，不顯示 */
  ja: string;
  flavor: Flavor;
  /** 一句話的取得方式 */
  source: string;
  dlc?: boolean;
  /**
   * 圖示網址。這裡存**完整網址**而不是像建築那樣只存片段：食材圖有兩個來源
   * （hubs 的 pokopiadex／DLC 兩種退回 pokopiaguide），基底不是同一個。
   */
  image: string;
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
