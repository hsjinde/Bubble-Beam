import { Link, createFileRoute } from "@tanstack/react-router";
import { getDeck, getDeckByName } from "@/data/decks";
import { getCard } from "@/data/cards";
import { getHeroCardId } from "@/data/hero-card";
import { absoluteUrl } from "@/lib/site";
import { breadcrumbList, jsonLdScript } from "@/lib/json-ld";
import { CopyDecklist } from "@/components/guide/CopyDecklist";
import { Decklist } from "@/components/guide/Decklist";
import { EnergyIcon } from "@/components/guide/EnergyIcon";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { TierBadge } from "@/components/guide/TierBadge";

export const Route = createFileRoute("/decks/$deckId")({
  head: ({ params }) => {
    const deck = getDeck(params.deckId);
    if (!deck) {
      // 不存在的 slug 不該被索引，否則打錯的網址會進 SERP
      return {
        meta: [{ title: "找不到牌組 — Piplup!" }, { name: "robots", content: "noindex" }],
      };
    }
    // 每頁自己的分享卡片：__root 只提供 og:site_name／og:image／og:locale 那類全站值，
    // og:title／og:description 不覆寫的話 21 頁攻略會共用同一張卡片。
    const title = `${deck.name} 牌組攻略 — Piplup!`;
    const description = `${deck.summary}Tier ${deck.tier}・難度${deck.difficulty}，附完整 20 張牌表、打法攻略與對戰思路。`;
    // 用 deck.id 而非 params.deckId：canonical 要指向正規化後的網址
    const canonical = absoluteUrl(`/decks/${deck.id}`);
    const hero = getCard(getHeroCardId(deck));
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        // 覆寫 __root 的 website：攻略頁是文章而非站台首頁
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        /*
         * 用該牌組的門面卡圖當分享圖，而不是全站共用的波加曼。查不到卡時整組省略，
         * 讓 __root 的全站圖遞補——寧可退回通用圖，也不要送出壞掉的圖片網址。
         * 卡圖是 63:88 直式，塞進 summary_large_image 的 1.91:1 會被裁掉頭尾，
         * 所以這裡把 twitter:card 降成 summary（小方圖，直式卡完整顯示）。
         */
        ...(hero
          ? [
              { property: "og:image", content: hero.imageUrl },
              { property: "og:image:alt", content: `${hero.nameTC ?? hero.nameEN} 卡圖` },
              { name: "twitter:card", content: "summary" },
              { name: "twitter:image", content: hero.imageUrl },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      /*
       * 只放 BreadcrumbList。原本考慮加 Article，但 Google 的 Article 複合式搜尋結果
       * 需要 author 與 datePublished，而策展攻略沒有逐篇的作者與發佈時間——
       * 與其填假值，不如不宣告。麵包屑的資料是真的，也是這類頁面實際拿得到的結果。
       */
      scripts: [
        jsonLdScript(
          breadcrumbList([
            { name: "首頁", url: absoluteUrl("/") },
            { name: "牌組攻略", url: absoluteUrl("/decks") },
            { name: deck.name, url: canonical },
          ]),
        ),
      ],
    };
  },
  component: DeckDetailPage,
});

/** 段落以空行分隔；"- " 開頭的連續行渲染為列點清單。 */
function Strategy({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((block, i) =>
        block.trimStart().startsWith("- ") ? (
          <ul key={i} className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
            {block.split("\n").map((line, j) => (
              <li key={j}>{line.replace(/^- /, "")}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mt-3 leading-relaxed text-slate-700">
            {block}
          </p>
        ),
      )}
    </>
  );
}

function DeckDetailPage() {
  const { deckId } = Route.useParams();
  const deck = getDeck(deckId);

  if (!deck) {
    return (
      <GuideLayout>
        <h1 className="text-2xl font-bold text-guide-ink">找不到這套牌</h1>
        <p className="mt-2 text-slate-600">它可能已被移除或網址打錯了。</p>
        <Link to="/decks" className="mt-4 inline-block font-semibold text-guide-ink underline">
          ← 回牌組列表
        </Link>
      </GuideLayout>
    );
  }

  return (
    <GuideLayout>
      <Link
        to="/decks"
        className="inline-flex items-center text-sm font-semibold text-guide-ink-deep hover:text-guide-ink"
      >
        ← 回牌組列表
      </Link>

      <div className="mt-4 rounded-2xl border border-guide-tint bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <TierBadge tier={deck.tier} />
          {/* font-bold 而非 extrabold：全站唯一一處 800 字重，為它多載一整個字重不划算 */}
          <h1 className="text-2xl font-bold text-guide-ink sm:text-3xl">{deck.name}</h1>
          <span className="flex gap-1.5">
            {deck.energy.map((e) => (
              <EnergyIcon key={e} type={e} />
            ))}
          </span>
          <span className="rounded-full border border-guide-accent/30 bg-guide-tint/80 px-3 py-0.5 text-xs font-bold text-guide-ink-deep">
            難度：{deck.difficulty}
          </span>
        </div>
        <p className="mt-4 text-base leading-relaxed text-slate-700">{deck.summary}</p>
      </div>

      <h2 className="mt-10 border-l-4 border-guide-accent pl-3 text-xl font-bold text-guide-ink">
        牌表（20 張）
      </h2>
      <div className="mt-3">
        <CopyDecklist cards={deck.cards} deckName={deck.name} />
      </div>
      <div className="mt-4">
        <Decklist cards={deck.cards} />
      </div>

      <h2 className="mt-10 border-l-4 border-guide-accent pl-3 text-xl font-bold text-guide-ink">
        打法攻略
      </h2>
      <div className="mt-2 rounded-xl border border-guide-tint/50 bg-white/70 p-5">
        <Strategy text={deck.strategy} />
      </div>

      {deck.matchups && deck.matchups.length > 0 && (
        <>
          <h2 className="mt-10 border-l-4 border-guide-accent pl-3 text-xl font-bold text-guide-ink">
            對戰思路
          </h2>
          <div className="mt-4 space-y-3.5">
            {deck.matchups.map((m) => {
              // 對手若也有策展攻略就連過去。63 筆目前 100% 對得上，但打錯字或
              // 提到尚未策展的牌組時會落空——那時退成純文字，不要渲染死連結。
              const opponent = getDeckByName(m.vs);
              return (
                <div
                  key={m.vs}
                  className="rounded-xl border border-guide-tint bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-guide-tint px-2.5 py-0.5 text-xs font-bold text-guide-ink-deep">
                      VS
                    </span>
                    {/*
                      底線不指定顏色＝跟著 currentColor（guide-ink，5.5:1）。
                      原本用 decoration-guide-accent 只有 2.62:1，
                      而底線正是「這是連結」的視覺訊號，不該比文字更難看見。
                    */}
                    {opponent ? (
                      <Link
                        to="/decks/$deckId"
                        params={{ deckId: opponent.id }}
                        className="inline-flex min-h-11 items-center gap-1 text-base font-bold text-guide-ink underline underline-offset-4"
                      >
                        {m.vs}
                        <span aria-hidden="true" className="text-xs">
                          →
                        </span>
                      </Link>
                    ) : (
                      <span className="text-base font-bold text-guide-ink">{m.vs}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{m.note}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </GuideLayout>
  );
}
