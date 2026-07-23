import rawEvents from "./events.json";
import rawSets from "./sets.json";

/**
 * /decks/schedule 的資料層。兩條來源刻意分開：
 *   sets.json   — scripts/fetch-sets.mjs 生成，歷代擴充包時間軸，永遠不會過期
 *   events.json — 人工維護，即將發售與遊戲內活動（上游沒有這些資料）
 */

export type EventType = "set" | "drop" | "wonderpick" | "ranked" | "other";

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  /** 繁中譯名（官方尚未公布時就沒有，不要自己編） */
  titleTC?: string;
  startAt: string; // ISO 8601
  /** 沒有結束時間的（如擴充包發售）就是單一時間點 */
  endAt?: string;
  note?: string;
  url?: string;
}

export interface ExpansionSet {
  code: string;
  series: string;
  releaseDate: string; // YYYY-MM-DD
  count?: number;
  nameEN: string;
  nameTC?: string;
  packs: string[];
}

const eventsFile = rawEvents as { updatedAt: string; events: GameEvent[] };

/** 人工清單最後更新日。前端要顯示它——讀者才知道這份資料新不新。 */
export const eventsUpdatedAt = eventsFile.updatedAt;

export const sets = rawSets as ExpansionSet[];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  set: "新擴充包",
  drop: "Drop 活動",
  wonderpick: "Wonder Pick",
  ranked: "排名賽季",
  other: "活動",
};

export type EventPhase = "upcoming" | "ongoing" | "ended";

/**
 * 依傳入的時間把活動分成三類。
 *
 * `now` 一定要由呼叫端傳入，不要在這裡呼叫 Date.now()：這個函式在 SSR 與 client
 * 都會跑，各自取「現在」會得到不同結果而造成 hydration mismatch。
 */
export function eventPhase(event: GameEvent, now: number): EventPhase {
  const start = Date.parse(event.startAt);
  const end = event.endAt ? Date.parse(event.endAt) : start;
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "ongoing";
}

/** 即將開始與進行中的活動，依開始時間排序。 */
export function activeEvents(now: number): { upcoming: GameEvent[]; ongoing: GameEvent[] } {
  const byStart = [...eventsFile.events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  return {
    upcoming: byStart.filter((e) => eventPhase(e, now) === "upcoming"),
    ongoing: byStart.filter((e) => eventPhase(e, now) === "ongoing"),
  };
}

/** 歷代擴充包，最新的排最前面。 */
export function setsNewestFirst(): ExpansionSet[] {
  return [...sets].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

/** 下一個即將發售的擴充包（給 /decks 頁頂的提示條用）；沒有就回 undefined。 */
export function nextSetRelease(now: number): GameEvent | undefined {
  return activeEvents(now).upcoming.find((e) => e.type === "set");
}

/**
 * 相差幾個「日曆天」（依瀏覽器所在時區）。
 *
 * 刻意不是 `Math.ceil((target - now) / 86400000)`：那算的是絕對時間差，
 * 剩 6.3 天會顯示「還有 7 天」，但使用者是照日曆數的，看到 7/29 結束、今天 7/24
 * 只會數出 5 天。顯示粒度既然只到天，就把兩端都歸到當地午夜再相減。
 */
export function daysUntil(iso: string, now: number): number {
  const midnight = (t: number) => {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.round((midnight(Date.parse(iso)) - midnight(now)) / 86_400_000);
}
