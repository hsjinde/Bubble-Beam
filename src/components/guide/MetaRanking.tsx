import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MetaDeck } from "@/data/types";
import { Decklist } from "./Decklist";
import { RankChangeBadge } from "./RankChangeBadge";
import { TierBadge } from "./TierBadge";

function ExpandedList({ deck }: { deck: MetaDeck }) {
  if (!deck.cards) return null;
  return (
    <div className="bg-[#f8fcff] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {/* 桌面版表格已顯示這些欄位，手機版被隱藏，改在展開區補顯示 */}
        <span className="font-semibold text-[#2a6f97] md:hidden">
          Wilson 下界 {deck.wilsonLowerBoundPct}%・使用率 {deck.sharePct}%・
          {deck.games.toLocaleString()} 場（{deck.record}）
        </span>
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
      <table className="w-full text-sm md:min-w-[640px]">
        <thead>
          <tr className="border-b border-[#bfe3f5] text-left text-[#2a6f97]">
            <th className="px-2 py-2 font-bold md:px-3">#</th>
            <th
              className="px-1 py-2 font-bold whitespace-nowrap md:px-2"
              title="與上次更新相比的名次變化"
            >
              變化
            </th>
            <th className="px-2 py-2 font-bold md:px-3">Tier</th>
            <th className="px-2 py-2 font-bold md:px-3">牌組</th>
            <th
              className="hidden px-3 py-2 text-right font-bold md:table-cell"
              title="Wilson score 95% 信賴下界"
            >
              Wilson 下界
            </th>
            <th className="px-2 py-2 text-right font-bold md:px-3">勝率</th>
            <th className="hidden px-3 py-2 text-right font-bold md:table-cell">使用率</th>
            <th className="hidden px-3 py-2 text-right font-bold md:table-cell">場數 (W-L-T)</th>
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
                  <td className="px-2 py-2 font-bold text-[#2a6f97] md:px-3">{d.rank}</td>
                  <td className="px-1 py-2 whitespace-nowrap md:px-2">
                    <RankChangeBadge deck={d} />
                  </td>
                  <td className="px-2 py-2 md:px-3">
                    <TierBadge tier={d.tier} />
                  </td>
                  <td className="px-2 py-2 font-semibold text-slate-700 md:px-3">
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
                  <td className="hidden px-3 py-2 text-right font-semibold text-slate-700 md:table-cell">
                    {d.wilsonLowerBoundPct}%
                  </td>
                  <td className="px-2 py-2 text-right text-slate-600 md:px-3">{d.winratePct}%</td>
                  <td className="hidden px-3 py-2 text-right text-slate-600 md:table-cell">
                    {d.sharePct}%
                  </td>
                  <td className="hidden px-3 py-2 text-right text-slate-500 md:table-cell">
                    {d.games.toLocaleString()} ({d.record})
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-[#eef7fc] last:border-0">
                    <td colSpan={8} className="p-0">
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
