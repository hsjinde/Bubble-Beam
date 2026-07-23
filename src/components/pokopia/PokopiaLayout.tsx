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
        {/*
         * 375px 手機的實測預算（可用寬 343px＝375 − px-4 兩側）：
         *   logo 82 ＋「Pokopia 建築」99 ＋「建築影片」64 ＋ 跨區膠囊 104 ＋ gap-x-6 72 ＝ 421
         * 超出 78px，跨區膠囊被擠到第二行，sticky header 從 61px 漲到 109px（手機視高 13%）。
         *
         * 只縮 gap 不夠（gap-x-4 才省 24px），所以手機同時縮欄間距與區內標籤：
         *   82 ＋「建築」32 ＋「影片」32 ＋ 104 ＋ gap-x-4 48 ＝ 298，留 45px 餘裕。
         * 縮的是**區內**標籤而非跨區膠囊——你已經在 Pokopia 區裡了，區名是冗餘資訊；
         * 「離開這一區」的膠囊反而要講清楚去哪。sm 以上一律還原全名。
         *
         * flex-wrap 留著當保險：日後再加連結塞不下時折成兩行，而不是溢出或壓縮標籤。
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
          <Link
            to="/decks"
            className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full border border-pokopia-tint px-3.5 text-sm font-semibold whitespace-nowrap text-pokopia-ink transition hover:border-pokopia-accent hover:bg-pokopia-highlight"
          >
            牌組攻略
            <span aria-hidden="true">→</span>
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
