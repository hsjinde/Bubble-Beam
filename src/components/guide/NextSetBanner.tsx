import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { daysUntil, nextSetRelease } from "@/data/schedule";

/**
 * /decks 頁頂的「即將發售」細長提示，連到行事曆。
 *
 * 完全在掛載後才算繪：內容取決於「現在」，SSR 與瀏覽器端各自取時間會對不上而
 * 造成 hydration mismatch。沒有即將發售的擴充包時整條不出現，不佔版面。
 */
export function NextSetBanner() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (now === null) return null;

  const next = nextSetRelease(now);
  if (!next) return null;

  const days = daysUntil(next.startAt, now);
  return (
    <Link
      to="/decks/schedule"
      className="mb-4 flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-guide-tint bg-guide-bg-panel px-4 py-2 text-sm transition hover:border-guide-accent"
    >
      <span className="rounded-full bg-guide-ink px-2.5 py-0.5 text-xs font-bold text-white">
        {days <= 0 ? "即將發售" : `${days} 天後`}
      </span>
      <span className="font-semibold text-guide-ink">
        新擴充包 {next.title}
        {next.titleTC && <span className="font-normal text-slate-600">（{next.titleTC}）</span>}
      </span>
      <span className="ml-auto font-semibold text-guide-ink-deep">看行事曆 →</span>
    </Link>
  );
}
