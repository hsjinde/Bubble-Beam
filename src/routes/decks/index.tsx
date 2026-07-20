import { createFileRoute } from "@tanstack/react-router";
import { listDecks } from "@/data/decks";
import { getMeta } from "@/data/meta";
import { DeckCard } from "@/components/guide/DeckCard";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { MetaRanking } from "@/components/guide/MetaRanking";

export const Route = createFileRoute("/decks/")({
  head: () => ({
    meta: [
      { title: "環境排行榜 — Piplup! TCG Pocket" },
      {
        name: "description",
        content: "Pokémon TCG Pocket 即時環境 Top 20 排行榜（Wilson score）與精選牌組攻略。",
      },
    ],
  }),
  component: DecksPage,
});

function DecksPage() {
  const meta = getMeta();
  const curated = listDecks();

  return (
    <GuideLayout>
      <h1 className="text-2xl font-bold text-[#2a6f97] sm:text-3xl">TCG Pocket 環境排行榜</h1>
      <p className="mt-2 text-slate-600">
        依 Limitless 賽事數據以 Wilson score 95% 下界排序的 Top {meta.decks.length}
        ：小樣本的極端勝率會被往下修正，名次反映「有統計信心的最低實力」。帶連結的牌組有完整攻略。資料日期：
        {meta.fetchedAt.slice(0, 10)}
        {meta.previousFetchedAt
          ? `；「變化」欄與 ${meta.previousFetchedAt.slice(0, 10)} 的排行相比。`
          : "。"}
      </p>

      <div className="mt-6">
        <MetaRanking decks={meta.decks} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[#2a6f97]">精選牌組攻略</h2>
        <p className="mt-1 text-sm text-slate-600">人工整理的完整牌表、打法與對戰思路。</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {curated.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </GuideLayout>
  );
}
