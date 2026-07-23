import { CATEGORY_META } from "@/data/pokopia/pokopia";
import type { Building } from "@/data/pokopia/types";
import { BuildingImage } from "./BuildingImage";

interface BuildingListProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  onSelect: (buildingId: string) => void;
  /** 已標記為「已蓋」的建築 id；未掛載完成時傳空 Set */
  builtIds: Set<string>;
  onToggleBuilt: (buildingId: string) => void;
}

/**
 * 建築卡片格。圖片區用 BuildingImage（hotlink 上游卡圖，失敗退回功能色塊＋圖示）。
 *
 * 「已蓋」勾選框刻意是卡片按鈕的**兄弟節點**而非塞在裡面——按鈕裡不能再放互動元素
 * （巢狀互動元素在 HTML 上無效，鍵盤與螢幕閱讀器都會出問題）。
 */
export function BuildingList({
  buildings,
  selectedBuildingId,
  onSelect,
  builtIds,
  onToggleBuilt,
}: BuildingListProps) {
  if (buildings.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {buildings.map((building) => {
        const meta = CATEGORY_META[building.category];
        const selected = selectedBuildingId === building.id;
        const isBuilt = builtIds.has(building.id);
        return (
          <li key={building.id} className="relative">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(building.id)}
              className={`flex h-full w-full flex-col overflow-hidden rounded-xl border-2 bg-pokopia-bg-panel text-left transition-colors ${
                selected
                  ? "border-pokopia-accent"
                  : "border-pokopia-tint hover:border-pokopia-accent"
              }`}
            >
              <BuildingImage building={building} className="h-24" />
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="font-semibold leading-snug text-pokopia-ink">{building.name}</span>
                <span className="text-xs text-pokopia-ink-soft">{building.nameEN}</span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-pokopia-ink-soft">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.bg }} />
                  {building.category}
                  {building.series && building.series !== "特色" && (
                    <span>· {building.series}</span>
                  )}
                </span>
              </span>
            </button>

            {/*
             * 觸控目標撐到 44px（min-h-11/min-w-11），視覺只有 24px 的圓框；
             * 底色用不透明的 panel 色，因為它疊在建築圖上，半透明會讓對比不可預測。
             */}
            <label className="absolute top-1 right-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={isBuilt}
                onChange={() => onToggleBuilt(building.id)}
                className="peer sr-only"
              />
              <span className="sr-only">標記「{building.name}」已建造</span>
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-pokopia-tint bg-pokopia-bg-panel text-transparent shadow-xs transition-colors peer-checked:border-pokopia-accent peer-checked:bg-pokopia-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-pokopia-accent peer-focus-visible:ring-offset-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
