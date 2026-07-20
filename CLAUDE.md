# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 跨 Agent 共用規則

本專案由 Claude Code 與 Antigravity CLI（`agy`）共同協作。專案根目錄的 `core_rules.md` 是雙方共用的協同規則檔，與本檔案具**同等指令權限**——開始任何工作前，兩份檔案都要讀，衝突時以較新、較明確的規則為準。`core_rules.md` 可能由任一 agent 更新，用來記錄雙方都要遵守的協同事項（例如誰負責哪塊、目前分工狀態）。

## 專案概述

一個非官方粉絲站，由兩塊性質完全不同的內容組成，共用同一個 TanStack Start app：

- **`/`**：波加曼（Piplup）互動遊樂場。全螢幕固定版面、影片背景、手繪塗鴉層、跟隨滑鼠的波加曼狀態機。純好玩，不套攻略頁的 layout。
- **`/decks`、`/decks/$deckId`**：Pokémon TCG Pocket 牌組攻略站。Limitless 賽事數據的 Top 20 即時排行（Wilson score 下界排序）＋人工策展的繁中牌組攻略。可捲動閱讀版面，波加曼不跟到這裡。

設計與實作文件在 `docs/superpowers/specs/`（定案設計）與 `docs/superpowers/plans/`（實作計畫、資料源研究）。動資料管線前先讀 `plans/deck-research.md`。

## 指令

```bash
npm run dev        # 開發伺服器（port 8080）
npm run build      # 正式建置（nitro，預設 target 為 cloudflare）
npm run lint       # eslint
npm run format     # prettier --write .
```

**跑 dev server 一律用 preview_start（config name：`piplup-dev`，見 `.claude/launch.json`），不要用 Bash 起。**

**本專案沒有測試框架**——package.json 沒有 test script，也沒有 vitest/jest。驗證方式是瀏覽器實測：起 preview、讀 console/network、截圖回報（specs 明訂）。不要為了「跑測試」去裝測試框架，除非使用者要求。

### 資料更新指令

```bash
# 重建 /decks 排行榜（上游是 tcg-pocket-tier-list skill）
node <skill-path>/scripts/fetch-tier-list.mjs --json <scratchpad>/tier-list.json
node scripts/update-meta.mjs <scratchpad>/tier-list.json   # → src/data/meta.json，約 40 次連續 fetch，~30s

# 出新擴充包時重建卡片索引（先在 fetch-cards.mjs 的 SETS 加上新 set 代號）
node scripts/fetch-cards.mjs                               # → src/data/cards.json
```

## 架構

### 路由

TanStack Start 檔案式路由。`src/routes/README.md` 有完整慣例表——**不要**建 `src/pages/` 或 `app/layout.tsx`（那是 Next.js/Remix 的）。唯一的 app shell 是 `__root.tsx`。攻略頁包在 `GuideLayout`（含導覽列與版權 footer），首頁刻意不包。

### 首頁的圖層堆疊

`VideoBackdrop`（z-0）→ 淡藍 tint（z-10）→ `Doodles` 塗鴉層（z-20，`pointer-events: none`，不能攔滑鼠否則波加曼跟隨會壞）→ `Piplup`（z-30）。

`VideoBackdrop` 是**雙模式**的：啟動時 fetch `/videos/manifest.json`，存在就用本地 `<video>` 輪播，否則退回 YouTube IFrame API，全部失敗再退到純色 fallback。這是版權取捨——下載的影片檔只供本地播放，`public/videos/*.mp4` 與 `manifest.json` 都在 `.gitignore`，**永遠不要把影片檔提交或部署出去**。

### 資料層（最需要理解的部分）

`/decks` 由兩條獨立資料流匯合而成：

| 檔案 | 性質 | 誰維護 |
|---|---|---|
| `src/data/decks.ts` | 人工策展牌組：繁中攻略、對戰思路、tier S–C | 手寫 |
| `src/data/meta.json` | Limitless Top 20 即時排行：Wilson 下界、勝率、使用率、代表牌表；tier 可到 D | `scripts/update-meta.mjs` 生成 |
| `src/data/limitless-map.json` | 兩者的橋樑：策展 id ↔ Limitless 英文牌組名 | 手寫 |
| `src/data/cards.json` | 卡片索引 `id → {nameEN, imageUrl}` | `scripts/fetch-cards.mjs` 生成 |

`update-meta.mjs` 用 `limitless-map.json` 的 `limitlessName` 反查，替有攻略的排行列打上 `curatedId`，前端才知道哪一列可以連到詳情頁。新增策展牌組時，`decks.ts` 和 `limitless-map.json` 要一起改，否則該牌組在排行榜上不會出現連結。

**生成檔不要手改**：`cards.json`、`meta.json`、`routeTree.gen.ts`。

### 卡片 id 慣例

`{SET}-{number}`，**不補零**（`B3b-41`、`PROMO-A-7`）。Limitless 用 `P-A`／`P-B` 表示 promo，本站用 `PROMO-A`／`PROMO-B`——轉換在 `update-meta.mjs` 的 `toCardId()`。卡圖與卡名來自 flibustier 的社群資料庫（TCGdex 進度落後，缺 B3 之後的 set，已棄用）。`getCard()` 查不到或圖載入失敗時，`CardImage` 會退成文字 placeholder，不要拿掉這層保護——排行榜的牌表來自上游，隨時可能出現本地索引沒有的新卡。

### imggen 只是資料來源，不是前端功能

`update-meta.mjs` 解析牌表的方式，是從 Limitless 選手牌表頁抓那個隱藏 imggen 表單的 JSON payload（`[{count,name,set,number}]`）——這是**抓取管線**的一環，`MetaDeckCard` 的 `set`/`number` 就是這樣來的，別把它當冗餘欄位刪掉。

前端曾經有個「在 Limitless 以圖片開啟」按鈕，把同一份 payload POST 回 `pocket.limitlesstcg.com/tools/imggen`。**已移除**：上游那個端點現在只回空白頁，而排行榜本來就直接渲染卡圖了。不要重新加回來，除非確認上游修好。

### 錯誤處理管線

`src/server.ts` 包住 TanStack 的 server entry，專門處理 h3 把 in-handler throw 吞成 `{"unhandled":true,"message":"HTTPError"}` 的情況（那種錯 try/catch 抓不到）；`src/start.ts` 另有 requestMiddleware 層；`src/lib/` 下的 `error-capture` / `error-page` / `lovable-error-reporting` 支撐這條路徑。改 SSR 進入點時要保住這層。

### 建置設定

`vite.config.ts` 用 `@lovable.dev/vite-tanstack-config`，它**已經內含** TanStack Start、React、Tailwind、tsConfigPaths、nitro、`@/` alias 等 plugin。手動再加一次會因 plugin 重複而讓 app 掛掉。

## 慣例

**語言分工**：介面文字與攻略文用繁體中文；牌組名與卡名保留 Limitless 的英文原文（專有名詞，玩家在 Limitless 上看到的就是這個）；`decks.ts` 的策展牌組名則是繁中譯名。程式碼識別字一律英文。

**攻略頁配色**是硬編的水系淡藍（`#2a6f97` 深藍字、`#5fa8d3` 邊框、`#bfe3f5` 淺藍、`#eef7fc` 背景），不是走 `styles.css` 的 Tailwind theme token。改攻略頁 UI 時沿用這組色碼保持一致；`styles.css` 的 oklch design system 是 Lovable 模板帶來的，攻略頁沒在用。

**Lovable 連結**：本專案連到 Lovable（見 `AGENTS.md`）。不要改寫已推送的 git 歷史——force push、rebase、amend、squash 都會弄壞 Lovable 端的歷史。目前 repo 沒有設 git remote，同步狀態待使用者決定。

**相依安裝**：`bunfig.toml` 設了 `minimumReleaseAge = 86400`（24 小時供應鏈防護，擋掉剛發布的版本）。要加例外到 `minimumReleaseAgeExcludes` 前先問使用者。
