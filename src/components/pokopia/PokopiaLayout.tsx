import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * /pokopia 的外框：/decks GuideLayout 的暖色雙生。結構（sticky nav + 版權 footer）
 * 刻意一致，配色換成 pokopia 暖色 token。`data-scope="pokopia"` 讓 styles.css 的
 * 焦點環改用木色 accent，避免與水藍系撞色。
 */
export function PokopiaLayout({ children }: { children: ReactNode }) {
  return (
    <div data-scope="pokopia" className="min-h-dvh bg-pokopia-bg">
      <header className="sticky top-0 z-40 border-b border-pokopia-tint bg-pokopia-bg-panel/90 backdrop-blur">
        {/*
         * 375px 手機的實測預算（可用寬 343px＝375 − px-4 兩側）。
         *
         * ⚠ 這裡先前的註解算式（「82＋建築32＋影片32＋104＋gap48＝298，留 45px」）
         * 漏算了「棲息地」連結（48px）——實測含棲息地後，即使區內標籤已縮寫，
         * 單靠縮寫仍不夠塞進一行，跨區膠囊照樣被擠到第二行（109px，非 61px）。
         * 這是 2026-07-24 加深色模式之前就存在的既有計算疏漏，與 ThemeToggle 無關。
         *
         * 加入 ThemeToggle（44px）後只會讓第二行更擠，不會造成水平溢位——
         * flex-wrap 已經在，兩行式樣本來就是保底機制。
         */}
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:gap-x-6">
          <Link to="/" className="group inline-flex min-h-11 items-center gap-1.5 text-pokopia-ink">
            {/* 首頁 identity 延續：手寫 logo ＋ 一片小樹葉，呼應 Pokopia 的自然生活調性 */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-pokopia-accent transition-transform duration-300 group-hover:rotate-[18deg]"
              aria-hidden="true"
            >
              <path d="M52 12 C24 12 12 30 12 52 C34 52 52 40 52 12 Z" />
              <path d="M20 44 Q34 34 46 22" />
            </svg>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
            >
              Piplup!
            </span>
          </Link>
          {/* exact：否則 /pokopia/videos 下父路由也會被標成 active，兩個連結同時 aria-current */}
          <Link
            to="/pokopia"
            activeOptions={{ exact: true }}
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-pokopia-ink hover:underline"
          >
            {/* hidden＝display:none，所以無障礙樹裡永遠只有一個名稱，不會被讀兩次 */}
            <span className="sm:hidden">建築</span>
            <span className="hidden sm:inline">Pokopia 建築</span>
          </Link>
          <Link
            to="/pokopia/videos"
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-pokopia-ink hover:underline"
          >
            <span className="sm:hidden">影片</span>
            <span className="hidden sm:inline">建築影片</span>
          </Link>
          <Link
            to="/pokopia/habitats"
            className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-pokopia-ink hover:underline"
          >
            棲息地
          </Link>
          {/* 跨區入口，與 GuideLayout 的對稱作法；配色留在 pokopia 暖色域內。 */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/decks"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-pokopia-tint px-3.5 text-sm font-semibold whitespace-nowrap text-pokopia-ink transition hover:border-pokopia-accent hover:bg-pokopia-highlight"
            >
              牌組攻略
              <span aria-hidden="true">→</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-pokopia-ink-soft">
        非官方粉絲攻略站。建築名稱、描述與分類資料來自社群資料庫（pokopia.pokemonhubs.com）；「搭配靈感」與「主題選集」為本站策展，非官方資料。Pokémon
        與《Pokémon Pokopia》相關權利屬於任天堂／The Pokémon Company／GAME FREAK。
      </footer>
    </div>
  );
}
