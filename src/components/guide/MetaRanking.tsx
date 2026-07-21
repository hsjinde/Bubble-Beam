import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MetaDeck } from "@/data/types";
import { Decklist } from "./Decklist";
import { RankChangeBadge } from "./RankChangeBadge";
import { TierBadge } from "./TierBadge";

function ExpandedList({ deck }: { deck: MetaDeck }) {
  if (!deck.cards) return null;
  return (
    <div id={`deck-cards-${deck.rank}`} className="bg-guide-bg-panel px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {/* 桌面版表格已顯示這些欄位，手機版被隱藏，改在展開區補顯示 */}
        <span className="font-semibold text-guide-ink md:hidden">
          Wilson 下界 {deck.wilsonLowerBoundPct}%・使用率 {deck.sharePct}%・
          {deck.games.toLocaleString()} 場（{deck.record}）
        </span>
        {/* hover 原本是 #5fa8d3（更亮），白字會掉到 2.62:1；改成加深，hover 態才不會比靜態難讀 */}
        {deck.curatedId && (
          <Link
            to="/decks/$deckId"
            params={{ deckId: deck.curatedId }}
            className="inline-flex min-h-11 items-center rounded-full bg-guide-ink px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-guide-ink-deep"
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
                className="underline hover:text-guide-ink"
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
    <div className="overflow-x-auto rounded-xl border border-guide-tint bg-white shadow-sm">
      <table className="w-full text-sm md:min-w-[640px]">
        <thead>
          <tr className="border-b border-guide-tint text-left text-guide-ink">
            <th
              scope="col"
              className="px-2 py-2 font-bold whitespace-nowrap md:px-3"
              title="名次；旁邊是與上次更新相比的變化"
            >
              #
            </th>
            <th scope="col" className="px-2 py-2 font-bold md:px-3">
              Tier
            </th>
            <th scope="col" className="px-2 py-2 font-bold md:px-3">
              牌組
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2 text-right font-bold md:table-cell"
              title="Wilson score 95% 信賴下界"
            >
              Wilson 下界
            </th>
            <th scope="col" className="px-2 py-2 text-right font-bold md:px-3">
              勝率
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-bold md:table-cell">
              使用率
            </th>
            <th scope="col" className="hidden px-3 py-2 text-right font-bold md:table-cell">
              場數 (W-L-T)
            </th>
          </tr>
        </thead>
        <tbody>
          {decks.map((d) => {
            const isExpanded = expanded === d.rank;
            const expandable = !!d.cards;
            return (
              <Fragment key={d.rank}>
                <tr
                  className={`border-b border-guide-bg last:border-0 ${
                    d.tier === "S" ? "bg-guide-bg-highlight" : ""
                  }`}
                >
                  <td className="px-2 py-2 whitespace-nowrap md:px-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-bold text-guide-ink">{d.rank}</span>
                      <RankChangeBadge deck={d} />
                    </span>
                  </td>
                  <td className="px-2 py-2 md:px-3">
                    <TierBadge tier={d.tier} />
                  </td>
                  <td className="px-2 py-2 font-semibold text-slate-700 md:px-3">
                    {expandable ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : d.rank)}
                        aria-expanded={isExpanded}
                        aria-controls={`deck-cards-${d.rank}`}
                        // min-h-11：手機上這是本頁主要互動，原本只有 20px 高
                        className="flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-x-1.5 gap-y-1 text-left text-slate-700 hover:text-guide-ink"
                      >
                        <span>{d.name}</span>
                        {d.curatedId && (
                          <span className="rounded-full bg-guide-tint px-2 py-0.5 text-xs font-semibold text-guide-ink-deep">
                            攻略
                          </span>
                        )}
                        <span aria-hidden="true" className="text-xs text-guide-ink">
                          {isExpanded ? "▲" : "▼"}
                        </span>
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
                  <tr className="border-b border-guide-bg last:border-0">
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
