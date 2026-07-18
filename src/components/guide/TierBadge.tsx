import type { Tier } from "@/data/types";

const TIER_STYLES: Record<Tier, string> = {
  S: "bg-amber-400 text-amber-950",
  A: "bg-sky-500 text-white",
  B: "bg-emerald-500 text-white",
  C: "bg-slate-400 text-white",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow ${TIER_STYLES[tier]}`}
      title={`Tier ${tier}`}
    >
      {tier}
    </span>
  );
}
