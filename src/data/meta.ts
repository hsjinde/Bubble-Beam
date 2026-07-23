import type { MetaDeck } from "./types";
import raw from "./meta.json" with { type: "json" };

export interface MetaSnapshot {
  fetchedAt: string; // ISO timestamp
  source: string;
  previousFetchedAt?: string; // 被比對的前一份快照的抓取時間（排名變化的基準）
  decks: MetaDeck[];
}

export function getMeta(): MetaSnapshot {
  return raw as MetaSnapshot;
}

/**
 * 找出某個策展牌組在排行榜上對應的那一列。策展頁要拿排行榜才有的資料
 * （採用率、取樣牌表數）時用它。牌組跌出 Top 20 時回 undefined——
 * 呼叫端要能接受「有攻略但榜上沒有」的情況。
 */
export function getMetaByCuratedId(curatedId: string): MetaDeck | undefined {
  return getMeta().decks.find((d) => d.curatedId === curatedId);
}

/** 排名變化的四種狀態；unknown 代表沒有可比對的歷史資料，前端應留白。 */
export type RankChangeState = "up" | "down" | "same" | "new" | "unknown";

export interface RankChange {
  state: RankChangeState;
  delta: number; // 升降的名次數；same/new/unknown 為 0
  previousRank: number | null;
}

export function getRankChange(deck: MetaDeck): RankChange {
  const prev = deck.previousRank;
  if (prev === undefined) return { state: "unknown", delta: 0, previousRank: null };
  if (prev === null) return { state: "new", delta: 0, previousRank: null };
  if (prev === deck.rank) return { state: "same", delta: 0, previousRank: prev };
  // 名次數字變小＝排名往前
  return prev > deck.rank
    ? { state: "up", delta: prev - deck.rank, previousRank: prev }
    : { state: "down", delta: deck.rank - prev, previousRank: prev };
}
