import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MetaDeck, MetaTier } from "@/data/types";
import { Decklist } from "./Decklist";
import { RankChangeBadge } from "./RankChangeBadge";
import { TierBadge } from "./TierBadge";

/**
 * 迷你數據條：把窄值域的數字差異視覺化。value/min/max 定義尺標，marker 畫一條
 * 參考線（Wilson 下界用來標 50% 正負勝率分界，放大排名差異的同時守住統計誠實）。
 * aria-hidden：數字本身已提供給螢幕報讀者，條只是視覺輔助、不重複報讀。
 * 顏色走品牌藍系（軌道 guide-tint／填充 guide-ink），不碰 tier／屬性／漲跌色域。
 */
function StatBar({
  value,
  min,
  max,
  marker,
}: {
  value: number;
  min: number;
  max: number;
  marker?: number;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const pct = clamp(((value - min) / (max - min)) * 100);
  const markerPct = marker != null ? clamp(((marker - min) / (max - min)) * 100) : null;
  return (
    <div
      className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-guide-tint/70"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-guide-accent to-guide-ink transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
      {markerPct != null && (
        // 白線＋深藍描邊：在深藍填充（≥50%）與淺藍軌道（<50%）兩種背景都清楚
        <div
          className="absolute inset-y-0 w-px bg-white shadow-[0_0_0_0.5px_rgba(29,82,115,0.55)]"
          style={{ left: `${markerPct}%` }}
        />
      )}
    </div>
  );
}

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

const TIER_ORDER: MetaTier[] = ["S", "A", "B", "C", "D"];

export function MetaRanking({ decks }: { decks: MetaDeck[] }) {
  const [tierFilter, setTierFilter] = useState<MetaTier | "all">("all");
  // Set 支援多列同時展開＋一鍵全展開（power user 並排比較牌表），取代原本單一展開。
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  // 使用率條的尺標上界：取本批最大使用率，讓熱度差（可達 ~29 倍）撐滿條寬。
  const maxShare = Math.max(...decks.map((d) => d.sharePct), 0.01);

  const availableTiers = TIER_ORDER.filter((t) => decks.some((d) => d.tier === t));
  const visibleDecks = tierFilter === "all" ? decks : decks.filter((d) => d.tier === tierFilter);
  const expandableRanks = visibleDecks.filter((d) => d.cards).map((d) => d.rank);
  const allExpanded =
    expandableRanks.length > 0 && expandableRanks.every((r) => expandedRows.has(r));

  const toggleRow = (rank: number) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rank)) next.delete(rank);
      else next.add(rank);
      return next;
    });
  const toggleAll = () => setExpandedRows(allExpanded ? new Set() : new Set(expandableRanks));

  return (
    <div>
      {/* 控制列：Tier 篩選（單選）＋ 展開全部。次要輔助控制，min-h-9 密集但仍可觸控。 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-guide-ink">Tier</span>
        {(["all", ...availableTiers] as const).map((t) => {
          const active = tierFilter === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => setTierFilter(t)}
              className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                active
                  ? "bg-guide-ink text-white shadow-sm"
                  : "border border-guide-tint bg-white text-guide-ink hover:border-guide-accent"
              }`}
            >
              {t === "all" ? "全部" : t}
            </button>
          );
        })}
        <button
          type="button"
          onClick={toggleAll}
          disabled={expandableRanks.length === 0}
          className="ml-auto min-h-9 rounded-full border border-guide-tint bg-white px-3.5 text-sm font-semibold text-guide-ink transition hover:border-guide-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {allExpanded ? "收合全部" : "展開全部"}
        </button>
      </div>
      {/* 篩選結果宣告給螢幕報讀者（Sam persona：狀態變化要被 announce） */}
      <p className="sr-only" aria-live="polite">
        顯示 {visibleDecks.length} 套牌組{tierFilter !== "all" ? `（Tier ${tierFilter}）` : ""}
      </p>

      <div className="overflow-x-auto rounded-xl border border-guide-tint bg-white shadow-sm">
        <table className="w-full text-sm md:min-w-[640px]">
          <thead>
            <tr className="border-b border-guide-tint bg-gradient-to-b from-slate-50 to-guide-bg/40 text-left text-guide-ink">
              <th
                scope="col"
                className="px-2 py-2.5 font-bold whitespace-nowrap text-xs tracking-wider md:px-3"
                title="名次；旁邊是與上次更新相比的變化"
              >
                #
              </th>
              <th scope="col" className="px-2 py-2.5 font-bold text-xs tracking-wider md:px-3">
                TIER
              </th>
              <th scope="col" className="px-2 py-2.5 font-bold text-xs tracking-wider md:px-3">
                牌組
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-bold text-xs tracking-wider md:table-cell"
                title="Wilson score 95% 信賴下界"
              >
                WILSON 下界
              </th>
              <th
                scope="col"
                className="px-2 py-2.5 text-right font-bold text-xs tracking-wider md:px-3"
              >
                勝率
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-bold text-xs tracking-wider md:table-cell"
              >
                使用率
              </th>
              <th
                scope="col"
                className="hidden px-3 py-2.5 text-right font-bold text-xs tracking-wider md:table-cell"
              >
                場數 (W-L-T)
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleDecks.map((d) => {
              const isExpanded = expandedRows.has(d.rank);
              const expandable = !!d.cards;
              return (
                <Fragment key={d.rank}>
                  <tr
                    className={`border-b border-guide-bg transition-colors duration-150 hover:bg-guide-bg-highlight/80 last:border-0 ${
                      d.tier === "S" ? "bg-guide-bg-highlight/90" : ""
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
                          onClick={() => toggleRow(d.rank)}
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
                    <td className="hidden px-3 py-2 md:table-cell">
                      <div className="ml-auto flex w-24 flex-col items-end">
                        <span className="font-semibold text-slate-700">
                          {d.wilsonLowerBoundPct}%
                        </span>
                        <StatBar value={d.wilsonLowerBoundPct} min={45} max={55} marker={50} />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600 md:px-3">{d.winratePct}%</td>
                    <td className="hidden px-3 py-2 md:table-cell">
                      <div className="ml-auto flex w-20 flex-col items-end">
                        <span className="text-slate-600">{d.sharePct}%</span>
                        <StatBar value={d.sharePct} min={0} max={maxShare} />
                      </div>
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
    </div>
  );
}
