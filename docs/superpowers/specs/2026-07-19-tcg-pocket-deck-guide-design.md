# TCG Pocket 牌組攻略站 設計文件

日期：2026-07-19
狀態：已與使用者確認定案

## 目的

在現有的波加曼互動頁專案上，擴充一個 **Pokémon TCG Pocket（ポケポケ）牌組攻略站**：以人工策展的方式收錄熱門牌組，每套牌用真實卡圖呈現牌表，並附繁體中文攻略（tier、能量、玩法、對戰思路）。用途為個人與朋友使用，不公開營利。

參考站（僅參考呈現形式，不複製其數據）：
- Limitless TCG Pocket decks：`https://play.limitlesstcg.com/decks?game=pocket`
- pokemon-zone decks：`https://www.pokemon-zone.com/decks/`

**關鍵取捨**：參考站的 tier／勝率／使用率是它們自建的賽事數據管線算出來的，沒有免費 API 可取，個人站無法複製。因此本站採**人工策展**：牌組與 tier 由人工整理維護；卡牌資料（卡名、卡圖）則取自免費的 [TCGdex API](https://tcgdex.dev/tcg-pocket)。

## 資料來源驗證（已確認）

> **修訂（2026-07-19，經使用者確認）**：實作研究發現 TCGdex 的 TCG Pocket 僅收錄到 B2a，缺當前 meta 必需的 B3/B3a/B3b/PROMO-B。資料源改為：
> - 卡片資料：`flibustier/pokemon-tcg-pocket-database`（`.../main/dist/cards/{SET}.json`，覆蓋 A1–B3b + PROMO-A/B）
> - 卡圖：`flibustier/pokemon-tcg-exchange`（`.../main/public/images/cards-by-set/{SET}/{number}.webp`，實測跨 set 全部 200）
> - 卡 id 慣例：`{SET}-{number}` 不補零（`B3b-41`、`PROMO-A-7`）
> 詳見 `docs/superpowers/plans/deck-research.md`。下方原始 TCGdex 驗證記錄保留供參考。

- TCGdex set `A1`（Genetic Apex，2024-10-30 發行）回傳 286 張卡，每張含 `id`（如 `A1-001`）、`name`、卡圖。
- 卡圖 URL 格式：`https://assets.tcgdex.net/en/tcgp/{set}/{num}/high.webp`（例：`.../en/tcgp/A1/036/high.webp`）。
- 繁中 locale（`zh-tw`）對 TCG Pocket 回 404 → **TCGdex 無繁中卡名**（flibustier 資料庫亦僅英文卡名）。因此：卡名預設英文；卡面美術通用（不分語言）；攻略文字與站點介面用繁體中文。

## 總體架構

延續現有技術棧（TanStack Start + React + Tailwind，Lovable 專案 + 本地 repo 雙版本）。以檔案式路由新增攻略站區塊，與現有波加曼互動頁並存。

### 站點結構（路由）

| 路由 | 內容 |
|------|------|
| `/` | 現有波加曼互動頁，維持原樣（全螢幕固定互動遊樂場）。新增一個進入攻略站的入口連結。 |
| `/decks` | 牌組列表：依 tier 分組的牌組卡牆。 |
| `/decks/$deckId` | 牌組詳情：真實卡圖牌表 + tier + 能量 + 難度 + 攻略文 + 對戰思路。 |

攻略頁（`/decks`、`/decks/$deckId`）共用一個乾淨、可捲動、適合閱讀的 `GuideLayout`（含導覽列，互通首頁與攻略）。**波加曼不跟隨到攻略頁**，避免干擾閱讀。首頁維持原本的全螢幕互動排版，不套 `GuideLayout`。

## 資料模型

### 牌組（策展內容，靜態存於 repo）

存放於 `src/data/decks/`（每套牌一個檔或集中一個模組皆可，實作時決定）。每套牌結構：

```ts
interface Deck {
  id: string;            // 網址用 slug，例 "miraidon-magnezone"
  name: string;          // 繁中牌組名（人工撰寫）
  tier: "S" | "A" | "B" | "C";  // 人工評定
  energy: EnergyType[];  // 能量屬性，例 ["Lightning"]
  cards: DeckCard[];     // 牌表
  summary: string;       // 一句話簡介（繁中）
  strategy: string;      // 玩法攻略，繁中 markdown
  matchups?: Matchup[];  // 對戰思路（可選）
  difficulty: "易" | "中" | "難";
}

interface DeckCard {
  id: string;   // 參照 TCGdex 卡 id，例 "A1-036"
  count: number;
}

interface Matchup {
  vs: string;   // 對手牌組名或描述
  note: string; // 繁中思路
}
```

### 卡片索引（本地）

以一次性腳本 `scripts/fetch-cards.ts` 從 TCGdex 抓取「策展牌組所涵蓋到的 set 之完整卡池」（抓整個 set 而非逐張，這樣日後從同一 set 加卡不必重跑腳本），寫入 `src/data/cards.json`：

```ts
interface CardEntry {
  id: string;       // "A1-036"
  nameEN: string;   // "Charizard ex"
  nameTC?: string;  // 人工補上的繁中對照名（可選）
  imageUrl: string; // TCGdex CDN high.webp
}
```

runtime 不打 TCGdex API（名稱走本地索引）；卡圖由瀏覽器向 TCGdex CDN 載入。

## 元件切分

| 元件 | 職責 |
|------|------|
| `GuideLayout` | 攻略區共用殼：導覽列（首頁／牌組）、頁尾、可捲動的閱讀排版。 |
| `DeckList`（route `/decks`） | 依 tier 分組，渲染 `DeckCard` 網格。 |
| `DeckCard` | 牌組縮圖卡：主 Pokémon 卡圖、牌組名、`TierBadge`、`EnergyIcon`，連往詳情。 |
| `DeckDetail`（route `/decks/$deckId`） | 標頭（名稱／tier／能量／難度）＋ `Decklist` ＋ 攻略 markdown ＋ 對戰思路。 |
| `Decklist` | 牌表：卡圖網格，每張含張數標示，用 `CardImage`。 |
| `CardImage` | 依卡 id 從本地索引取 URL 渲染卡圖，含載入失敗 fallback（占位卡背）。 |
| `TierBadge` / `EnergyIcon` | 小型呈現元件。 |
| `cards` 資料模組 | 載入 `cards.json`，提供 `getCard(id)` 查詢。 |
| `decks` 資料模組 | 載入牌組資料，提供 `listDecks()` / `getDeck(id)`。 |

## 資料流

- **牌組資料**：靜態本地（打包進 bundle）→ 無 runtime API 依賴 → 快、離線可讀、符合「策展」模型。
- **卡片名稱**：本地 `cards.json`（由腳本一次性從 TCGdex 產生）。
- **卡圖**：TCGdex CDN 圖檔，瀏覽器 `<img>` 載入（線上與本地開發皆用 CDN；不為攻略頁做完整離線圖片鏡像）。

## 初始內容（種子）

我先依目前公開環境知識，草擬 4–5 套熱門牌組（含繁中攻略、tier、牌表），讓站不空。使用者之後編輯 `src/data/decks/` 即可增修。初稿方向（實作時以當下環境為準，並向使用者確認名單）：Miraidon ex Magnezone 等當前熱門 archetype。

## 語言

- 站點介面 + 攻略內容：繁體中文（人工撰寫）。
- 卡名：英文（TCGdex 無 TCG Pocket 繁中）；`cards.json` 可人工補 `nameTC` 對照。
- 卡面美術：英文卡圖（美術通用，辨識不受語言影響）。

## 錯誤處理

- 卡圖載入失敗（404／網路）→ `CardImage` 顯示占位卡背，不破圖。
- 未知 `deckId` → 「找不到這套牌」not-found 狀態 + 返回 `/decks` 連結。
- 牌表引用的卡 id 不在 `cards.json` → 優雅跳過或顯示占位，不整頁崩潰。
- TCGdex CDN 全掛 → 牌表退化為文字卡名清單（仍可讀）。

## 驗證方式

無測試框架，沿用瀏覽器實測（開發伺服器 `http://localhost:8080`）：

1. `/decks` 依 tier 分組正確顯示牌組卡牆。
2. 點入 `/decks/$deckId` 顯示真實卡圖牌表、tier、能量、攻略文、對戰思路。
3. 導覽列首頁↔攻略互通；首頁波加曼互動不受影響、`GuideLayout` 未套到首頁。
4. `CardImage` 卡圖 fallback 生效（模擬壞 URL）。
5. 未知 deckId 顯示 not-found。
6. RWD（手機／桌面）牌表網格排版正常。

## 範圍外（明確排除）

- 即時 meta／勝率／使用率聚合（無免費資料源，YAGNI）。
- 使用者帳號、組牌／存牌工具（本站為閱讀型攻略站）。
- 實體 PTCG 與主系列寶可夢遊戲攻略（暫只做 TCG Pocket，日後可各自獨立擴充）。
- 攻略頁卡圖的完整離線鏡像（卡圖走 CDN 即可）。
