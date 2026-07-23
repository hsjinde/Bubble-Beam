import type { MetaTier } from "@/data/types";

/**
 * Tier 段位色階，色值定義在 styles.css 的 --tier-*（見該處註解說明「為何不用鮮豔色」）。
 * 原本用 Tailwind 的 amber/sky/emerald/slate/rose 彩虹，與 EnergyIcon 的屬性色撞色
 * （S 金撞雷、A 藍撞水、B 綠撞草），且三套配色各自為政。改為低飽和金屬段位階。
 *
 * 淺底深字，實測對比（WCAG 1.4.3 AA，14px 粗體，瀏覽器 computed 值計算）：
 *   S 香檳金 #f0d283 / #5c4200 → 6.38:1
 *   A 霧藍   #a9cfe6 / #123b52 → 7.19:1
 *   B 淺霧藍 #cfe4f0 / #1d5273 → 6.39:1
 *   C 藍灰   #d4dbe2 / #334a57 → 6.66:1
 *   D 中性灰 #e3e3e6 / #4d4d54 → 6.55:1
 * 改任何一組顏色時請一併重算對比（S 金與雷屬性黃的 redmean 色距 114，不撞）。
 */
const TIER_STYLES: Record<MetaTier, { bg: string; ink: string }> = {
  S: { bg: "var(--tier-s-bg)", ink: "var(--tier-s-ink)" },
  A: { bg: "var(--tier-a-bg)", ink: "var(--tier-a-ink)" },
  B: { bg: "var(--tier-b-bg)", ink: "var(--tier-b-ink)" },
  C: { bg: "var(--tier-c-bg)", ink: "var(--tier-c-ink)" },
  D: { bg: "var(--tier-d-bg)", ink: "var(--tier-d-ink)" },
};

export function TierBadge({ tier }: { tier: MetaTier }) {
  const s = TIER_STYLES[tier];
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-transform duration-200 hover:scale-105"
      style={{
        backgroundColor: s.bg,
        color: s.ink,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      title={`Tier ${tier}`}
      role="img"
      aria-label={`Tier ${tier}`}
    >
      <span aria-hidden="true">{tier}</span>
    </span>
  );
}
