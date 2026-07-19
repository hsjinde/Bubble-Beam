import type { MetaTier } from "@/data/types";

const TIER_STYLES: Record<MetaTier, string> = {
  S: "bg-amber-400 text-amber-950",
  A: "bg-sky-500 text-white",
  B: "bg-emerald-500 text-white",
  C: "bg-slate-400 text-white",
  D: "bg-rose-300 text-rose-950",
};

export function TierBadge({ tier }: { tier: MetaTier }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow ${TIER_STYLES[tier]}`}
      title={`Tier ${tier}`}
    >
      {tier}
    </span>
  );
}
