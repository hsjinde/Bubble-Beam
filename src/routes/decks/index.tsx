import { createFileRoute } from "@tanstack/react-router";
import { listDecks } from "@/data/decks";
import { formatSnapshotDate, getMeta } from "@/data/meta";
import { DIFFICULTIES, ENERGY_TYPES, META_TIER_ORDER, TIER_ORDER } from "@/data/types";
import type { DecksSearch } from "@/components/guide/useDecksSearch";
import { CuratedDecks } from "@/components/guide/CuratedDecks";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { MetaRanking } from "@/components/guide/MetaRanking";
import { NextSetBanner } from "@/components/guide/NextSetBanner";
import { SectionHeading } from "@/components/guide/SectionHeading";
import { absoluteUrl } from "@/lib/site";
import { breadcrumbList, jsonLdScript } from "@/lib/json-ld";

/** 只留白名單內的值，其餘丟掉。外部貼進來的 `?tier=XYZ` 不該讓清單變成 0 筆。 */
function keepKnown(raw: unknown, allowed: readonly string[]): string | undefined {
  if (typeof raw !== "string") return undefined;
  const ok = new Set(allowed);
  const kept = allowed.filter((v) => raw.split(",").includes(v) && ok.has(v));
  return kept.length ? kept.join(",") : undefined;
}

function keepText(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  // 上限 100 字：搜尋框本來就不該吃下整篇文章，也擋掉塞爆網址的玩法
  const t = raw.trim().slice(0, 100);
  return t === "" ? undefined : t;
}

export const Route = createFileRoute("/decks/")({
  /*
   * 篩選狀態存在網址裡（見 useDecksSearch 的說明）。這裡負責「消毒」：
   * 未知的 tier／屬性／難度直接丟掉並重新照正規順序拼回去，所以不管使用者貼進來
   * 什麼，網址與元件看到的都是同一組乾淨的值。回 undefined 的參數會整個從網址消失。
   */
  validateSearch: (raw: Record<string, unknown>): DecksSearch => ({
    q: keepText(raw.q),
    tier: keepKnown(raw.tier, META_TIER_ORDER),
    cq: keepText(raw.cq),
    ctier: keepKnown(raw.ctier, TIER_ORDER),
    cenergy: keepKnown(raw.cenergy, ENERGY_TYPES),
    cdiff: keepKnown(raw.cdiff, DIFFICULTIES),
  }),
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
      <NextSetBanner />
      <h1 className="text-2xl font-bold text-guide-ink sm:text-3xl">TCG Pocket 環境排行榜</h1>
      <p className="mt-2 text-guide-ink-muted">
        本排行榜整合 Limitless 大賽統計數據，採用 95% Wilson
        信賴區間下界進行名次排序，精準校正小樣本帶來的勝率偏差，真實反映牌組的客觀實力與穩定度。帶有連結的牌組附有詳細攻略。資料更新日期：
        {formatSnapshotDate(meta.fetchedAt)}
        {meta.previousFetchedAt
          ? `；「名次變動」與 ${formatSnapshotDate(meta.previousFetchedAt)} 的排行相比。`
          : "。"}
      </p>

      {/*
        排序方法的說明原本只活在「WILSON 下界」那個表頭的 title 屬性裡——而那一欄
        是 hidden md:table-cell，手機根本看不到那顆表頭，也就永遠看不到解釋；title
        本來也只有滑鼠停留才會出現，觸控與鍵盤使用者拿不到。
        改成 <details>：預設收合不佔版面，但任何裝置都打得開，也進得了搜尋與翻譯。
      */}
      <details className="mt-3 rounded-xl border border-guide-tint bg-guide-surface/70 px-4 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-guide-ink">
          為什麼不直接照勝率排？
        </summary>
        <div className="pb-4 text-guide-ink-body">
          <p className="leading-relaxed">
            因為場數少的牌組勝率會亂跳。打 10 場贏 7 場是 70%，但這個數字很可能只是運氣；打 1,000
            場贏 550 場只有 55%，卻扎實得多。直接照勝率排，榜首往往會是只打了幾十場的冷門牌。
          </p>
          <p className="mt-2 leading-relaxed">
            Wilson 下界的做法是：在 95% 的信心水準下，這套牌的真實勝率「至少」有多少。場數越少，
            這個下界就被壓得越低——不是懲罰，而是誠實反映「我們還不確定」。所以榜上你會看到勝率較低
            但場數多的牌組，排在勝率漂亮卻只有兩百場的牌組前面。
          </p>
          <p className="mt-2 leading-relaxed text-guide-ink-muted">
            表格裡的迷你長條有一條白色參考線，標的是 50% 正負勝率分界；線的左邊代表這套牌在 95%
            信心下仍可能是負勝率。
          </p>
        </div>
      </details>

      <div className="mt-6">
        <MetaRanking decks={meta.decks} />
      </div>

      <section className="mt-10">
        <SectionHeading>精選牌組攻略</SectionHeading>
        <p className="mt-4 text-sm text-guide-ink-muted">人工整理的完整牌表、打法與對戰思路。</p>
        <CuratedDecks decks={curated} />
      </section>
    </GuideLayout>
  );
}
