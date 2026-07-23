import { useState } from "react";
import { CATEGORY_META, buildingImageUrl } from "@/data/pokopia/pokopia";
import type { Building, BuildingCategory } from "@/data/pokopia/types";

/**
 * 建築圖片：hotlink 上游 pokopiadex 卡圖，底色用功能分類色塊。載入失敗時退回
 * 色塊上的功能圖示（與原本無圖時的視覺一致）——沿用 CardImage 的 fallback 策略。
 * 圖片會隨 building.id 變動用 key 重置 failed 狀態，避免切換建築時殘留錯誤旗標。
 */
export function BuildingImage({
  building,
  className = "",
}: {
  building: Building;
  className?: string;
}) {
  const meta = CATEGORY_META[building.category];
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: meta.bg, color: meta.ink }}
    >
      {failed ? (
        <CategoryGlyph category={building.category} />
      ) : (
        <img
          src={buildingImageUrl(building)}
          alt={building.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      )}
    </span>
  );
}

/** 每個功能分類一個簡單線稿圖示，作為載入失敗時的 fallback。 */
export function CategoryGlyph({ category }: { category: BuildingCategory }) {
  const paths: Record<BuildingCategory, string> = {
    住宅: "M4 11 12 4l8 7M6 10v9h12v-9",
    寶可夢中心: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8",
    發電: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
    商店設施: "M4 8l1-4h14l1 4M4 8h16v12H4V8Zm5 12v-6h6v6",
    裝飾地標: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z",
  };
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[category] ?? paths.裝飾地標} />
    </svg>
  );
}
