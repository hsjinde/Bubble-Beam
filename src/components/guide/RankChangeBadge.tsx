import type { MetaDeck } from "@/data/types";
import { getRankChange } from "@/data/meta";

/**
 * 排名變化：上升／下降／持平／新進榜。狀態同時用形狀（▲▼—新）與顏色表示，
 * 不單靠顏色區分，色盲或單色列印也讀得出來。
 */
export function RankChangeBadge({ deck }: { deck: MetaDeck }) {
  const { state, delta, previousRank } = getRankChange(deck);

  if (state === "unknown") {
    // 沒有前一份快照可比對，留白（不要顯示成持平或新進榜）
    return <span className="sr-only">排名變化未知</span>;
  }

  if (state === "new") {
    return (
      <span
        className="inline-flex items-center rounded-full bg-[#2a6f97] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
        title="新進榜：上次更新時不在榜上"
      >
        新
      </span>
    );
  }

  if (state === "same") {
    return (
      <span
        className="inline-flex items-center text-xs font-semibold text-slate-300"
        title={`持平：與上次更新同為第 ${previousRank} 名`}
      >
        —<span className="sr-only">持平</span>
      </span>
    );
  }

  const up = state === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
        up ? "text-emerald-600" : "text-rose-500"
      }`}
      title={`${up ? "上升" : "下降"} ${delta} 名（上次第 ${previousRank} 名）`}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "上升" : "下降"}</span>
      {delta}
    </span>
  );
}
