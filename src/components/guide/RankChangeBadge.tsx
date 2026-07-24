import type { MetaDeck } from "@/data/types";
import { getRankChange } from "@/data/meta";

/**
 * 排名變化：上升／下降／持平／新進榜。狀態同時用形狀（▲▼—新）與顏色表示，
 * 不單靠顏色區分，色盲或單色列印也讀得出來。
 *
 * 上升／下降加上淺色底做成藥丸狀，跟名次數字並排時才不會兩串文字黏在一起分不清。
 *
 * 色值全部住在 styles.css 的 --rank-* token（分淺／深兩套），量測基準也寫在那裡。
 * 這裡不要再硬編十六進位——曾經硬編過，代價是兩個 bug：
 * 1. 假設「藥丸底接近白色，沿用已驗證的白底文字色即可」。實測是錯的：#e30041 在白底
 *    4.84，在藥丸底 #fce7ec 只剩 4.09（11px 文字需要 4.5:1）。
 * 2. 硬編的淺色藥丸底在深色模式原樣保留，變成整頁唯一的亮色塊。
 * 原本更早的版本用 text-emerald-600／text-rose-500／text-slate-300，只有 3.49／3.59／1.42。
 */
const CHANGE_INK = {
  up: "var(--rank-up-ink)",
  down: "var(--rank-down-ink)",
  same: "var(--rank-same-ink)",
} as const;
const CHANGE_BG = {
  up: "var(--rank-up-bg)",
  down: "var(--rank-down-bg)",
} as const;
export function RankChangeBadge({ deck }: { deck: MetaDeck }) {
  const { state, delta, previousRank } = getRankChange(deck);

  if (state === "unknown") {
    // 沒有前一份快照可比對，留白（不要顯示成持平或新進榜）
    return <span className="sr-only">排名變化未知</span>;
  }

  if (state === "new") {
    return (
      <span
        className="inline-flex items-center rounded-full bg-guide-ink px-1.5 py-0.5 text-[10px] font-bold text-guide-on-ink shadow-sm"
        title="新進榜：上次更新時不在榜上"
      >
        新
      </span>
    );
  }

  if (state === "same") {
    return (
      <span
        className="inline-flex items-center text-xs font-semibold"
        style={{ color: CHANGE_INK.same }}
        title={`持平：與上次更新同為第 ${previousRank} 名`}
      >
        —<span className="sr-only">持平</span>
      </span>
    );
  }

  const up = state === "up";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
      style={{
        color: up ? CHANGE_INK.up : CHANGE_INK.down,
        backgroundColor: up ? CHANGE_BG.up : CHANGE_BG.down,
      }}
      title={`${up ? "上升" : "下降"} ${delta} 名（上次第 ${previousRank} 名）`}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "上升" : "下降"}</span>
      {delta}
    </span>
  );
}
