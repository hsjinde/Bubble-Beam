export type Tier = "S" | "A" | "B" | "C";

/** 排行榜用：Wilson 下界太低的牌組會落到 D（策展牌組仍限 S–C）。 */
export type MetaTier = Tier | "D";

/** 排行榜牌組的代表牌表一張卡（set/number 是上游 imggen payload 的原始欄位，抓取管線需要）。 */
export interface MetaDeckCard {
  id: string; // 對應 cards.json 的卡 id（P-A/P-B 已轉為 PROMO-A/PROMO-B）
  count: number;
  name: string; // Limitless 英文卡名
  set: string; // Limitless 原始 set 代號（如 "B1"、"P-A"）
  number: string;
}

/** 一張卡在取樣牌表中的採用情形（見 MetaDeck.cardUsage）。 */
export interface MetaCardUsage {
  id: string; // 對應 cards.json 的卡 id
  usagePct: number; // 出現在幾 % 的取樣牌表裡（0–100 整數）
  modalCount: number; // 有帶的牌表中最常見的張數
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
  /** 算採用率時實際取樣到的牌表數（可能少於 LISTS_PER_DECK，個別牌表會抓失敗）。 */
  listsSampled?: number;
  /**
   * 卡片採用率：這張卡出現在幾成的取樣牌表裡。用來區分「核心牌」與「自由席」——
   * 代表牌表只是某一位選手的取捨，採用率才看得出整個場上的共識。
   *
   * 刻意只存 id／usagePct／modalCount：卡名走 `getCard()` 查，重複存 name/set/number
   * 會讓 meta.json 翻倍，而它是被 `meta.ts` 靜態 import 進 client bundle 的。
   * 低於 `MIN_USAGE_PCT` 的長尾科技牌不寫入（見 scripts/update-meta.mjs）。
   */
  cardUsage?: MetaCardUsage[];
  /**
   * 上一次抓取時的名次，用來算排名變化。三種值意義不同，不要混為一談：
   * 數字＝上次也在榜上；null＝上次不在榜上（新進榜）；欄位不存在＝那次抓取沒有可比對的
   * 前一份快照（例如第一次產生 meta.json），此時前端不顯示變化而不是謊報新進榜。
   */
  previousRank?: number | null;
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
  /**
   * 列表縮圖與分享卡片要用的「門面卡」。**通常不用填**——`getHeroCardId()` 會自動推導
   * （Mega 優先 → ex → 牌表第一張），21 套裡只有 1 套推導錯。只有當牌表同時含多張
   * Mega／ex、而排在前面的那張不是牌組名主角時才需要明寫。
   */
  heroCardId?: string;
}
