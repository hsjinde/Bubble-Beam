import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MetaDeck } from "@/data/types";
import { Decklist } from "./Decklist";
import { TierBadge } from "./TierBadge";

/** 重建 Limitless「Open as Image」的 POST 表單（imggen 只吃 POST，無法直連圖片）。 */
function ImggenButton({ deck }: { deck: MetaDeck }) {
  if (!deck.cards) return null;
  const payload = JSON.stringify(
    deck.cards.map(({ count, name, set, number }) => ({ count, name, set, number })),
  );
  return (
    <form
      action="https://pocket.limitlesstcg.com/tools/imggen"
      method="post"
      target="_blank"
      className="inline"
    >
      <input type="hidden" name="input" value={payload} />
      <button
        type="submit"
        className="rounded-full border border-[#5fa8d3] bg-white px-3 py-1 text-xs font-semibold text-[#2a6f97] shadow-sm transition hover:bg-[#eef7fc]"
      >
        在 Limitless 以圖片開啟 ↗
      </button>
    </form>
  );
}

function ExpandedList({ deck }: { deck: MetaDeck }) {
  if (!deck.cards) return null;
  return (
    <div className="bg-[#f8fcff] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          代表牌表（取自該牌組最近的最佳賽績）
          {deck.listSource && (
            <>
              ・
              <a
                href={deck.listSource}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#2a6f97]"
              >
                牌表來源
              </a>
            </>
          )}
        </span>
        <ImggenButton deck={deck} />
      </div>
      <Decklist cards={deck.cards.map(({ id, count }) => ({ id, count }))} />
    </div>
  );
}

export function MetaRanking({ decks }: { decks: MetaDeck[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#bfe3f5] bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-[#bfe3f5] text-left text-[#2a6f97]">
            <th className="px-3 py-2 font-bold">#</th>
            <th className="px-3 py-2 font-bold">Tier</th>
            <th className="px-3 py-2 font-bold">牌組</th>
            <th className="px-3 py-2 text-right font-bold" title="Wilson score 95% 信賴下界">
              Wilson 下界
            </th>
            <th className="px-3 py-2 text-right font-bold">勝率</th>
            <th className="px-3 py-2 text-right font-bold">使用率</th>
            <th className="px-3 py-2 text-right font-bold">場數 (W-L-T)</th>
          </tr>
        </thead>
        <tbody>
          {decks.map((d) => {
            const isExpanded = expanded === d.rank;
            const expandable = !d.curatedId && !!d.cards;
            return (
              <Fragment key={d.rank}>
                <tr
                  className={`border-b border-[#eef7fc] last:border-0 ${
                    d.tier === "S" ? "bg-[#f4fbff]" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-bold text-[#2a6f97]">{d.rank}</td>
                  <td className="px-3 py-2">
                    <TierBadge tier={d.tier} />
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-700">
                    {d.curatedId ? (
                      <Link
                        to="/decks/$deckId"
                        params={{ deckId: d.curatedId }}
                        className="text-[#2a6f97] underline decoration-[#5fa8d3] underline-offset-2 hover:text-[#5fa8d3]"
                        title="有完整攻略，點擊查看"
                      >
                        {d.name}
                      </Link>
                    ) : expandable ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : d.rank)}
                        className="cursor-pointer text-left text-slate-700 hover:text-[#2a6f97]"
                        title="點擊展開牌表"
                      >
                        {d.name}{" "}
                        <span className="text-xs text-[#5fa8d3]">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                    ) : (
                      d.name
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">
                    {d.wilsonLowerBoundPct}%
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">{d.winratePct}%</td>
                  <td className="px-3 py-2 text-right text-slate-600">{d.sharePct}%</td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {d.games.toLocaleString()} ({d.record})
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-[#eef7fc] last:border-0">
                    <td colSpan={7} className="p-0">
                      <ExpandedList deck={d} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
