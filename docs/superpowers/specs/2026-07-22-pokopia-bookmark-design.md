# Pokémon Pokopia 書籤頁設計文件

**日期**：2026-07-22  
**狀態**：⚠️ **已被實作取代（superseded，2026-07-23）**——保留作為設計脈絡的歷史紀錄，**不要照此文件實作**。實際上線的版本見 `d769c4e`／`895b8c9`，差異見文末「實作差異」。

## 概述

在 Bubble-Beam 專案中新增 `/pokopia` 路由頁面，提供 Pokémon Pokopia（生活模擬遊戲）的自策展書籤與互動建築指南。

## 功能需求

### 1. 書籤導航區

- 展示 5–7 個常用連結：Pokopia 官網、官方 Discord、攻略資源、最新活動等
- 上方橫向排列，簡潔風格
- 每個連結包含圖標 + 文字

### 2. 互動建築指南

#### 搜尋與篩選

- **關鍵字搜尋**：輸入建築名字即時篩選建築列表
- **風格篩選**：多選標籤（日式、現代、自然、可愛、古風），支持同時篩選多個風格

#### 建築列表與詳情

- 左側或上方展示 45 種建築的卡片列表
- 每張卡片：建築圖示（emoji 或簡圖）+ 名稱 + 風格標籤
- 點選建築進入右側或下方詳情面板

#### 建築詳情面板

- 建築大圖 + 名稱 + 遊戲內說明
- **搭配建議區塊**：推薦搭配的其他建築（3–5 棟），可點選切換
- **靈感方案區塊**：顯示包含此建築的社群佈局方案卡片（8–10 個精選方案）

#### 社群方案卡片

- 方案名稱 + 風格標籤
- 包含的建築清單（可展開／收起）
- 方案說明文字

## 資料結構

### 檔案位置

```
src/data/pokopia/
  ├── buildings.json          // 建築庫
  ├── pairings.json           // 建築搭配表
  └── communities.json        // 社群佈局方案庫
```

### buildings.json

```typescript
interface Building {
  id: string; // "cherry-tree"
  name: string; // "櫻花樹"
  description: string; // 遊戲內說明
  styles: string[]; // ["日式", "自然"]
}
```

### pairings.json

```typescript
interface Pairing {
  buildingId: string; // 主建築 ID
  recommendedIds: string[]; // 推薦搭配的建築 ID（3–5 個）
}
```

### communities.json

```typescript
interface CommunityLayout {
  id: string; // "jp-garden"
  name: string; // "日式庭院"
  description: string; // 方案說明
  buildings: string[]; // 使用的建築 ID
  styles: string[]; // ["日式"]
}
```

## 前端元件

### 頂層容器

- **PokopiaPage**：主頁面元件

### 子元件

- **BookmarkNav**：書籤導航欄（5–7 個連結）
- **BuildingSearch**：搜尋框 + 風格篩選標籤
- **BuildingList**：建築卡片列表（響應式網格或縱列）
- **BuildingDetail**：右側詳情面板
  - 建築資訊
  - 搭配建議子區塊
  - 靈感方案子區塊
- **CommunityCard**：社群方案卡片

## 路由與導航

- 新增路由：`/routes/pokopia.tsx`（檔案式路由）
- 首頁或導覽列新增 Pokopia 連結
- 詳情使用頁面內狀態管理（React state），不需子路由

## 互動流程

1. 使用者進入 `/pokopia`
2. 書籤導航區顯示快捷連結
3. 建築搜尋區可搜尋或篩選風格
4. 點選建築卡片 → 右側詳情面板更新
5. 詳情面板顯示搭配建議和靈感方案
6. 可點選搭配建議中的其他建築 → 詳情面板切換

## 成功標準

- [ ] `/pokopia` 路由可訪問
- [ ] 書籤導航欄正確顯示 5–7 個連結
- [ ] 建築搜尋和風格篩選功能正常
- [ ] 建築詳情面板能顯示搭配建議和社群方案
- [ ] 響應式設計在手機、平板、桌面都能使用
- [ ] 所有 JSON 資料正確載入

## 資料初始化計畫

1. **building.json**：手工輸入 45 種建築（名稱 + 風格分類）
2. **pairings.json**：手工定義常見搭配組合
3. **communities.json**：策展 8–10 個精選佈局方案

預估資料量可控，不需寫爬蟲或後端。

## 設計決策

- **選擇方案 B（JSON 資料檔）**：資料與代碼分離，便於未來擴展和維護
- **前端篩選**：資料量小（45 建築），前端篩選性能足夠，無需後端
- **無子路由**：詳情用頁面內狀態切換，避免 URL 層級過深

---

## 實作差異（2026-07-23 補記）

實作時發現本文件多處是**憑空發明的資料模型**，實作版改以 pokopia.pokemonhubs.com 的上游社群資料為準。
以下差異以**實作版為準**：

| 本文件                                             | 實作版                                                                                  | 為什麼                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `styles: string[]`（日式／現代／自然／可愛／古風） | `category`（住宅／寶可夢中心／發電／商店設施／裝飾地標）+ `series`（城市／沙地／石頭…） | 原本那組風格 tag 遊戲裡不存在，是憑空捏的；實作版改用遊戲內真實的功能 × 材質分軸    |
| `communities.json`（10 個「社群佈局方案」）        | `collections.json`（8 個主題選集）                                                      | 「社群方案」查無來源，等於捏造；改為本站策展的真實建築組合，UI 明確標示非官方       |
| `pairings.json` 獨立檔                             | 併入 `pokopia.ts`，且每筆多一個 `reason` 欄位                                           | 搭配建議需要說明理由，純 id 陣列不夠                                                |
| 建築圖示用 emoji／簡圖                             | 真實建築圖（pokopiadex 資產），失敗時 `BuildingImage` 退回功能色塊                      | 有真圖就不用 emoji 代打                                                             |
| `BuildingSearch` / `CommunityCard`                 | `BuildingFilters` / `CollectionCard`                                                    | 隨資料模型更名                                                                      |
| 無子路由，單一 `/routes/pokopia.tsx`               | `/routes/pokopia/index.tsx` + `/routes/pokopia/videos.tsx`，另有 `?b=` deep-link 參數   | 多了「影片靈感」分頁（7 個分區、經 oEmbed 查證的 YouTube 影片）；建築詳情可分享連結 |
| —                                                  | 新增 `PokopiaLayout`、`BuildingImage`、`VideoInspiration`、`PokopiaEntry`（首頁入口）   | 本文件未涵蓋                                                                        |

不變的部分：JSON 靜態資料 + 前端篩選、45 棟建築、書籤導航區、搭配建議與選集區塊。
