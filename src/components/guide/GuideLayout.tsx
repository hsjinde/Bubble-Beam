import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-guide-bg">
      <header className="sticky top-0 z-40 border-b border-guide-tint bg-white/90 backdrop-blur">
        {/* py-2 + min-h-11：連結本身撐到 44px 觸控目標，導覽列總高維持在 60px */}
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-lg font-bold text-guide-ink"
          >
            Piplup!
          </Link>
          <Link
            to="/decks"
            className="inline-flex min-h-11 items-center font-semibold text-guide-ink hover:underline [&.active]:underline"
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
