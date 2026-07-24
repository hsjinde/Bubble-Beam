import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-guide-bg">
      <header className="sticky top-0 z-40 border-b border-guide-tint bg-guide-surface/90 backdrop-blur">
        {/*
         * py-2 + min-h-11：連結本身撐到 44px 觸控目標。
         *
         * flex-wrap：這裡原本沒有 wrap，手機 375px 下會強制單行水平溢位
         * （既有 bug，跟深色模式無關，加 ThemeToggle 前先順手修掉——不修的話
         * 新按鈕只會讓溢位更嚴重，也會過不了「手機無水平溢位」這條硬底線）。
         */}
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
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
          {/* exact：否則 /decks/schedule 與各攻略頁下父路由也會被標成 active */}
          <Link
            to="/decks"
            activeOptions={{ exact: true }}
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-guide-ink hover:underline"
          >
            牌組攻略
          </Link>
          <Link
            to="/decks/schedule"
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-guide-ink hover:underline"
          >
            行事曆
          </Link>
          {/*
           * 跨區入口。在這之前兩個子站只有首頁一條橋——從搜尋引擎直接落到 /decks 的
           * 訪客完全不知道有 Pokopia 建築指南。ml-auto ＋ 邊框藥丸是刻意的區隔：
           * 左側是「本區的分頁」，右側是「離開這一區」，避免看起來像同層級的第三個分頁。
           * 用 guide 色票而非 pokopia 暖色——它還在攻略站的視覺範圍內。
           */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/pokopia"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-guide-tint px-3.5 text-sm font-semibold whitespace-nowrap text-guide-ink transition hover:border-guide-accent hover:bg-guide-bg"
            >
              Pokopia 建築
              <span aria-hidden="true">→</span>
            </Link>
            <ThemeToggle />
          </div>
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
