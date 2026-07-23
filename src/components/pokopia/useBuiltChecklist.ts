import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pokopia:built";

/**
 * 「已蓋建築」的本機進度紀錄。純 localStorage、不需要登入，也不會離開這台裝置。
 *
 * SSR 注意：伺服器端沒有 localStorage，初次算繪一律當「全未勾」，掛載後才在
 * useEffect 裡讀回來。不這樣做的話 SSR 的 HTML 與 client 首次算繪會對不上，
 * React 會噴 hydration mismatch 並丟掉整棵樹重畫。
 *
 * `hydrated` 給呼叫端判斷「還沒讀到」與「讀到了但是空的」——這兩種狀態的
 * UI 呈現不一樣（前者不該閃出「已蓋 0／45」）。
 */
export function useBuiltChecklist() {
  const [built, setBuilt] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setBuilt(new Set(parsed.filter((v): v is string => typeof v === "string")));
      }
    } catch {
      // 存的東西壞了（手改過、或跨版本格式不同）就當作沒有紀錄，不要讓整頁掛掉
    }
    setHydrated(true);
  }, []);

  // 只在掛載後寫回：不加這個條件的話，首次算繪的空 Set 會把既有紀錄清掉
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...built]));
    } catch {
      // 無痕模式／配額滿：勾選在本次瀏覽仍有效，只是不會留到下次
    }
  }, [built, hydrated]);

  const toggle = useCallback((id: string) => {
    setBuilt((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setBuilt(new Set()), []);

  return { built, hydrated, toggle, clear };
}
