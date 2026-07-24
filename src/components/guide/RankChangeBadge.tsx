import type { MetaDeck } from "@/data/types";
import { getRankChange } from "@/data/meta";

/**
 * 排名變化：上升／下降／持平／新進榜。狀態同時用形狀（▲▼—新）與顏色表示，
 * 不單靠顏色區分，色盲或單色列印也讀得出來。
 *
 * 顏色是同色相壓深後的值，一般列（#ffffff）與 Tier S 列（#f4fbff）都 ≥4.5:1。
 * 原本用 text-emerald-600／text-rose-500／text-slate-300 只有 3.49／3.59／1.42。
 * 換色時兩種列背景都要重算。
 *
 * 色彩採華語圈慣例（漲紅跌綠），與歐美股市紅跌綠漲相反。
 *
 * 上升／下降加上極淺色底做成藥丸狀，跟名次數字並排時才不會兩串文字黏在一起分不清——
 * 淺底本身接近白色，對比度沿用同一組已驗證過的文字色，不需要重算。
 */
const CHANGE_INK = {
  up: "#e30041", // 漲＝紅。白底 4.84、Tier S 底 4.63
  down: "#008251", // 跌＝綠。白底 4.87、Tier S 底 4.66
  same: "#69737e", // 4.82 / 4.61
} as const;
const CHANGE_BG = {
  up: "#fce7ec",
  down: "#e2f3ec",
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
