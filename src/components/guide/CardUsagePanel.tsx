import { getCard } from "@/data/cards";
import type { MetaCardUsage } from "@/data/types";
import { CardImage } from "./CardImage";

/**
 * 核心牌 vs 自由席。
 *
 * 代表牌表只是某一位選手的取捨；這個面板看的是整批取樣牌表的共識——
 * 哪些卡幾乎人人都帶（核心），哪些是各家自己決定的牌位（自由席）。
 * 資料來自 scripts/update-meta.mjs 的 `cardUsage`，上游每個 archetype 提供 20 份公開牌表。
 *
 * 配色刻意只用 --guide-* token，段位差異靠採用率長條的填充比例表達，不引入新色相——
 * tier 段位色與屬性色已經佔滿色相空間（見 styles.css 的 --tier-* 註解）。
 */

const BANDS = [
  { key: "core", label: "核心", hint: "幾乎每份牌表都有", min: 90 },
  { key: "common", label: "常見", hint: "多數牌表會帶", min: 50 },
  { key: "flex", label: "自由席", hint: "各家取捨不同", min: 0 },
] as const;

function UsageTile({ entry }: { entry: MetaCardUsage }) {
  const card = getCard(entry.id);
  const name = card ? (card.nameTC ?? card.nameEN) : entry.id;
  return (
    <figure className="relative">
      <CardImage cardId={entry.id} />
      <span className="absolute -top-1 -right-1 rounded-full bg-guide-ink px-1.5 py-0.5 text-[0.65rem] font-bold text-guide-on-ink shadow">
        ×{entry.modalCount}
      </span>
      <figcaption className="mt-1">
        <span
          className="block truncate text-center text-[0.7rem] text-guide-ink-muted"
          title={name}
        >
          {name}
        </span>
        {/* 長條是視覺輔助，數字本身已在下一行提供給螢幕報讀者 */}
        <span
          aria-hidden="true"
          className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-guide-tint"
        >
          <span
            className="block h-full rounded-full bg-guide-ink"
            style={{ width: `${entry.usagePct}%` }}
          />
        </span>
        <span className="block text-center text-[0.7rem] font-semibold text-guide-ink-deep">
          {entry.usagePct}%
        </span>
      </figcaption>
    </figure>
  );
}

export function CardUsagePanel({
  usage,
  listsSampled,
}: {
  usage: MetaCardUsage[];
  listsSampled: number;
}) {
  if (!usage.length) return null;

  // usage 已由腳本依採用率遞減排序，逐段取用即可
  const bands = BANDS.map((band, i) => {
    const max = i === 0 ? Infinity : BANDS[i - 1].min;
    return { ...band, cards: usage.filter((u) => u.usagePct >= band.min && u.usagePct < max) };
  }).filter((band) => band.cards.length > 0);

  return (
    <section className="rounded-xl border border-guide-tint bg-guide-bg-panel p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-sm font-bold text-guide-ink">核心牌與自由席</h3>
        <p className="text-xs text-guide-ink-muted">
          取自 Limitless 最近 {listsSampled} 份公開牌表的採用率
        </p>
      </div>

      <div className="mt-3 space-y-4">
        {bands.map((band) => (
          <div key={band.key}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="rounded-full bg-guide-tint px-2.5 py-0.5 text-xs font-bold text-guide-ink-deep">
                {band.label} {band.cards.length}
              </span>
              <span className="text-xs text-guide-ink-muted">{band.hint}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {band.cards.map((entry) => (
                <UsageTile key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/*
       * 「自由席 0」不是資料缺漏，是真的沒有——像 Miraidon ex Magnezone 這種固定 combo
       * 牌組，20 份牌表幾乎一模一樣。不寫這句的話讀者會以為壞掉了。
       */}
      {bands.every((b) => b.key !== "flex") && (
        <p className="mt-3 text-xs text-guide-ink-muted">
          這套牌沒有自由席——取樣到的牌表在這些牌位上完全一致。
        </p>
      )}
    </section>
  );
}
