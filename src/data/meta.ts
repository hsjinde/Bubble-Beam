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

/**
 * 把快照時間戳換算成台灣日曆日（`YYYY-MM-DD`）。
 *
 * `fetchedAt`／`previousFetchedAt` 存的是 UTC，直接 `.slice(0, 10)` 拿到的是 **UTC 的日期**：
 * 台灣時間 7/24 凌晨 01:19 抓的資料存成 `2026-07-23T17:19Z`，前端就顯示「更新日期 7/23」，
 * 讀者會以為資料整天沒動。台灣時間傍晚以後跑的每一次更新都會踩到。
 *
 * 刻意用固定 +8 小時算術，不用 `Intl` 的 `timeZone: "Asia/Taipei"`：SSR 跑在 Cloudflare
 * Workers，它的 ICU 時區資料與本機 Node 未必一致，兩邊算出不同日期就是 hydration mismatch，
 * 而且在 dev（純 Node）測不出來。台灣沒有日光節約時間，固定偏移永遠正確。
 *
 * 只用於顯示——`meta.json` 裡存的一律維持 UTC，sitemap 的 `lastmod` 要的就是 UTC。
 */
export function formatSnapshotDate(iso: string): string {
  return new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
