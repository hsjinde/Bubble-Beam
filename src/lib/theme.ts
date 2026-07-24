/**
 * 深色模式的狀態層：三態偏好、localStorage、系統偏好監聽、套用到 <html>。
 *
 * ⚠ 這裡的解析邏輯在 `src/routes/__root.tsx` 的 <head> inline script 裡有
 * **第二份**。那一份必須是同步、無相依、自包含的（首次繪製前就要跑完，
 * 那時模組還沒載入），所以無法共用這個檔案。**兩份要一起改。**
 */

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "piplup-theme";

/** 淺色沿用 __root.tsx 既有的 theme-color，不能改——那會動到淺色模式的行為。 */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#2a6f97",
  dark: "#0f1a22",
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isPreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/** 讀使用者存的偏好。localStorage 不可用（隱私模式）或值不合法時回 "system"。 */
export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** 把偏好解析成實際要套用的主題。SSR（沒有 window）一律回 "light"。 */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref !== "system") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * 套用主題到 <html>。除了 class 之外還要設 colorScheme——否則深色頁面會配
 * 白色捲軸、表單控制項與 autofill 底色也不會跟著變。
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[resolved]);
}

/** 寫入偏好並立即套用。localStorage 寫入失敗時仍會套用（只是不會被記住）。 */
export function setPreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // 隱私模式擋掉寫入：不阻斷切換，只是重新整理後回到系統偏好
  }
  applyTheme(resolveTheme(pref));
}

/**
 * 訂閱系統偏好變化。只有 pref === "system" 時需要——使用者在作業系統層切換
 * 時頁面要即時反應。回傳取消訂閱函式。
 */
export function subscribeSystemChange(onChange: (resolved: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(DARK_QUERY);
  const handler = (e: MediaQueryListEvent) => onChange(e.matches ? "dark" : "light");
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
