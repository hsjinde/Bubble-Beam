import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * /pokopia 的外框：/decks GuideLayout 的暖色雙生。結構（sticky nav + 版權 footer）
 * 刻意一致，配色換成 pokopia 暖色 token。`data-scope="pokopia"` 讓 styles.css 的
 * 焦點環改用木色 accent，避免與水藍系撞色。
 */
export function PokopiaLayout({ children }: { children: ReactNode }) {
  return (
    <div data-scope="pokopia" className="min-h-dvh bg-pokopia-bg">
      <header className="sticky top-0 z-40 border-b border-pokopia-tint bg-pokopia-bg-panel/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2">
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
          <Link
            to="/decks"
            className="inline-flex min-h-11 items-center font-semibold text-pokopia-ink hover:underline"
          >
            牌組攻略
          </Link>
          <Link
            to="/pokopia"
            className="inline-flex min-h-11 items-center font-semibold text-pokopia-ink hover:underline [&.active]:underline"
          >
            Pokopia 建築
          </Link>
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
