export type Tier = "S" | "A" | "B" | "C";

/** 排行榜用：Wilson 下界太低的牌組會落到 D（策展牌組仍限 S–C）。 */
export type MetaTier = Tier | "D";

/** 排行榜牌組的代表牌表一張卡（保留 Limitless 原始 set/number 供 imggen 表單重建）。 */
export interface MetaDeckCard {
  id: string; // 對應 cards.json 的卡 id（P-A/P-B 已轉為 PROMO-A/PROMO-B）
  count: number;
  name: string; // Limitless 英文卡名
  set: string; // Limitless 原始 set 代號（如 "B1"、"P-A"）
  number: string;
}

/** /decks 排行榜的一列（來源：scripts/update-meta.mjs 產生的 meta.json）。 */
export interface MetaDeck {
  rank: number;
  name: string; // Limitless 英文牌組名（專有名詞，不翻譯）
  tier: MetaTier;
  wilsonLowerBoundPct: number;
  winratePct: number;
  sharePct: number;
  games: number;
  record: string; // "W-L-T"
  curatedId?: string; // 有策展攻略時對應 decks.ts 的 id
  cards?: MetaDeckCard[]; // 代表牌表（該牌組最近的最佳賽績）
  listSource?: string; // 牌表來源（Limitless 選手牌表頁網址）
}

export type EnergyType =
  | "Grass"
  | "Fire"
  | "Water"
  | "Lightning"
  | "Psychic"
  | "Fighting"
  | "Darkness"
  | "Metal"
  | "Dragon"
  | "Colorless";

export interface CardEntry {
  id: string; // "B3b-41"
  nameEN: string; // "Mega Sableye ex"
  nameTC?: string; // 人工繁中對照（可選）
  imageUrl: string;
}

export interface DeckCard {
  id: string; // card id, e.g. "B3a-19"
  count: number;
}

export interface Matchup {
  vs: string; // 對手牌組名
  note: string; // 繁中思路
}

export interface Deck {
  id: string; // slug, e.g. "miraidon-magnezone"
  name: string; // 繁中牌組名
  tier: Tier;
  energy: EnergyType[];
  cards: DeckCard[];
  summary: string; // 一句話簡介
  strategy: string; // 繁中攻略；段落以空行分隔，"- " 開頭為列點
  matchups?: Matchup[];
  difficulty: "易" | "中" | "難";
}
