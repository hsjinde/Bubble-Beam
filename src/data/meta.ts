import type { MetaDeck } from "./types";
import raw from "./meta.json" with { type: "json" };
import limitlessMap from "./limitless-map.json" with { type: "json" };
import { getDeck } from "./decks";

export interface MetaSnapshot {
  fetchedAt: string; // ISO timestamp
  source: string;
  previousFetchedAt?: string; // 被比對的前一份快照的抓取時間（排名變化的基準）
  decks: MetaDeck[];
}

/**
 * Limitless 英文牌組名 → 策展攻略 id，與 `update-meta.mjs` 用的是同一份
 * `limitless-map.json`。
 *
 * 為什麼前端要再查一次：`curatedId` 是抓取當下寫進 `meta.json` 的欄位，但寫攻略
 * 的節奏跟排行榜的抓取週期是兩回事。今天補完 `decks.ts` 與 `limitless-map.json`，
 * `meta.json` 那一列仍然沒有 `curatedId`，排行榜就不會長出連結——而且不報錯、
 * 不會建置失敗，是無聲失敗。為了掛連結去重跑 `update-meta.mjs` 更糟：那會把
 * `previousRank` 的比較基準洗成新快照，真正的升降救不回來（見 CLAUDE.md）。
 *
 * 所以改成讀取時補值：只補不覆寫，`meta.json` 已經有值時一律以生成檔為準，
 * 下次正常抓取後這層就自動變成 no-op。
 */
const curatedIdByLimitlessName = new Map<string, string>(
  // 檔案裡有一個 `_comment` 字串鍵，所以逐筆判斷型別；對不到 decks.ts 的 id 也不補，
  // 連過去只會是 404。
  Object.entries(limitlessMap as Record<string, string | { limitlessName: string }>).flatMap(
    ([id, entry]): [string, string][] =>
      typeof entry === "object" && getDeck(id) ? [[entry.limitlessName, id]] : [],
  ),
);

let snapshot: MetaSnapshot | undefined;

export function getMeta(): MetaSnapshot {
  const base = raw as MetaSnapshot;
  snapshot ??= {
    ...base,
    decks: base.decks.map((deck) => {
      if (deck.curatedId) return deck;
      const curatedId = curatedIdByLimitlessName.get(deck.name);
      return curatedId ? { ...deck, curatedId } : deck;
    }),
  };
  return snapshot;
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
