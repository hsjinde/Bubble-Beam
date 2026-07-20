import type { MetaTier } from "@/data/types";

/**
 * S 與 D 本來就是「淺底 + 950 深字」，實測 8.71:1 / 通過；
 * A/B/C 原本是「飽和底 + 白字」，只有 2.47–2.71:1，未達 WCAG AA。
 * 這裡把 A/B/C 收斂成與 S/D 相同的模式，色相維持不變。
 */
const TIER_STYLES: Record<MetaTier, string> = {
  S: "bg-amber-400 text-amber-950",
  A: "bg-sky-300 text-sky-950",
  B: "bg-emerald-300 text-emerald-950",
  C: "bg-slate-300 text-slate-900",
  D: "bg-rose-300 text-rose-950",
};

export function TierBadge({ tier }: { tier: MetaTier }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow ${TIER_STYLES[tier]}`}
      title={`Tier ${tier}`}
      role="img"
      aria-label={`Tier ${tier}`}
    >
      <span aria-hidden="true">{tier}</span>
    </span>
  );
}
