import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef7fc]">
      <header className="sticky top-0 z-40 border-b border-[#bfe3f5] bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-[#2a6f97]">
            Piplup!
          </Link>
          <Link
            to="/decks"
            className="font-semibold text-[#2a6f97]/80 hover:text-[#2a6f97] [&.active]:text-[#2a6f97] [&.active]:underline"
          >
            牌組攻略
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-[#2a6f97]/60">
        非官方粉絲攻略站。卡牌資料與卡圖來自社群資料庫（flibustier/pokemon-tcg-pocket-database）；Pokémon
        相關權利屬於其權利人。
      </footer>
    </div>
  );
}
