import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-guide-bg">
      <header className="sticky top-0 z-40 border-b border-guide-tint bg-white/90 backdrop-blur">
        {/* py-2 + min-h-11：連結本身撐到 44px 觸控目標，導覽列總高維持在 60px */}
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2">
          <Link to="/" className="group inline-flex min-h-11 items-center gap-1.5 text-guide-ink">
            {/*
             * 首頁個性延續：手寫 logo ＋ 首頁既有的手繪水花，呼應那個好玩的波加曼世界，
             * 補「點進攻略站就變冷冰冰表格」的情感斷崖。用的是首頁 identity（既有 doodle
             * 品牌語言），非新造 sketchy SVG；克制在 header 一處，其餘導覽維持正式。
             * hover 轉動由 styles.css 的全域 reduced-motion 保險絲覆蓋。
             */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-guide-accent transition-transform duration-300 group-hover:rotate-[18deg]"
              aria-hidden="true"
            >
              <path d="M32 6 Q34 26 54 32 Q34 34 32 58 Q30 34 10 32 Q30 26 32 6 Z" />
            </svg>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
            >
              Piplup!
            </span>
          </Link>
          <Link
            to="/decks"
            className="inline-flex min-h-11 items-center font-semibold text-guide-ink hover:underline"
          >
            牌組攻略
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      {/* 版權與資料來源聲明：原本 /60 只有 2.41:1，實心 #2a6f97 在 #eef7fc 上是 5.07:1 */}
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-guide-ink">
        非官方粉絲攻略站。卡牌資料與卡圖來自社群資料庫（flibustier/pokemon-tcg-pocket-database）；Pokémon
        相關權利屬於其權利人。
      </footer>
    </div>
  );
}
