import { createFileRoute } from "@tanstack/react-router";
import { listDecks } from "@/data/decks";
import { getMeta } from "@/data/meta";
import { DeckCard } from "@/components/guide/DeckCard";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { MetaRanking } from "@/components/guide/MetaRanking";
import { absoluteUrl } from "@/lib/site";
import { breadcrumbList, jsonLdScript } from "@/lib/json-ld";

export const Route = createFileRoute("/decks/")({
  head: () => {
    // 數字從資料算，不要硬編——牌組增減時描述才不會默默過期
    const meta = getMeta();
    const topN = meta.decks.length;
    const curatedCount = listDecks().length;
    const title = "TCG Pocket 環境排行榜 — Piplup!";
    const canonical = absoluteUrl("/decks");
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Pokémon TCG Pocket 即時環境 Top ${topN} 排行榜：依 Limitless 賽事數據以 Wilson score 下界排序，附 ${curatedCount} 套繁中牌組攻略與完整牌表。`,
        },
        // 不覆寫的話這頁會沿用 __root 的通用分享卡片
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `依 Limitless 賽事數據排序的即時 Top ${topN} 環境排行榜，附 ${curatedCount} 套繁中牌組攻略與完整牌表。`,
        },
        { property: "og:url", content: canonical },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        jsonLdScript(
          breadcrumbList([
            { name: "首頁", url: absoluteUrl("/") },
            { name: "牌組攻略", url: canonical },
          ]),
        ),
        // 這頁本體就是一份排名清單，ItemList 是誠實的描述。只有帶攻略的列給 url，
        // 其餘僅列名次與名稱——沒有對應頁面就不要編一個出來。
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Pokémon TCG Pocket 環境排行榜",
          description: "依 Limitless 賽事數據以 Wilson score 95% 信賴下界排序。",
          numberOfItems: topN,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: meta.decks.map((d) => ({
            "@type": "ListItem",
            position: d.rank,
            name: d.name,
            ...(d.curatedId ? { url: absoluteUrl(`/decks/${d.curatedId}`) } : {}),
          })),
        }),
      ],
    };
  },
  component: DecksPage,
});

function DecksPage() {
  const meta = getMeta();
  const curated = listDecks();

  return (
    <GuideLayout>
      <h1 className="text-2xl font-bold text-guide-ink sm:text-3xl">TCG Pocket 環境排行榜</h1>
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
        <h2 className="text-xl font-bold text-guide-ink">精選牌組攻略</h2>
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
