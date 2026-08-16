import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CURATED_PICKS,
  FLAVORS,
  bestRecipes,
  getFlavor,
  getRecipe,
  ingredients,
  recipeImageUrl,
  recipes,
} from "@/data/pokopia/cooking";
import type { Flavor, Ingredient, Recipe, RecipeCategory } from "@/data/pokopia/types";

/**
 * 料理食譜與供奉效果。
 *
 * 這頁的主軸是「口味」而不是料理本身：供奉給苔卡比獸時，決定當天 buff 的是供奉物的
 * 口味，料理只是把同一個口味的效果從「稍微」推到「更容易」。所以版面順序是
 * 口味對照 → 每個口味的首選 3 級料理 → 全部食譜（可篩選）→ 生食材口味表。
 */

function Thumb({
  src,
  alt,
  size,
  fallback,
}: {
  src: string;
  alt: string;
  size: number;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-lg bg-pokopia-tint text-xs font-bold text-pokopia-ink"
        style={{ width: size, height: size }}
      >
        {fallback.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function FlavorDot({ flavor }: { flavor: Flavor }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: getFlavor(flavor).dot }}
    />
  );
}

/** 等級徽章。3 級是這頁的重點，用 accent 實心；2 級低調帶過。 */
function LevelBadge({ level }: { level: 2 | 3 }) {
  return level === 3 ? (
    <span className="rounded-full bg-pokopia-accent px-2 py-px text-[0.7rem] font-bold text-pokopia-on-accent">
      3 級
    </span>
  ) : (
    <span className="rounded-full bg-pokopia-highlight px-2 py-px text-[0.7rem] font-bold text-pokopia-ink-soft">
      2 級
    </span>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const flavor = getFlavor(recipe.flavor);
  return (
    <li className="flex flex-col rounded-xl border border-pokopia-tint bg-pokopia-bg-panel p-3">
      <div className="flex items-start gap-3">
        <Thumb src={recipeImageUrl(recipe)} alt="" size={48} fallback={recipe.name} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-pokopia-ink">{recipe.name}</span>
            <LevelBadge level={recipe.level} />
            {recipe.dlc && (
              <span className="rounded-full bg-pokopia-accent px-1.5 py-px text-[0.65rem] font-bold text-pokopia-on-accent">
                DLC
              </span>
            )}
            {/* DLC 那 10 道官方繁中名還沒進上游資料庫，標出來免得被當成官方譯名 */}
            {recipe.nameSource === "guide" && (
              <span className="text-[0.65rem] text-pokopia-ink-soft">暫譯</span>
            )}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-pokopia-ink-soft">
            <FlavorDot flavor={recipe.flavor} />
            {flavor.label}味 · {recipe.tool}
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1">
        {recipe.ingredients.map((ing, i) => (
          <li
            key={`${ing.name}-${i}`}
            className={`rounded-md px-1.5 py-0.5 text-xs ${
              ing.wildcard
                ? "border border-dashed border-pokopia-tint text-pokopia-ink-soft"
                : "bg-pokopia-highlight text-pokopia-ink"
            }`}
          >
            {ing.name}
          </li>
        ))}
      </ul>

      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-pokopia-ink-soft">
        <span>
          {recipe.move}強化{recipe.strongMove && "（幅度更大）"}
        </span>
        {recipe.specialty && <span>需要「{recipe.specialty}」寶可夢</span>}
      </p>

      <p className="mt-2 flex items-start gap-1.5 border-t border-pokopia-tint pt-2 text-xs text-pokopia-ink">
        <span className="shrink-0 font-bold text-pokopia-ink-soft">供奉</span>
        {recipe.effect}
      </p>
    </li>
  );
}

function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-pokopia-tint bg-pokopia-bg-panel px-2.5 py-2">
      <Thumb src={ingredient.image} alt="" size={28} fallback={ingredient.name} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-pokopia-ink">
          {ingredient.name}
          {ingredient.dlc && (
            <span className="rounded-full bg-pokopia-accent px-1.5 py-px text-[0.6rem] font-bold text-pokopia-on-accent">
              DLC
            </span>
          )}
        </p>
        <p className="text-xs text-pokopia-ink-soft">{ingredient.source}</p>
      </div>
    </li>
  );
}

/** 篩選膠囊，樣式與 BuildingFilters 的一致（44px 觸控目標、aria-pressed）。 */
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
        active
          ? "border-pokopia-accent bg-pokopia-accent text-pokopia-on-accent"
          : "border-pokopia-tint bg-pokopia-surface text-pokopia-ink hover:border-pokopia-accent"
      }`}
    >
      {children}
    </button>
  );
}

export function CookingGuide() {
  const [flavor, setFlavor] = useState<Flavor | null>(null);
  const [category, setCategory] = useState<RecipeCategory | null>(null);
  const [bestOnly, setBestOnly] = useState(false);

  const filtered = useMemo(
    () =>
      recipes.filter(
        (r) =>
          (!flavor || r.flavor === flavor) &&
          (!category || r.category === category) &&
          (!bestOnly || r.level === 3),
      ),
    [flavor, category, bestOnly],
  );

  const byFlavor = useMemo(
    () =>
      FLAVORS.map((f) => ({
        ...f,
        ingredients: ingredients.filter((i) => i.flavor === f.id),
      })),
    [],
  );

  return (
    <div>
      {/* ── 口味 → 效果 ───────────────────────────────────────────── */}
      <section aria-labelledby="flavors-heading">
        <h2 id="flavors-heading" className="text-2xl font-bold text-pokopia-ink">
          先看口味，再選料理
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-pokopia-ink-soft">
          供奉給苔卡比獸時，決定當天效果的是供奉物的<strong>口味</strong>，不是料理本身。
          先想好今天要什麼，再從那個口味裡挑一道等級最高的煮。
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLAVORS.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-pokopia-tint bg-pokopia-bg-panel p-4"
            >
              <p className="flex items-center gap-2 font-bold text-pokopia-ink">
                <FlavorDot flavor={f.id} />
                {f.label}味
              </p>
              <p className="mt-1 text-sm text-pokopia-ink">{f.effect}</p>
              <p className="mt-1 text-xs text-pokopia-ink-soft">適合：{f.goal}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-pokopia-tint bg-pokopia-highlight p-4 text-sm text-pokopia-ink">
          <p className="font-bold">供奉的三個規則</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-pokopia-ink">
            <li>
              效果分三級：生食材直接供奉是 <strong>1 級</strong>（「稍微」）， 料理是{" "}
              <strong>2 級</strong>（「較容易」）或 <strong>3 級</strong>
              （「更容易」）。同樣的口味，煮過再供奉一定比較強。
            </li>
            <li>一天只能供奉一次，供奉完到隔天早上 5 點都不能換，挑之前先想清楚。</li>
            <li>效果是全區通用的，換到別的城鎮也還在，持續到當天結束。</li>
          </ul>
        </div>
      </section>

      {/* ── 每個口味的首選 3 級料理 ───────────────────────────────── */}
      <section className="mt-10" aria-labelledby="picks-heading">
        <h2 id="picks-heading" className="text-2xl font-bold text-pokopia-ink">
          好用的 3 級料理（每種口味各一道）
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-pokopia-ink-soft">
          全部 {bestRecipes.length} 道 3 級料理裡，每種口味挑一道最好做的。
          <span className="ml-1 rounded-full bg-pokopia-highlight px-2 py-0.5 text-xs font-medium">
            推薦理由為本站整理，非官方資料
          </span>
        </p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {CURATED_PICKS.map((pick) => {
            const recipe = getRecipe(pick.recipeId);
            if (!recipe) return null;
            const f = getFlavor(pick.flavor);
            return (
              <li
                key={pick.recipeId}
                className="rounded-xl border-2 border-pokopia-accent bg-pokopia-bg-panel p-4"
              >
                <p className="flex items-center gap-1.5 text-xs font-bold text-pokopia-ink-soft">
                  <FlavorDot flavor={pick.flavor} />
                  {f.label}味 · {f.effect}
                </p>
                <div className="mt-2 flex items-start gap-3">
                  <Thumb src={recipeImageUrl(recipe)} alt="" size={56} fallback={recipe.name} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="text-lg font-bold text-pokopia-ink">{recipe.name}</span>
                      <LevelBadge level={recipe.level} />
                      {recipe.dlc && (
                        <span className="rounded-full bg-pokopia-accent px-1.5 py-px text-[0.65rem] font-bold text-pokopia-on-accent">
                          DLC
                        </span>
                      )}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing, i) => (
                        <li
                          key={`${ing.name}-${i}`}
                          className={`rounded-md px-1.5 py-0.5 text-xs ${
                            ing.wildcard
                              ? "border border-dashed border-pokopia-tint text-pokopia-ink-soft"
                              : "bg-pokopia-highlight text-pokopia-ink"
                          }`}
                        >
                          {ing.name}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-xs text-pokopia-ink-soft">
                      {recipe.tool}
                      {recipe.specialty && ` · 需要「${recipe.specialty}」寶可夢`}
                    </p>
                  </div>
                </div>
                <p className="mt-3 border-t border-pokopia-tint pt-2 text-sm text-pokopia-ink">
                  {pick.why}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 全部食譜 ──────────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="recipes-heading">
        <h2 id="recipes-heading" className="text-2xl font-bold text-pokopia-ink">
          全部 {recipes.length} 道食譜
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-pokopia-ink-soft">
          虛線框的素材格是「任意」，放什麼都行——只有實心的那幾樣會決定做出哪一道。
        </p>

        <div className="mt-4 rounded-2xl border border-pokopia-tint bg-pokopia-bg-panel p-4 shadow-xs">
          <fieldset>
            <legend className="text-sm font-bold text-pokopia-ink">口味</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterPill active={flavor === null} onClick={() => setFlavor(null)}>
                全部
              </FilterPill>
              {FLAVORS.map((f) => (
                <FilterPill
                  key={f.id}
                  active={flavor === f.id}
                  onClick={() => setFlavor(flavor === f.id ? null : f.id)}
                >
                  <FlavorDot flavor={f.id} />
                  {f.label}
                </FilterPill>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-bold text-pokopia-ink">
              種類
              <span className="ml-1 font-normal text-pokopia-ink-soft">（＝料理器具）</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterPill active={category === null} onClick={() => setCategory(null)}>
                全部
              </FilterPill>
              {CATEGORIES.map((c) => (
                <FilterPill
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(category === c.id ? null : c.id)}
                >
                  {c.label}
                </FilterPill>
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <FilterPill active={bestOnly} onClick={() => setBestOnly(!bestOnly)}>
              只看 3 級料理
            </FilterPill>
          </div>
        </div>

        {/* 篩選後的器具說明：選定種類時把「怎麼煮」講清楚，這是新手最常卡的地方 */}
        {category && (
          <p className="mt-4 rounded-xl border border-pokopia-tint bg-pokopia-highlight p-3 text-sm text-pokopia-ink">
            {(() => {
              const c = CATEGORIES.find((x) => x.id === category);
              if (!c) return null;
              return `${c.label}用「${c.tool}」做，主素材固定是${c.base}，吃了會強化「${c.move}」。${c.note}`;
            })()}
          </p>
        )}

        <p className="mt-4 text-sm text-pokopia-ink-soft" aria-live="polite">
          {filtered.length} 道符合
        </p>
        {filtered.length === 0 ? (
          <p className="mt-2 text-sm text-pokopia-ink-soft">
            這個組合沒有料理——例如冰沙只有 DLC 才有，澀味也只有一道 3 級。
          </p>
        ) : (
          <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </ul>
        )}
      </section>

      {/* ── 生食材的口味 ─────────────────────────────────────────── */}
      <section className="mt-10" aria-labelledby="ingredients-heading">
        <h2 id="ingredients-heading" className="text-2xl font-bold text-pokopia-ink">
          食材的口味（直接供奉是 1 級）
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-pokopia-ink-soft">
          還沒解鎖料理、或懶得開火時，食材也能直接供奉，效果是同口味的最低一級。
          辣味的新鮮紅蘿蔔野外拔草就有，是最好取得的一種。
        </p>
        <div className="mt-4 space-y-5">
          {byFlavor.map((f) =>
            f.ingredients.length === 0 ? null : (
              <div key={f.id}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-pokopia-ink">
                  <FlavorDot flavor={f.id} />
                  {f.label}味<span className="font-normal text-pokopia-ink-soft">{f.effect}</span>
                </h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {f.ingredients.map((i) => (
                    <IngredientRow key={i.id} ingredient={i} />
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
