import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MetaDeck } from "@/data/types";
import { Decklist } from "./Decklist";
import { TierBadge } from "./TierBadge";

function ExpandedList({ deck }: { deck: MetaDeck }) {
  if (!deck.cards) return null;
  return (
    <div className="bg-[#f8fcff] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {deck.curatedId && (
          <Link
            to="/decks/$deckId"
            params={{ deckId: deck.curatedId }}
            className="rounded-full bg-[#2a6f97] px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5fa8d3]"
          >
            查看完整攻略 →
          </Link>
        )}
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
            const expandable = !!d.cards;
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
                    {expandable ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : d.rank)}
                        className="cursor-pointer text-left text-slate-700 hover:text-[#2a6f97]"
                        title="點擊展開牌表"
                      >
                        {d.name}{" "}
                        {d.curatedId && (
                          <span className="mr-1 rounded-full bg-[#bfe3f5] px-2 py-0.5 text-xs font-semibold text-[#2a6f97]">
                            攻略
                          </span>
                        )}
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
