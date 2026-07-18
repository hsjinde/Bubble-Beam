export type Tier = "S" | "A" | "B" | "C";

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
