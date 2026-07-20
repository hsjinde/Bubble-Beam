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
        <h1 className="text-2xl font-bold text-[#2a6f97]">找不到這套牌</h1>
        <p className="mt-2 text-slate-600">它可能已被移除或網址打錯了。</p>
        <Link to="/decks" className="mt-4 inline-block font-semibold text-[#2a6f97] underline">
          ← 回牌組列表
        </Link>
      </GuideLayout>
    );
  }

  return (
    <GuideLayout>
      <Link to="/decks" className="text-sm font-semibold text-[#2a6f97]/70 hover:text-[#2a6f97]">
        ← 回牌組列表
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <TierBadge tier={deck.tier} />
        <h1 className="text-2xl font-bold text-[#2a6f97] sm:text-3xl">{deck.name}</h1>
        <span className="flex gap-1">
          {deck.energy.map((e) => (
            <EnergyIcon key={e} type={e} />
          ))}
        </span>
        <span className="rounded-full bg-[#bfe3f5] px-3 py-0.5 text-sm font-semibold text-[#2a6f97]">
          難度：{deck.difficulty}
        </span>
      </div>
      <p className="mt-3 text-slate-600">{deck.summary}</p>

      <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">牌表（20 張）</h2>
      <div className="mt-4">
        <Decklist cards={deck.cards} />
      </div>

      <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">打法攻略</h2>
      <Strategy text={deck.strategy} />

      {deck.matchups && deck.matchups.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">對戰思路</h2>
          <div className="mt-3 space-y-3">
            {deck.matchups.map((m) => (
              <div key={m.vs} className="rounded-lg border border-[#bfe3f5] bg-white p-4">
                <div className="font-bold text-[#2a6f97]">vs {m.vs}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{m.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </GuideLayout>
  );
}
