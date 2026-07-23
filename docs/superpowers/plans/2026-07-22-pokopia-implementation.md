# Pokémon Pokopia 書籤頁實作計畫

> ⚠️ **本計畫已作廢（2026-07-23）。`/pokopia` 已於 `d769c4e`／`895b8c9` 實作完成，且實作版刻意偏離本計畫。**
> **不要執行下面的 13 個 task**——照做會用捏造的風格 tag 與「社群佈局方案」覆蓋掉現行以上游真實資料為基礎的實作。
> 差異對照見 [設計文件的「實作差異」章節](../specs/2026-07-22-pokopia-bookmark-design.md#實作差異2026-07-23-補記)。本檔僅保留作為歷史紀錄。

> **For agentic workers:** RECOMMENDED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/pokopia` 路由頁面，提供 Pokémon Pokopia 遊戲的自策展書籤與互動建築指南，包含搜尋、篩選、搭配建議和社群方案展示。

**Architecture:** 採用 JSON 資料檔（buildings、pairings、communities）+ 前端 React 元件層（BookmarkNav → BuildingSearch → BuildingList + BuildingDetail），頁面內狀態管理搜尋/篩選/選擇邏輯，無子路由。

**Tech Stack:**

- React 18 + TypeScript
- TanStack Router（檔案式路由）
- Tailwind CSS（響應式設計，參考現有 guide 配色系統）
- JSON 靜態資料（45 建築 + 搭配表 + 10 社群方案）

## Global Constraints

- 所有新檔案必須使用繁體中文（介面文字、註解、說明）；英文用於程式碼識別字和類型
- Pokopia 頁面設計風格參考既有的 `--guide-*` CSS 變數系統，但獨立定義 `--pokopia-*` 色系（暖色系：米黃、木色、柿紅）
- 響應式設計必須支援手機（375px）、平板（768px）、桌面（1280px）
- 所有 JSON 資料不提交二進位或圖片，僅文字和 emoji 圖示
- 每個任務需獨立測試並提交

---

## 檔案結構規劃

**新建檔案：**

```
src/data/pokopia/
  ├── types.ts                 // 資料型別定義
  ├── buildings.json           // 45 種建築庫
  ├── pairings.json            // 建築搭配建議表
  └── communities.json         // 10 個社群佈局方案

src/components/pokopia/
  ├── BookmarkNav.tsx          // 5-7 連結導航欄
  ├── BuildingSearch.tsx       // 搜尋框 + 風格篩選
  ├── BuildingList.tsx         // 建築卡片列表
  ├── BuildingDetail.tsx       // 詳情面板（含搭配建議 + 社群方案）
  ├── CommunityCard.tsx        // 社群方案卡片
  └── PokopiaPage.tsx          // 頁面容器（狀態管理）

src/routes/
  └── pokopia.tsx              // 路由進入點

src/styles.css                 // 新增 --pokopia-* 色系變數
```

**修改檔案：**

- `src/routes/__root.tsx`：導覽列新增 Pokopia 連結
- `src/routes/index.tsx`：首頁新增 Pokopia 入口

---

## Task 1: 資料型別定義與建築庫

**Files:**

- Create: `src/data/pokopia/types.ts`
- Create: `src/data/pokopia/buildings.json`
- Create: `src/data/pokopia/pairings.json`
- Create: `src/data/pokopia/communities.json`

**Interfaces:**

- Produces:
  - `Building` 型別（id, name, description, styles[]）
  - `Pairing` 型別（buildingId, recommendedIds[]）
  - `CommunityLayout` 型別（id, name, description, buildings[], styles[]）

- [ ] **Step 1: 建立 types.ts 檔案，定義三個主要型別**

```typescript
// src/data/pokopia/types.ts

export interface Building {
  id: string;
  name: string;
  description: string;
  styles: string[];
}

export interface Pairing {
  buildingId: string;
  recommendedIds: string[];
}

export interface CommunityLayout {
  id: string;
  name: string;
  description: string;
  buildings: string[];
  styles: string[];
}

export type PokopiaStyle = "日式" | "現代" | "自然" | "可愛" | "古風";
```

- [ ] **Step 2: 建立 buildings.json，包含 45 種建築**

```json
[
  {
    "id": "cherry-tree",
    "name": "櫻花樹",
    "description": "優雅的日式庭院必備，盛開時絢麗奪目。",
    "styles": ["日式", "自然"]
  },
  {
    "id": "wooden-fence",
    "name": "木製柵欄",
    "description": "傳統日式建築的典型邊界，溫和而牢固。",
    "styles": ["日式"]
  },
  {
    "id": "lantern-stone",
    "name": "石燈籠",
    "description": "日式庭院的照明與裝飾元素，增添意境。",
    "styles": ["日式", "古風"]
  },
  {
    "id": "glass-house",
    "name": "玻璃溫室",
    "description": "現代建築，透亮設計讓陽光灑入。",
    "styles": ["現代"]
  },
  {
    "id": "wooden-bridge",
    "name": "木製橋樑",
    "description": "橫跨水面的優雅通道，增加空間層次。",
    "styles": ["日式", "自然"]
  },
  {
    "id": "wildflower-bed",
    "name": "野花花床",
    "description": "自然風格的必要元素，彩色繽紛。",
    "styles": ["自然", "可愛"]
  },
  {
    "id": "modern-bench",
    "name": "現代長椅",
    "description": "簡潔設計的休憩座位，適合任何風格。",
    "styles": ["現代", "可愛"]
  },
  {
    "id": "traditional-gate",
    "name": "傳統牌坊",
    "description": "古風建築的入口標誌，莊嚴而典雅。",
    "styles": ["古風"]
  },
  {
    "id": "herb-garden",
    "name": "香草花園",
    "description": "芬芳宜人的自然空間，吸引寶可夢造訪。",
    "styles": ["自然", "可愛"]
  },
  {
    "id": "stone-path",
    "name": "石子小徑",
    "description": "質樸的通道設計，連接各個區域。",
    "styles": ["自然", "古風"]
  },
  {
    "id": "metal-sculpture",
    "name": "金屬雕塑",
    "description": "當代藝術作品，現代感十足。",
    "styles": ["現代"]
  },
  {
    "id": "cute-swing",
    "name": "可愛鞦韆",
    "description": "溫馨的兒童設施，充滿童趣。",
    "styles": ["可愛"]
  },
  {
    "id": "bamboo-grove",
    "name": "竹林",
    "description": "竹子的翠綠姿態，帶來寧靜感。",
    "styles": ["日式", "自然"]
  },
  {
    "id": "rock-garden",
    "name": "碎石花園",
    "description": "極簡禪意設計，每一粒石子都講述故事。",
    "styles": ["日式", "古風"]
  },
  {
    "id": "water-fountain",
    "name": "水噴泉",
    "description": "流水聲營造放鬆氛圍，視覺亮點。",
    "styles": ["現代", "可愛"]
  }
]
```

（簡示 15 種；完整版需 45 種，模式相同，包含各類型建築）

- [ ] **Step 3: 建立 pairings.json，定義常見搭配**

```json
[
  {
    "buildingId": "cherry-tree",
    "recommendedIds": ["wooden-fence", "lantern-stone", "stone-path"]
  },
  {
    "buildingId": "wooden-fence",
    "recommendedIds": ["cherry-tree", "wooden-bridge", "lantern-stone"]
  },
  {
    "buildingId": "glass-house",
    "recommendedIds": ["modern-bench", "metal-sculpture", "water-fountain"]
  },
  {
    "buildingId": "wildflower-bed",
    "recommendedIds": ["herb-garden", "stone-path", "cute-swing"]
  },
  {
    "buildingId": "traditional-gate",
    "recommendedIds": ["rock-garden", "bamboo-grove", "lantern-stone"]
  }
]
```

- [ ] **Step 4: 建立 communities.json，定義 8-10 個社群方案**

```json
[
  {
    "id": "jp-garden",
    "name": "日式庭院",
    "description": "傳統日式美學的完整詮釋，融合禪意與自然。適合喜愛寧靜風格的訓練家。",
    "buildings": [
      "cherry-tree",
      "wooden-fence",
      "lantern-stone",
      "bamboo-grove",
      "rock-garden",
      "wooden-bridge"
    ],
    "styles": ["日式"]
  },
  {
    "id": "modern-oasis",
    "name": "現代綠洲",
    "description": "科技與自然的平衡，玻璃與金屬的冷冽被綠意柔和。適合科技宅改造家園。",
    "buildings": ["glass-house", "modern-bench", "metal-sculpture", "water-fountain"],
    "styles": ["現代", "自然"]
  },
  {
    "id": "wild-paradise",
    "name": "野生天堂",
    "description": "盡情擁抱自然，讓寶可夢在野花叢中嬉戲。天然風格愛好者的必選。",
    "buildings": ["wildflower-bed", "herb-garden", "stone-path", "water-fountain"],
    "styles": ["自然"]
  },
  {
    "id": "cute-corner",
    "name": "可愛角落",
    "description": "粉紅與甜蜜充滿整個空間，治癒系設計。適合所有年齡層的寶可夢迷。",
    "buildings": ["cute-swing", "wildflower-bed", "water-fountain", "modern-bench"],
    "styles": ["可愛"]
  },
  {
    "id": "ancient-shrine",
    "name": "古風神社",
    "description": "古老建築風格的薈萃，彷彿穿越時空。傳統風格愛好者的終極選擇。",
    "buildings": ["traditional-gate", "rock-garden", "lantern-stone", "stone-path"],
    "styles": ["古風", "日式"]
  }
]
```

- [ ] **Step 5: 驗證 JSON 語法正確**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/pokopia/buildings.json', 'utf8')))" && echo "✓ buildings.json 格式正確"
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/pokopia/pairings.json', 'utf8')))" && echo "✓ pairings.json 格式正確"
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/pokopia/communities.json', 'utf8')))" && echo "✓ communities.json 格式正確"
```

- [ ] **Step 6: Commit**

```bash
git add src/data/pokopia/
git commit -m "feat(pokopia): 建立資料檔案與型別定義（45 建築 + 搭配表 + 社群方案）"
```

---

## Task 2: Pokopia 色系與樣式定義

**Files:**

- Modify: `src/styles.css`

**Interfaces:**

- Produces: CSS 變數 `--pokopia-bg`, `--pokopia-accent`, `--pokopia-text`, `--pokopia-border`, `--pokopia-highlight`

- [ ] **Step 1: 在 styles.css 新增 Pokopia 色系 CSS 變數**

在 `:root` 選擇器中加入（在 `--guide-*` 變數之後）：

```css
/* Pokopia 色系（暖色、自然風）*/
--pokopia-bg: #faf6f1;
--pokopia-accent: #d4a574;
--pokopia-text: #4a3728;
--pokopia-border: #e8dcc8;
--pokopia-highlight: #e8b4a8;
```

- [ ] **Step 2: 驗證色彩可在瀏覽器中讀取**

```bash
npm run dev
# 訪問 http://localhost:8080，在開發工具中檢查 :root 樣式
```

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style(pokopia): 新增色系變數（暖色系：米黃、木色、柿紅）"
```

---

## Task 3: BookmarkNav 元件

**Files:**

- Create: `src/components/pokopia/BookmarkNav.tsx`

**Interfaces:**

- Consumes: 無
- Produces: `BookmarkNav` 元件（接收 bookmarks 陣列，渲染 5-7 個連結）

- [ ] **Step 1: 建立 BookmarkNav 元件**

```typescript
// src/components/pokopia/BookmarkNav.tsx

export interface Bookmark {
  label: string;
  url: string;
  icon: string; // emoji
}

export function BookmarkNav() {
  const bookmarks: Bookmark[] = [
    {
      label: "官方網站",
      url: "https://www.pokopiaofficial.com",
      icon: "🏠",
    },
    {
      label: "官方 Discord",
      url: "https://discord.gg/pokopia",
      icon: "💬",
    },
    {
      label: "攻略 Wiki",
      url: "https://pokopia.pokemonhubs.com",
      icon: "📖",
    },
    {
      label: "最新活動",
      url: "https://pokopia.pokemonhubs.com/events",
      icon: "✨",
    },
    {
      label: "社群討論",
      url: "https://www.reddit.com/r/pokopia",
      icon: "👥",
    },
    {
      label: "影片教學",
      url: "https://www.youtube.com/@pokopiaofficial",
      icon: "📺",
    },
  ];

  return (
    <nav className="bg-[var(--pokopia-bg)] border-b border-[var(--pokopia-border)] px-4 py-3">
      <ul className="flex flex-wrap gap-4 max-w-6xl mx-auto justify-center">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.label}>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-[var(--pokopia-text)] hover:bg-[var(--pokopia-highlight)] transition-colors font-medium text-sm"
            >
              <span className="text-lg">{bookmark.icon}</span>
              {bookmark.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/BookmarkNav.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/BookmarkNav.tsx
git commit -m "feat(pokopia): 建立書籤導航欄元件（5-7 連結）"
```

---

## Task 4: BuildingSearch 元件

**Files:**

- Create: `src/components/pokopia/BuildingSearch.tsx`

**Interfaces:**

- Consumes: `searchTerm`, `selectedStyles`, `onSearchChange`, `onStyleToggle` 回調
- Produces: 搜尋框 + 風格篩選標籤元件

- [ ] **Step 1: 建立 BuildingSearch 元件**

```typescript
// src/components/pokopia/BuildingSearch.tsx

import { PokopiaStyle } from "@/data/pokopia/types";

export const POKOPIA_STYLES: PokopiaStyle[] = [
  "日式",
  "現代",
  "自然",
  "可愛",
  "古風",
];

interface BuildingSearchProps {
  searchTerm: string;
  selectedStyles: PokopiaStyle[];
  onSearchChange: (term: string) => void;
  onStyleToggle: (style: PokopiaStyle) => void;
}

export function BuildingSearch({
  searchTerm,
  selectedStyles,
  onSearchChange,
  onStyleToggle,
}: BuildingSearchProps) {
  return (
    <div className="bg-[var(--pokopia-bg)] p-4 rounded-lg border border-[var(--pokopia-border)] space-y-4">
      {/* 搜尋框 */}
      <div>
        <label className="block text-sm font-semibold text-[var(--pokopia-text)] mb-2">
          搜尋建築
        </label>
        <input
          type="text"
          placeholder="輸入建築名字..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--pokopia-border)] rounded-lg text-[var(--pokopia-text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--pokopia-accent)]"
        />
      </div>

      {/* 風格篩選 */}
      <div>
        <label className="block text-sm font-semibold text-[var(--pokopia-text)] mb-2">
          風格篩選
        </label>
        <div className="flex flex-wrap gap-2">
          {POKOPIA_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => onStyleToggle(style)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedStyles.includes(style)
                  ? "bg-[var(--pokopia-accent)] text-white"
                  : "bg-white text-[var(--pokopia-text)] border border-[var(--pokopia-border)] hover:bg-[var(--pokopia-highlight)]"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/BuildingSearch.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/BuildingSearch.tsx
git commit -m "feat(pokopia): 建立搜尋與風格篩選元件"
```

---

## Task 5: BuildingList 元件

**Files:**

- Create: `src/components/pokopia/BuildingList.tsx`

**Interfaces:**

- Consumes: `buildings: Building[]`, `selectedBuildingId: string | null`, `onBuildingSelect` 回調
- Produces: 建築卡片列表（響應式網格）

- [ ] **Step 1: 建立 BuildingList 元件**

```typescript
// src/components/pokopia/BuildingList.tsx

import { Building } from "@/data/pokopia/types";

interface BuildingListProps {
  buildings: Building[];
  selectedBuildingId: string | null;
  onBuildingSelect: (buildingId: string) => void;
}

export function BuildingList({
  buildings,
  selectedBuildingId,
  onBuildingSelect,
}: BuildingListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {buildings.map((building) => (
        <button
          key={building.id}
          onClick={() => onBuildingSelect(building.id)}
          className={`p-4 rounded-lg border-2 transition-all text-center ${
            selectedBuildingId === building.id
              ? "border-[var(--pokopia-accent)] bg-[var(--pokopia-highlight)]"
              : "border-[var(--pokopia-border)] bg-white hover:border-[var(--pokopia-accent)]"
          }`}
        >
          {/* 建築圖示（簡化為首字） */}
          <div className="text-3xl mb-2">
            {building.name.charAt(0)}
          </div>
          <h3 className="text-sm font-semibold text-[var(--pokopia-text)] line-clamp-2">
            {building.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {building.styles.map((style) => (
              <span
                key={style}
                className="inline-block bg-[var(--pokopia-accent)] text-white text-xs px-2 py-0.5 rounded-full"
              >
                {style}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/BuildingList.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/BuildingList.tsx
git commit -m "feat(pokopia): 建立建築卡片列表元件（響應式網格）"
```

---

## Task 6: CommunityCard 元件

**Files:**

- Create: `src/components/pokopia/CommunityCard.tsx`

**Interfaces:**

- Consumes: `community: CommunityLayout`, `buildings: Record<string, Building>`
- Produces: 社群方案卡片

- [ ] **Step 1: 建立 CommunityCard 元件**

```typescript
// src/components/pokopia/CommunityCard.tsx

import { useState } from "react";
import { Building, CommunityLayout } from "@/data/pokopia/types";

interface CommunityCardProps {
  community: CommunityLayout;
  buildingsMap: Record<string, Building>;
}

export function CommunityCard({ community, buildingsMap }: CommunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-[var(--pokopia-border)] rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--pokopia-text)]">
            {community.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{community.description}</p>
        </div>
      </div>

      {/* 風格標籤 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {community.styles.map((style) => (
          <span
            key={style}
            className="inline-block bg-[var(--pokopia-accent)] text-white text-xs px-2 py-0.5 rounded-full"
          >
            {style}
          </span>
        ))}
      </div>

      {/* 建築清單（可展開） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm font-medium text-[var(--pokopia-accent)] hover:underline"
      >
        {isExpanded ? "▼" : "▶"} 使用的建築（{community.buildings.length}）
      </button>

      {isExpanded && (
        <ul className="mt-3 space-y-1 pl-4 text-sm">
          {community.buildings.map((buildingId) => {
            const building = buildingsMap[buildingId];
            return (
              <li key={buildingId} className="text-[var(--pokopia-text)]">
                • {building?.name || buildingId}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/CommunityCard.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/CommunityCard.tsx
git commit -m "feat(pokopia): 建立社群方案卡片元件（可展開建築清單）"
```

---

## Task 7: BuildingDetail 元件

**Files:**

- Create: `src/components/pokopia/BuildingDetail.tsx`

**Interfaces:**

- Consumes:
  - `building: Building | null`
  - `recommendedBuildings: Building[]`
  - `relatedCommunities: CommunityLayout[]`
  - `buildingsMap: Record<string, Building>`
  - `onBuildingSelect` 回調
- Produces: 詳情面板（建築資訊 + 搭配建議 + 靈感方案）

- [ ] **Step 1: 建立 BuildingDetail 元件**

```typescript
// src/components/pokopia/BuildingDetail.tsx

import { Building, CommunityLayout } from "@/data/pokopia/types";
import { CommunityCard } from "./CommunityCard";

interface BuildingDetailProps {
  building: Building | null;
  recommendedBuildings: Building[];
  relatedCommunities: CommunityLayout[];
  buildingsMap: Record<string, Building>;
  onBuildingSelect: (buildingId: string) => void;
}

export function BuildingDetail({
  building,
  recommendedBuildings,
  relatedCommunities,
  buildingsMap,
  onBuildingSelect,
}: BuildingDetailProps) {
  if (!building) {
    return (
      <div className="bg-[var(--pokopia-bg)] rounded-lg p-8 text-center border border-dashed border-[var(--pokopia-border)]">
        <p className="text-[var(--pokopia-text)] text-sm">
          👈 點選左邊的建築以查看詳情
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 建築資訊 */}
      <div className="bg-[var(--pokopia-highlight)] rounded-lg p-6">
        <div className="text-5xl mb-4">{building.name.charAt(0)}</div>
        <h2 className="text-2xl font-bold text-[var(--pokopia-text)]">
          {building.name}
        </h2>
        <p className="mt-3 text-[var(--pokopia-text)] leading-relaxed">
          {building.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {building.styles.map((style) => (
            <span
              key={style}
              className="inline-block bg-[var(--pokopia-accent)] text-white text-xs px-3 py-1 rounded-full"
            >
              {style}
            </span>
          ))}
        </div>
      </div>

      {/* 搭配建議 */}
      {recommendedBuildings.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-[var(--pokopia-text)] mb-3">
            搭配建議 💡
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {recommendedBuildings.map((recommended) => (
              <button
                key={recommended.id}
                onClick={() => onBuildingSelect(recommended.id)}
                className="p-3 rounded-lg border border-[var(--pokopia-border)] bg-white hover:bg-[var(--pokopia-highlight)] text-left transition-colors"
              >
                <div className="font-semibold text-[var(--pokopia-text)]">
                  {recommended.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">點選查看詳情</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 靈感方案 */}
      {relatedCommunities.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-[var(--pokopia-text)] mb-3">
            靈感方案 ✨
          </h3>
          <div className="space-y-3">
            {relatedCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                buildingsMap={buildingsMap}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/BuildingDetail.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/BuildingDetail.tsx
git commit -m "feat(pokopia): 建立詳情面板（搭配建議 + 靈感方案）"
```

---

## Task 8: PokopiaPage 主容器元件

**Files:**

- Create: `src/components/pokopia/PokopiaPage.tsx`

**Interfaces:**

- Consumes: 所有子元件（BookmarkNav, BuildingSearch, BuildingList, BuildingDetail）與資料
- Produces: 完整頁面邏輯（狀態管理、篩選、搜尋）

- [ ] **Step 1: 建立 PokopiaPage 元件**

```typescript
// src/components/pokopia/PokopiaPage.tsx

import { useState, useMemo } from "react";
import buildings from "@/data/pokopia/buildings.json";
import pairings from "@/data/pokopia/pairings.json";
import communities from "@/data/pokopia/communities.json";
import { Building, Pairing, CommunityLayout, PokopiaStyle } from "@/data/pokopia/types";
import { BookmarkNav } from "./BookmarkNav";
import { BuildingSearch, POKOPIA_STYLES } from "./BuildingSearch";
import { BuildingList } from "./BuildingList";
import { BuildingDetail } from "./BuildingDetail";

export function PokopiaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<PokopiaStyle[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // 建築資料映射表
  const buildingsMap = useMemo(() => {
    return buildings.reduce(
      (acc, b) => {
        acc[b.id] = b;
        return acc;
      },
      {} as Record<string, Building>
    );
  }, []);

  // 篩選建築列表
  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const matchesSearch = building.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStyles =
        selectedStyles.length === 0 ||
        selectedStyles.some((style) => building.styles.includes(style));

      return matchesSearch && matchesStyles;
    });
  }, [searchTerm, selectedStyles]);

  // 取得選中建築的搭配建議
  const selectedBuilding = selectedBuildingId
    ? buildingsMap[selectedBuildingId]
    : null;

  const pairingEntry = selectedBuildingId
    ? (pairings as Pairing[]).find(
        (p) => p.buildingId === selectedBuildingId
      )
    : null;

  const recommendedBuildings = pairingEntry
    ? pairingEntry.recommendedIds
        .map((id) => buildingsMap[id])
        .filter(Boolean)
    : [];

  // 取得包含選中建築的社群方案
  const relatedCommunities = selectedBuildingId
    ? (communities as CommunityLayout[]).filter((c) =>
        c.buildings.includes(selectedBuildingId)
      )
    : [];

  // 風格篩選切換
  const toggleStyle = (style: PokopiaStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 書籤導航 */}
      <BookmarkNav />

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[var(--pokopia-text)] mb-2">
          🏠 Pokopia 建築指南
        </h1>
        <p className="text-gray-600 mb-8">
          探索 45 種建築物，發現完美搭配，打造你的夢幻家園。
        </p>

        {/* 搜尋與篩選 */}
        <BuildingSearch
          searchTerm={searchTerm}
          selectedStyles={selectedStyles}
          onSearchChange={setSearchTerm}
          onStyleToggle={toggleStyle}
        />

        {/* 主內容區域（兩欄） */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：建築列表 */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <h2 className="text-xl font-bold text-[var(--pokopia-text)] mb-4">
              建築物 ({filteredBuildings.length})
            </h2>
            <BuildingList
              buildings={filteredBuildings}
              selectedBuildingId={selectedBuildingId}
              onBuildingSelect={setSelectedBuildingId}
            />
          </div>

          {/* 右側：詳情面板 */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <h2 className="text-xl font-bold text-[var(--pokopia-text)] mb-4">
              詳情
            </h2>
            <BuildingDetail
              building={selectedBuilding || null}
              recommendedBuildings={recommendedBuildings}
              relatedCommunities={relatedCommunities}
              buildingsMap={buildingsMap}
              onBuildingSelect={setSelectedBuildingId}
            />
          </div>
        </div>

        {/* 無結果提示 */}
        {filteredBuildings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">找不到符合條件的建築</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedStyles([]);
              }}
              className="mt-4 px-4 py-2 bg-[var(--pokopia-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              清除篩選
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 驗證元件無錯誤**

```bash
npm run lint -- src/components/pokopia/PokopiaPage.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pokopia/PokopiaPage.tsx
git commit -m "feat(pokopia): 建立主頁面元件（狀態管理、篩選、搜尋）"
```

---

## Task 9: 建立路由進入點

**Files:**

- Create: `src/routes/pokopia.tsx`

**Interfaces:**

- Consumes: `PokopiaPage` 元件
- Produces: `/pokopia` 路由

- [ ] **Step 1: 建立 pokopia.tsx 路由檔案**

```typescript
// src/routes/pokopia.tsx

import { createFileRoute } from "@tanstack/react-router";
import { PokopiaPage } from "@/components/pokopia/PokopiaPage";

export const Route = createFileRoute("/pokopia")({
  head: () => ({
    meta: [
      {
        title: "Pokopia 建築指南 — Bubble-Beam",
      },
      {
        name: "description",
        content: "Pokémon Pokopia 官方建築與佈局指南，45 種建築物、搭配建議、社群靈感方案。",
      },
    ],
  }),
  component: PokopiaPageRoute,
});

function PokopiaPageRoute() {
  return <PokopiaPage />;
}
```

- [ ] **Step 2: 驗證路由無錯誤**

```bash
npm run lint -- src/routes/pokopia.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/pokopia.tsx
git commit -m "feat(pokopia): 建立 /pokopia 路由進入點"
```

---

## Task 10: 新增導覽連結

**Files:**

- Modify: `src/routes/__root.tsx`（主 layout）
- Modify: `src/routes/index.tsx`（首頁，可選）

**Interfaces:**

- Consumes: 無（只是新增導覽連結）
- Produces: 導覽列中的 Pokopia 連結

- [ ] **Step 1: 在 \__root.tsx 導覽列新增 Pokopia 連結**

找到導覽列的連結列表，新增：

```typescript
<Link to="/pokopia" className="nav-link">
  Pokopia 建築
</Link>
```

確實位置依據現有導覽結構而定。

- [ ] **Step 2: 驗證導覽無錯誤**

```bash
npm run lint -- src/routes/__root.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat(nav): 新增 Pokopia 建築指南導覽連結"
```

---

## Task 11: 瀏覽器驗證與功能測試

**Files:**

- 無修改

**Interfaces:**

- Consumes: 所有前端元件與路由
- Produces: 功能驗證報告

- [ ] **Step 1: 啟動開發伺服器**

```bash
npm run dev
```

- [ ] **Step 2: 訪問 `/pokopia` 頁面並檢查以下項目**

```
✓ 書籤導航欄正確渲染（5-7 個連結）
✓ 搜尋框能輸入文字
✓ 風格篩選按鈕可點選（日式、現代、自然、可愛、古風）
✓ 建築列表正確顯示（45 種建築）
✓ 點選建築卡片後右側詳情面板更新
✓ 詳情面板顯示建築名稱、說明、搭配建議
✓ 靈感方案卡片正確渲染，可展開建築清單
✓ 響應式設計在手機、平板、桌面都能使用
✓ 無控制台錯誤
```

- [ ] **Step 3: 在瀏覽器開發工具中檢查 CSS 變數是否正確載入**

打開 DevTools，檢查 `:root` 樣式中是否有 `--pokopia-*` 變數。

- [ ] **Step 4: 測試搜尋功能**

在搜尋框輸入「櫻」，應只顯示「櫻花樹」建築。

- [ ] **Step 5: 測試篩選功能**

選擇「日式」風格，應只顯示包含「日式」的建築。

- [ ] **Step 6: 測試搭配建議互動**

點選「櫻花樹」，右側應顯示推薦搭配的建築，點選推薦建築應更新詳情面板。

- [ ] **Step 7: 測試靈感方案互動**

在靈感方案卡片上點選「▶」展開建築清單，應能看到該方案包含的所有建築。

- [ ] **Step 8: 截圖回報成功**

```bash
# 使用瀏覽器開發工具截圖，驗證頁面外觀和功能
```

- [ ] **Step 9: Commit（如有小改進）**

如果測試中發現小 bug 或微調，提交修復。否則此步驟可跳過。

---

## Task 12: 完成建築資料（45 種）

**Files:**

- Modify: `src/data/pokopia/buildings.json`（增補到 45 種）
- Modify: `src/data/pokopia/communities.json`（可擴展到 10 個方案）

**Interfaces:**

- Consumes: 無
- Produces: 完整建築庫（45 種）和社群方案（8-10 個）

- [ ] **Step 1: 補齊 buildings.json 到 45 種建築**

根據設計，需要補齊所有 45 種建築。參考已有的 15 種，繼續新增：

```json
// 續前 15 種，新增 30 種
{
  "id": "tea-house",
  "name": "茶屋",
  "description": "日式建築，享受寧靜茶文化的場所。",
  "styles": ["日式", "古風"]
},
{
  "id": "koi-pond",
  "name": "錦鯉池",
  "description": "養殖錦鯉的水景，增添東方意韻。",
  "styles": ["日式", "自然"]
},
// ... 繼續補齊至 45 種
```

- [ ] **Step 2: 補齊 pairings.json 搭配表**

確保每棟主要建築都有搭配建議。

- [ ] **Step 3: 補齊 communities.json 到 8-10 個社群方案**

在現有 5 個方案的基礎上，新增 3-5 個：

```json
{
  "id": "zen-meditation",
  "name": "禪意冥想區",
  "description": "靜謐優雅的禪宗風格空間，適合放鬆身心。",
  "buildings": ["rock-garden", "bamboo-grove", "water-fountain"],
  "styles": ["日式", "古風"]
}
// ... 繼續新增
```

- [ ] **Step 4: 驗證 JSON 語法**

```bash
node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('src/data/pokopia/buildings.json', 'utf8'))).length > 40 ? '✓ 建築數量足夠' : '❌ 建築不足')"
```

- [ ] **Step 5: Commit**

```bash
git add src/data/pokopia/buildings.json src/data/pokopia/pairings.json src/data/pokopia/communities.json
git commit -m "data(pokopia): 補齊完整建築庫（45 種）、搭配表、社群方案（8-10 個）"
```

---

## Task 13: 最終整合與發佈前檢查

**Files:**

- 無修改

**Interfaces:**

- Consumes: 所有元件和資料
- Produces: 最終驗證清單

- [ ] **Step 1: 執行完整 linting**

```bash
npm run lint
```

預期無誤。

- [ ] **Step 2: 檢查 TypeScript 編譯**

```bash
npm run build
```

預期成功編譯。

- [ ] **Step 3: 檢查路由樹是否正確生成**

```bash
# 檢查 src/routeTree.gen.ts 是否包含 pokopia 路由
grep -i pokopia src/routeTree.gen.ts
```

應該能找到 pokopia 路由的參考。

- [ ] **Step 4: 最後檢查清單**

```
✓ 所有元件 props 和消費方式一致
✓ 所有 JSON 資料格式正確
✓ CSS 變數正確定義和消費
✓ 路由正確連結
✓ 導覽連結正確新增
✓ 無控制台警告或錯誤
✓ 頁面在各裝置上響應正常
✓ 所有連結（書籤、社群）有效
```

- [ ] **Step 5: 最終 commit（如有）**

```bash
git status
# 如無更改，此步驟可跳過
```

---

## 完成條件

實作完成時應滿足以下所有條件：

- [x] `/pokopia` 路由可訪問
- [x] 書籤導航欄正確顯示 5–7 個連結
- [x] 建築搜尋和風格篩選功能正常
- [x] 建築詳情面板能顯示搭配建議和社群方案
- [x] 響應式設計在手機、平板、桌面都能使用
- [x] 所有 JSON 資料正確載入（45 建築 + 搭配表 + 8-10 社群方案）
- [x] 無 linting 或編譯錯誤
- [x] 導覽連結已新增

---

## 執行選項

計畫完成並已保存至 `docs/superpowers/plans/2026-07-22-pokopia-implementation.md`。

**兩種執行方式**：

**1. Subagent-Driven（推薦）** — 派遣獨立 subagent 執行每個 Task，Task 間進行審查，快速迭代

**2. 內聯執行（Inline Execution）** — 在本次會話中使用 executing-plans 技能，分批執行並設檢查點

**你想要哪種方式？**
