import { CATEGORIES, CATEGORY_META, SERIES, countByCategory } from "@/data/pokopia/pokopia";
import type { BuildingCategory, BuildingSeries } from "@/data/pokopia/types";

interface BuildingFiltersProps {
  searchTerm: string;
  category: BuildingCategory | null;
  series: BuildingSeries | null;
  resultCount: number;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: BuildingCategory | null) => void;
  onSeriesChange: (series: BuildingSeries | null) => void;
}

/**
 * 搜尋 + 功能分類（單選）+ 住宅系列（次要，僅在「全部」或「住宅」時顯示）。
 * 分類 chip 附數量。搜尋比對繁中名／英文名／描述。
 */
export function BuildingFilters({
  searchTerm,
  category,
  series,
  resultCount,
  onSearchChange,
  onCategoryChange,
  onSeriesChange,
}: BuildingFiltersProps) {
  const counts = countByCategory();
  const showSeries = category === null || category === "住宅";

  return (
    <div className="rounded-2xl border border-pokopia-tint bg-pokopia-bg-panel p-5 shadow-xs">
      <label htmlFor="pokopia-search" className="block text-sm font-bold text-pokopia-ink">
        搜尋建築
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-pokopia-ink-soft">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
          </svg>
        </span>
        <input
          id="pokopia-search"
          type="search"
          inputMode="search"
          placeholder="輸入名稱、英文或關鍵字…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-pokopia-tint bg-white pl-10 pr-4 text-pokopia-ink placeholder:text-pokopia-ink-soft/70 transition-all focus:border-pokopia-accent focus:outline-none focus:ring-2 focus:ring-pokopia-accent/30"
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-pokopia-ink">功能分類</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <FilterChip
            active={category === null}
            onClick={() => onCategoryChange(null)}
            label="全部"
            count={counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0}
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => onCategoryChange(category === c ? null : c)}
              label={c}
              count={counts[c]}
              dotColor={CATEGORY_META[c].bg}
            />
          ))}
        </div>
      </fieldset>

      {showSeries && (
        <fieldset className="mt-5">
          <legend className="text-sm font-bold text-pokopia-ink">
            住宅系列
            <span className="ml-1 font-normal text-pokopia-ink-soft">（材質・主題）</span>
          </legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SERIES.map((s) => (
              <FilterChip
                key={s}
                active={series === s}
                onClick={() => onSeriesChange(series === s ? null : s)}
                label={s}
              />
            ))}
          </div>
        </fieldset>
      )}

      <p className="mt-4 text-xs font-medium text-pokopia-ink-soft" aria-live="polite">
        共 <span className="font-bold text-pokopia-ink">{resultCount}</span> 種建築
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-pokopia-accent bg-pokopia-accent text-white shadow-xs"
          : "border-pokopia-tint bg-white text-pokopia-ink hover:border-pokopia-accent/50 hover:bg-pokopia-highlight/60"
      }`}
    >
      {dotColor && !active && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      {label}
      {typeof count === "number" && (
        // 選中態原本是 text-white/80，在 pokopia-accent（#a35f1f）上只有 3.81:1。
        // /90 也只到 4.39，仍不到 4.5——這個底色沒有「淡一點的白」可用，
        // 只能用純白（4.98:1，與旁邊 label 同值）。未選中態的 ink-soft 本來就合格。
        <span className={active ? "text-white" : "text-pokopia-ink-soft"}>{count}</span>
      )}
    </button>
  );
}
