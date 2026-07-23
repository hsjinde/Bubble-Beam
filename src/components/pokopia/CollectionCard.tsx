import { useState } from "react";
import { getBuilding } from "@/data/pokopia/pokopia";
import type { Collection } from "@/data/pokopia/types";

interface CollectionCardProps {
  collection: Collection;
  onSelectBuilding: (buildingId: string) => void;
}

/**
 * 主題選集卡片：一組真實建築的策展組合（本站策展，非官方佈局）。可展開列出建築，
 * 點建築名跳到該建築詳情。
 */
export function CollectionCard({ collection, onSelectBuilding }: CollectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = `collection-${collection.id}`;

  return (
    <div className="rounded-xl border border-pokopia-tint bg-pokopia-bg-panel p-4">
      <h4 className="font-semibold text-pokopia-ink">{collection.name}</h4>
      <p className="mt-1 text-sm text-pokopia-ink-soft">{collection.description}</p>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-pokopia-accent hover:underline"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        使用的建築（{collection.buildingIds.length}）
      </button>

      {expanded && (
        <ul id={bodyId} className="mt-3 flex flex-wrap gap-2">
          {collection.buildingIds.map((id) => {
            const building = getBuilding(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onSelectBuilding(id)}
                  className="inline-flex min-h-9 items-center rounded-full border border-pokopia-tint bg-white px-3 py-1 text-sm text-pokopia-ink transition-colors hover:bg-pokopia-highlight"
                >
                  {building?.name ?? id}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
