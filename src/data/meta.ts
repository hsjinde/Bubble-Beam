import type { MetaDeck } from "./types";
import raw from "./meta.json";

export interface MetaSnapshot {
  fetchedAt: string; // ISO timestamp
  source: string;
  previousFetchedAt?: string; // 被比對的前一份快照的抓取時間（排名變化的基準）
  decks: MetaDeck[];
}

export function getMeta(): MetaSnapshot {
  return raw as MetaSnapshot;
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
