import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * /decks 的篩選狀態存在網址 query 裡，而不是元件內的 useState。
 *
 * 為什麼值得這樣做：這頁的產出就是「一份篩過的清單」——「Tier S 的排行」「草系、
 * 難度易的攻略」都是使用者會想貼給別人的東西。存在 useState 裡的話貼出去只會得到
 * 未篩選的首頁，自己按重新整理也會歸零。
 *
 * 兩區各自的參數前綴：排行榜是 q／tier，精選攻略是 c 開頭（cq／ctier／cenergy／cdiff）。
 * 兩區的篩選刻意互相獨立（見 CuratedDecks 的說明），參數也就不能共用。
 *
 * 一律 `replace: true` ＋ `resetScroll: false`：篩選不是「換頁」，不該灌爆上一頁堆疊，
 * 也不該把使用者捲回頂端。
 */
export type DecksSearch = {
  q?: string;
  tier?: string;
  cq?: string;
  ctier?: string;
  cenergy?: string;
  cdiff?: string;
};

/** 逗號分隔字串 → 集合。網址寫成 `?tier=S,A` 而不是 JSON 陣列，人看得懂也貼得動。 */
export function parseSet<T extends string>(raw: string | undefined, allowed: readonly T[]): Set<T> {
  if (!raw) return new Set();
  const ok = new Set<string>(allowed);
  return new Set(raw.split(",").filter((v): v is T => ok.has(v)));
}

/** 集合 → 逗號分隔字串。空集合回 undefined，讓參數整個從網址消失而不是留一個 `tier=`。 */
export function serializeSet<T extends string>(
  set: Set<T>,
  order: readonly T[],
): string | undefined {
  const list = order.filter((v) => set.has(v));
  return list.length ? list.join(",") : undefined;
}

export function useDecksSearch() {
  const search = useSearch({ from: "/decks/" }) as DecksSearch;
  const navigate = useNavigate({ from: "/decks/" });

  /**
   * `next` 可以給函式版本，拿到的是「導航當下的」search 而不是這次算繪看到的。
   *
   * 這個區別是必要的，不是潔癖：連按兩顆晶片時，第二個 handler 仍然拿著第一次點擊前的
   * search 快照（導航是非同步的，React 也會把同一批事件合併），用快照去算 toggle 會把
   * 前一次的選取整個蓋掉——實測連點 S、A 只會留下 A。所以所有「基於現值增減」的操作
   * 都要走函式版本；只有「直接指定值／清空」才可以給物件。
   */
  const patch = useCallback(
    (next: Partial<DecksSearch> | ((prev: DecksSearch) => Partial<DecksSearch>)) => {
      navigate({
        search: (prev: DecksSearch) => ({
          ...prev,
          ...(typeof next === "function" ? next(prev) : next),
        }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  return { search, patch };
}

/** 把某個逗號分隔參數當集合來 toggle。回傳給 `patch` 的函式版本用。 */
export function toggleInParam<T extends string>(
  key: keyof DecksSearch,
  order: readonly T[],
  value: T,
) {
  return (prev: DecksSearch): Partial<DecksSearch> => {
    const next = parseSet(prev[key], order);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return { [key]: serializeSet(next, order) };
  };
}

/**
 * 搜尋框專用：輸入即時反應（本地 state），寫回網址延遲 300ms。
 *
 * 不延遲的話每敲一個字就是一次 router navigate——排行榜全展開時底下掛著六百多張卡圖，
 * 每次重繪都看得出來。篩選本身仍然吃本地值，所以打字體感不受延遲影響；網址只是
 * 「可分享的鏡像」，晚 300ms 到沒有差別。
 *
 * lastWritten 這個 ref 是為了分辨「網址變了是因為我剛寫進去」還是「使用者按了上一頁」。
 * 只有後者才要把本地值同步回來，否則打字打到一半會被自己寫的值蓋回去。
 */
export function useDebouncedSearchParam(
  value: string | undefined,
  onCommit: (next: string | undefined) => void,
): [string, (next: string) => void] {
  const [local, setLocal] = useState(value ?? "");
  const lastWritten = useRef<string | undefined>(value);

  useEffect(() => {
    if (value === lastWritten.current) return;
    // 外部（上一頁／下一頁、或直接改網址）改動，同步回輸入框
    lastWritten.current = value;
    setLocal(value ?? "");
  }, [value]);

  useEffect(() => {
    const next = local.trim() === "" ? undefined : local;
    if (next === lastWritten.current) return;
    const timer = setTimeout(() => {
      lastWritten.current = next;
      onCommit(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [local, onCommit]);

  return [local, setLocal];
}
