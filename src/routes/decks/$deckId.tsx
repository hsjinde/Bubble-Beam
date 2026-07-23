import { Link, createFileRoute } from "@tanstack/react-router";
import { getDeck } from "@/data/decks";
import { Decklist } from "@/components/guide/Decklist";
import { EnergyIcon } from "@/components/guide/EnergyIcon";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { TierBadge } from "@/components/guide/TierBadge";

export const Route = createFileRoute("/decks/$deckId")({
  head: ({ params }) => {
    const deck = getDeck(params.deckId);
    return {
      meta: [{ title: deck ? `${deck.name} — 牌組攻略` : "找不到牌組" }],
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
          <h1 className="text-2xl font-extrabold text-guide-ink sm:text-3xl">{deck.name}</h1>
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
            {deck.matchups.map((m) => (
              <div
                key={m.vs}
                className="rounded-xl border border-guide-tint bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-guide-tint px-2.5 py-0.5 text-xs font-bold text-guide-ink-deep">
                    VS
                  </span>
                  <span className="text-base font-bold text-guide-ink">{m.vs}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{m.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </GuideLayout>
  );
}
