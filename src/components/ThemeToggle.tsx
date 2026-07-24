import { useEffect, useRef, useState } from "react";

import {
  readPreference,
  setPreference,
  subscribeSystemChange,
  applyTheme,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "跟隨系統" },
  { value: "light", label: "淺色" },
  { value: "dark", label: "深色" },
];

/**
 * 三態主題切換：44×44 按鈕開啟小選單。
 *
 * 不用 segmented control——/pokopia 手機 header 的寬度預算塞不下三個並排選項。
 * 也不用單鈕循環——使用者無法預期「下一態」是什麼。
 *
 * ⚠ 按鈕圖示用 **CSS**（dark:hidden / hidden dark:inline）切換，不是 React
 * state。SSR 與首次 client render 的輸出因此完全一致，避開 hydration mismatch。
 * 「目前選中哪一態」的 state 只在選單打開後才用到，那時已經 hydrate 完畢。
 */
export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [pref, setPref] = useState<ThemePreference>("system");
  const rootRef = useRef<HTMLDivElement>(null);

  // 掛載後才讀 localStorage——SSR 讀不到，且首次 render 必須與伺服器一致
  useEffect(() => {
    setPref(readPreference());
  }, []);

  // 只有 system 態要監聽作業系統的切換
  useEffect(() => {
    if (pref !== "system") return;
    return subscribeSystemChange(applyTheme);
  }, [pref]);

  // 點外面或按 Escape 關閉
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (value: ThemePreference) => {
    setPreference(value);
    setPref(value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="切換主題"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-guide-bg-highlight [[data-scope=pokopia]_&]:hover:bg-pokopia-highlight"
      >
        {/* 圖示靠 CSS 切換，避開 hydration mismatch */}
        <svg
          className="h-5 w-5 dark:hidden"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg
          className="hidden h-5 w-5 dark:block"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-32 rounded-lg border border-guide-tint bg-guide-surface py-1 shadow-lg [[data-scope=pokopia]_&]:border-pokopia-tint [[data-scope=pokopia]_&]:bg-pokopia-surface"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={pref === opt.value}
              onClick={() => choose(opt.value)}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm whitespace-nowrap"
            >
              <span aria-hidden="true" className="w-4">
                {pref === opt.value ? "✓" : ""}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
