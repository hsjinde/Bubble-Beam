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
  /** 只顯示還沒標記為「已蓋」的建築 */
  unbuiltOnly: boolean;
  onUnbuiltOnlyChange: (value: boolean) => void;
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
  unbuiltOnly,
  onUnbuiltOnlyChange,
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
          className="min-h-11 w-full rounded-xl border border-pokopia-tint bg-pokopia-surface pl-10 pr-4 text-pokopia-ink placeholder:text-pokopia-ink-soft/70 transition-all focus:border-pokopia-accent focus:outline-none focus:ring-2 focus:ring-pokopia-accent/30"
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

      <label className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={unbuiltOnly}
          onChange={(e) => onUnbuiltOnlyChange(e.target.checked)}
          className="peer sr-only"
        />
        {/*
         * 開關軌道：靠滑塊位移與填色一起表達狀態，不只靠顏色（色盲可辨）。
         * 滑塊的樣式要用 [&>span] 從軌道往下選——peer-checked 是同層兄弟選擇器（~），
         * 直接寫在滑塊上不會生效，因為它是軌道的子元素而非 input 的兄弟。
         */}
        <span
          aria-hidden="true"
          className="relative h-6 w-11 rounded-full border-2 border-pokopia-tint bg-pokopia-surface transition-colors peer-checked:border-pokopia-accent peer-checked:bg-pokopia-accent peer-checked:[&>span]:translate-x-5 peer-checked:[&>span]:bg-pokopia-on-accent peer-focus-visible:ring-2 peer-focus-visible:ring-pokopia-accent peer-focus-visible:ring-offset-2"
        >
          <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-pokopia-ink-soft transition-transform" />
        </span>
        <span className="text-sm font-medium text-pokopia-ink">只看還沒蓋的</span>
      </label>

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
          ? "border-pokopia-accent bg-pokopia-accent text-pokopia-on-accent shadow-xs"
          : "border-pokopia-tint bg-pokopia-surface text-pokopia-ink hover:border-pokopia-accent/50 hover:bg-pokopia-highlight/60"
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
      {/*
       * 選中態用實心白字：原本 text-white/80 疊在 accent (#a35f1f) 上實測只有 3.63:1，
       * 沒過 AA。實心白對 accent 是 4.8:1（見 styles.css 的色板註解）。
       * 改走 text-pokopia-on-accent token（深色模式下 accent 會提亮，字色要跟著變深）。
       */}
      {typeof count === "number" && (
        <span className={active ? "text-pokopia-on-accent" : "text-pokopia-ink-soft"}>{count}</span>
      )}
    </button>
  );
}
