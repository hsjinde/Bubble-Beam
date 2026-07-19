import { Link } from "@tanstack/react-router";
import type { MetaDeck } from "@/data/types";
import { TierBadge } from "./TierBadge";

export function MetaRanking({ decks }: { decks: MetaDeck[] }) {
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
          {decks.map((d) => (
            <tr
              key={d.rank}
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
                    title="有攻略，點擊查看"
                  >
                    {d.name}
                  </Link>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
