import { useEffect, useMemo, useState } from "react";
import { buildings, collections, getBuilding } from "@/data/pokopia/pokopia";
import type { BuildingCategory, BuildingSeries } from "@/data/pokopia/types";
import { BookmarkNav } from "./BookmarkNav";
import { BuildingFilters } from "./BuildingFilters";
import { BuildingList } from "./BuildingList";
import { BuildingDetail } from "./BuildingDetail";
import { CollectionCard } from "./CollectionCard";
import { VideoInspiration } from "./VideoInspiration";

interface PokopiaPageProps {
  /** 目前選取的建築 id（來自 URL ?b=），null 表示未選 */
  selectedBuildingId: string | null;
  /** 更新選取；傳 null 取消選取。route 會同步到 URL */
  onSelectBuilding: (buildingId: string | null) => void;
}

export function PokopiaPage({ selectedBuildingId, onSelectBuilding }: PokopiaPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<BuildingCategory | null>(null);
  const [series, setSeries] = useState<BuildingSeries | null>(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return buildings.filter((b) => {
      const matchesSearch =
        q === "" ||
        b.name.toLowerCase().includes(q) ||
        b.nameEN.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q);
      const matchesCategory = category === null || b.category === category;
      const matchesSeries = series === null || b.series === series;
      return matchesSearch && matchesCategory && matchesSeries;
    });
  }, [searchTerm, category, series]);

  // URL 帶進來的 id 若不存在（手改網址），視為未選
  const selectedBuilding = selectedBuildingId ? (getBuilding(selectedBuildingId) ?? null) : null;

  // 切到非住宅分類時清掉住宅系列篩選，避免出現「零結果」的死角
  function handleCategoryChange(next: BuildingCategory | null) {
    setCategory(next);
    if (next !== null && next !== "住宅") setSeries(null);
  }

  function clearFilters() {
    setSearchTerm("");
    setCategory(null);
    setSeries(null);
  }

  // 手機 modal 開啟時鎖背景捲動 + ESC 關閉
  useEffect(() => {
    if (!selectedBuilding) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSelectBuilding(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBuilding, onSelectBuilding]);

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold text-pokopia-ink sm:text-4xl">Pokopia 建築指南</h1>
        <p className="mt-2 max-w-2xl text-pokopia-ink-soft">
          《Pokémon Pokopia》全 {buildings.length}{" "}
          種建築物一覽：功能分類、材質系列、搭配靈感與主題選集，幫你規劃夢想樂園。建築名稱與描述為官方繁中資料。
        </p>
        <BookmarkNav />
      </header>

      <div className="mt-8">
        <BuildingFilters
          searchTerm={searchTerm}
          category={category}
          series={series}
          resultCount={filtered.length}
          onSearchChange={setSearchTerm}
          onCategoryChange={handleCategoryChange}
          onSeriesChange={setSeries}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* 建築列表 */}
        <div className="lg:col-span-3">
          {filtered.length > 0 ? (
            <BuildingList
              buildings={filtered}
              selectedBuildingId={selectedBuildingId}
              onSelect={onSelectBuilding}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-pokopia-tint bg-pokopia-bg-panel p-8 text-center">
              <p className="text-pokopia-ink-soft">找不到符合條件的建築。</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-pokopia-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                清除篩選
              </button>
            </div>
          )}
        </div>

        {/* 桌機：sticky 詳情側欄 */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-20">
            {selectedBuilding ? (
              <BuildingDetail building={selectedBuilding} onSelectBuilding={onSelectBuilding} />
            ) : (
              <div className="rounded-xl border border-dashed border-pokopia-tint bg-pokopia-bg-panel p-8 text-center">
                <p className="text-sm text-pokopia-ink-soft">
                  點選左側任一建築，查看描述、搭配靈感與主題選集。
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 主題選集瀏覽區（未選建築時才顯示，避免與詳情內的選集重複干擾） */}
      {!selectedBuilding && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-pokopia-ink">主題選集</h2>
          <p className="mt-1 text-sm text-pokopia-ink-soft">
            本站策展的建築組合，給你的樂園規劃一點靈感。點建築名可看詳情。
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onSelectBuilding={onSelectBuilding}
              />
            ))}
          </div>
        </section>
      )}

      {/* 建築靈感影片（同樣只在瀏覽狀態顯示） */}
      {!selectedBuilding && <VideoInspiration />}

      {/* 手機：詳情以 modal 呈現 */}
      {selectedBuilding && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedBuilding.name} 詳情`}
        >
          <button
            type="button"
            aria-label="關閉詳情"
            onClick={() => onSelectBuilding(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-pokopia-bg p-4 pb-8 shadow-[0_-8px_30px_rgba(74,55,40,0.25)]">
            <BuildingDetail
              building={selectedBuilding}
              onSelectBuilding={onSelectBuilding}
              onClose={() => onSelectBuilding(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
