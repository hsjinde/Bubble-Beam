import { getBuilding, getCollectionsFor, getPairing } from "@/data/pokopia/pokopia";
import type { Building } from "@/data/pokopia/types";
import { BuildingImage } from "./BuildingImage";
import { CollectionCard } from "./CollectionCard";

interface BuildingDetailProps {
  building: Building;
  onSelectBuilding: (buildingId: string) => void;
  /** 傳入時（手機 modal）顯示關閉鈕 */
  onClose?: () => void;
}

export function BuildingDetail({ building, onSelectBuilding, onClose }: BuildingDetailProps) {
  const pairing = getPairing(building.id);
  const recommended = pairing.recommendedIds
    .map((id) => getBuilding(id))
    .filter((b): b is Building => Boolean(b));
  const relatedCollections = getCollectionsFor(building.id);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-pokopia-tint bg-pokopia-bg-panel">
        <div className="relative">
          <BuildingImage building={building} className="h-44 w-full" />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉詳情"
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-pokopia-ink shadow-sm backdrop-blur hover:bg-white"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
        <div className="px-5 py-4">
          <h2 className="text-xl font-bold text-pokopia-ink">{building.name}</h2>
          <p className="text-sm text-pokopia-ink-soft">{building.nameEN}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-pokopia-accent px-3 py-1 text-xs font-medium text-white">
              {building.category}
            </span>
            {building.series && building.series !== "特色" && (
              <span className="inline-flex items-center rounded-full border border-pokopia-tint px-3 py-1 text-xs font-medium text-pokopia-ink">
                {building.series}系列
              </span>
            )}
          </div>
          <p className="mt-3 leading-relaxed text-pokopia-ink">{building.description}</p>
        </div>
      </div>

      {recommended.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-pokopia-ink">搭配靈感</h3>
            <span className="text-xs text-pokopia-ink-soft">本站整理・非官方</span>
          </div>
          <p className="mt-1 text-sm text-pokopia-ink-soft">{pairing.reason}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {recommended.map((rec) => (
              <li key={rec.id}>
                <button
                  type="button"
                  onClick={() => onSelectBuilding(rec.id)}
                  className="w-full rounded-lg border border-pokopia-tint bg-pokopia-bg-panel p-3 text-left transition-colors hover:bg-pokopia-highlight"
                >
                  <span className="block font-semibold text-pokopia-ink">{rec.name}</span>
                  <span className="block text-xs text-pokopia-ink-soft">{rec.nameEN}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedCollections.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-pokopia-ink">出現在這些主題選集</h3>
            <span className="text-xs text-pokopia-ink-soft">本站策展</span>
          </div>
          <div className="mt-3 space-y-3">
            {relatedCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onSelectBuilding={onSelectBuilding}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
