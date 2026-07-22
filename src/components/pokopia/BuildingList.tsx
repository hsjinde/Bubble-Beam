import { CATEGORY_META } from "@/data/pokopia/pokopia";
import type { Building } from "@/data/pokopia/types";
import { BuildingImage } from "./BuildingImage";

interface BuildingListProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  onSelect: (buildingId: string) => void;
}

/**
 * 建築卡片格。圖片區用 BuildingImage（hotlink 上游卡圖，失敗退回功能色塊＋圖示）。
 */
export function BuildingList({ buildings, selectedBuildingId, onSelect }: BuildingListProps) {
  if (buildings.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {buildings.map((building) => {
        const meta = CATEGORY_META[building.category];
        const selected = selectedBuildingId === building.id;
        return (
          <li key={building.id}>
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
          </li>
        );
      })}
    </ul>
  );
}
