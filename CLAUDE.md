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

# 改完 meta.json 或 decks.ts 後重算「本站實際引用的卡片」子集
node scripts/subset-cards.mjs                              # → src/data/cards.used.json
node scripts/subset-cards.mjs --check                      # 只檢查是否過期（不寫檔）

# 重產排行榜的牌組匯入 QR（改完 meta.json 或 deck-energy.json 後）
npm run gen:deck-qr                                        # → public/deck-qr/*.png + src/data/deck-qr.json
node --experimental-strip-types scripts/generate-deck-qr.mjs --check   # 只檢查是否過期

# 重建 /pokopia/habitats 棲息地索引（約 250 次連續 fetch，~2 分鐘）
node scripts/fetch-habitats.mjs                            # → src/data/pokopia/habitats.json

# 重建 /pokopia/cooking 料理索引（3 次 fetch，數秒）
node scripts/fetch-cooking.mjs                             # → src/data/pokopia/cooking.json
```

`fetch-habitats.mjs` **同時抓兩個上游**：`pokopia.pokemonhubs.com` 給「棲息地 → 出沒寶可夢」，
`pokopiaguide.com/zh/habitat` 給建造材料（hubs 沒有這塊）。兩站是不同的粉絲翻譯、名稱對不起來，
所以繁中名一律採 hubs，材料靠**編號（本篇）與寶可夢 slug 集合相似度（DLC）**併過去——
腳本結尾會印出未配對清單，改完解析邏輯要看那份清單有沒有暴增。

DLC「泡泡海底」那 36 筆的材料**不走 guide**：guide 只收錄其中 20 筆，而且有數筆漏列
（獨木舟碼頭少了 Floating logs、被丟棄的寶物少了 Big treasure chest），所以改由手寫的
`src/data/pokopia/habitat-materials.json` **覆寫**——它是這條管線裡唯一手動維護的檔，
比照 `limitless-map.json`，資料來源與繁中／英文的取捨規則寫在檔案自己的 `_comment` 裡。
本篇 209 筆仍然完全以 guide 為準。DLC 出新區域時要自己補這個檔，`fetch-habitats.mjs`
結尾會把「overlay 對不到的 slug」與「最後仍然沒有材料的 DLC」印出來。

`fetch-cooking.mjs` 也是雙上游，但分工反過來：**結構取 guide、名字取 hubs**。
guide（`pokopiaguide.com/zh/cooking`）有全 34 道含 DLC 的結構化欄位（口味、供奉效果、
售價、所需特技），資料直接躺在 Next.js 的 RSC flight payload 裡，不用刮 DOM；但它的莓果
譯名整組是自譯而且對錯（把 Leppa 譯成「蘋野果」，官方是「慕柑果」），所以繁中名一律
用 hubs 的官方譯名，靠手寫的 `cooking-overrides.json` 對接兩邊的 slug。hubs 沒收錄的
DLC 10 道退回 guide 名並標 `nameSource: "guide"`，頁面上顯示「暫譯」。

**料理等級（1／2／3 級）是本站定義的呈現方式**，上游沒有這個欄位：供奉效果句寫
「更容易」的是 3 級、「較容易」是 2 級，生食材直接供奉是 1 級。這條規則有兩個獨立佐證
（guide 的售價 500 那批、gamewith 的「かなり」清單，兩邊算出來是同一批 11 道），
腳本結尾會自動對帳售價與等級，不一致就印警告——那代表上游改了資料，要回頭確認規則。

`subset-cards.mjs` 與 `generate-deck-qr.mjs` 已掛在 `package.json` 的 `prebuild`，
`npm run build` 會自動重跑，所以正式建置產物一定是最新的。手動在 dev 下改資料時才需要自己跑一次。
QR 那支特別不能漏：`meta.json` 換了新排行卻沒重產 QR 的話，玩家掃到的是**上一份快照的牌表**，
畫面上完全看不出異狀——所以它跟卡片子集一樣走 prebuild，不是「記得要跑」的口頭約定。

## 架構

### 路由

TanStack Start 檔案式路由。`src/routes/README.md` 有完整慣例表——**不要**建 `src/pages/` 或 `app/layout.tsx`（那是 Next.js/Remix 的）。唯一的 app shell 是 `__root.tsx`。攻略頁包在 `GuideLayout`（含導覽列與版權 footer），首頁刻意不包。

### 首頁的圖層堆疊

`VideoBackdrop`（z-0）→ 淡藍 tint（z-10）→ `Doodles` 塗鴉層（z-20，`pointer-events: none`，不能攔滑鼠否則波加曼跟隨會壞）→ `Piplup`（z-30）。

`VideoBackdrop` 是**雙模式**的：啟動時 fetch `/videos/manifest.json`，存在就用本地 `<video>` 輪播，否則退回 YouTube IFrame API，全部失敗再退到純色 fallback。這是版權取捨——下載的影片檔只供本地播放，`public/videos/*.mp4` 與 `manifest.json` 都在 `.gitignore`，**永遠不要把影片檔提交或部署出去**。

### 資料層（最需要理解的部分）

`/decks` 由兩條獨立資料流匯合而成：

| 檔案                          | 性質                                                                                 | 誰維護                          |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------- |
| `src/data/decks.ts`           | 人工策展牌組：繁中攻略、對戰思路、tier S–C                                           | 手寫                            |
| `src/data/meta.json`          | Limitless Top 20 即時排行：Wilson 下界、勝率、使用率、代表牌表；tier 可到 D          | `scripts/update-meta.mjs` 生成  |
| `src/data/limitless-map.json` | 兩者的橋樑：策展 id ↔ Limitless 英文牌組名                                           | 手寫                            |
| `src/data/cards.json`         | 完整卡片索引 `id → {nameEN, imageUrl, deckBuilderNr}`，3761 張。**只給腳本查表用，前端不要 import** | `scripts/fetch-cards.mjs` 生成  |
| `src/data/cards.used.json`    | 上面的子集，只含本站實際引用的約 150 張。`cards.ts` import 的是這個                  | `scripts/subset-cards.mjs` 生成 |
| `src/data/pokemon-names.json` | 寶可夢英文名 → 官方繁中名，供排行榜牌組名繁中化（`deck-name.ts`）                    | 手寫                            |
| `src/data/deck-energy.json`   | 排行榜牌組要設定的能量（只補沒有攻略的那幾副）                                       | 手寫                            |
| `src/data/deck-qr.json`       | 牌組名 → 匯入代碼、圖檔名、能量；搭配 `public/deck-qr/*.png`                         | `scripts/generate-deck-qr.mjs` 生成 |

`update-meta.mjs` 用 `limitless-map.json` 的 `limitlessName` 反查，替有攻略的排行列打上 `curatedId`，前端才知道哪一列可以連到詳情頁。新增策展牌組時，`decks.ts` 和 `limitless-map.json` 要一起改，否則該牌組不會有連結。

`curatedId` 是抓取當下烤進 `meta.json` 的，但寫攻略的節奏跟抓排行榜的週期是兩回事，所以 `meta.ts` 的 `getMeta()` 在讀取時用同一份 `limitless-map.json` **補（不覆寫）**缺的 `curatedId`：新攻略當天就有連結，不必為了掛連結去重跑 `update-meta.mjs`（那會洗掉 `previousRank` 的基準）。這層是刻意的冗餘，不要當成重複邏輯刪掉；下次正常抓取後它自動變成 no-op。

**生成檔不要手改**：`cards.json`、`cards.used.json`、`meta.json`、`deck-qr.json`、
`public/deck-qr/*.png`、`routeTree.gen.ts`。

### 牌組匯入 QR

排行榜每一列展開後有一張「匯入用 2 次元代碼」，掃進遊戲就是那副牌（`DeckQrPanel`）。
代碼格式是社群逆向的（[Nirostar/ptcgp-deck-qr](https://github.com/Nirostar/ptcgp-deck-qr)，MIT），
實作在 `src/lib/deck-code.ts`：訓練家段＋寶可夢段＋能量段，每張卡三個位元組存
`deckBuilderNr × 10`，最後 base64。沒有簽章也沒有 checksum，所以能離線算。

兩條隱性相依要知道：

- **`deckBuilderNr` 是從上游素材檔名反推的**（`cPK_10_000010_…` → 1、`cTR_…` → +1,000,000），
  不是上游自己的欄位。上游改檔名慣例就會整批推不出來——`fetch-cards.mjs` 結尾會把推不出來的
  卡片印出來，那份清單正常應該是空的。同一張卡的不同印刷共用同一個編號（遊戲掃描時自動選
  最高稀有度），所以卡圖用哪個版本跟代碼無關。
- **能量只能人工填**。Limitless 的牌表頁沒有能量欄位，而靠寶可夢屬性反推在龍系／無色系必定
  失敗（`Dragonair Altaria` 整隊都是龍與無色，實際要放火＋雷）。判定看招式費用實際需要哪幾種
  基本能量，無色費用不算。有攻略的牌組直接沿用 `decks.ts` 的 `energy`，其餘補
  `deck-energy.json`；**沒填就不出 QR**，寧可少一張圖也不要給玩家能量錯的牌組。
  `Dragon` 與 `Colorless` 在代碼格式裡沒有 id，出現一律當成「還沒填」。

**前端不要 `import cards.json`**：完整索引約 580 KB，靜態 import 會整包進 client bundle
（實測曾是 562.7 KB，比整個 React + router 還大），而全站只用到約 100 張。
要查卡一律走 `getCard()`（讀的是 `cards.used.json`，約 19 KB）。

**排名變化（`previousRank`）的基準是「上一份 `meta.json`」**：`update-meta.mjs` 覆寫前會先把現有的 `meta.json` 讀進來當比較對象，牌組名對得上就記舊名次，對不上記 `null`（＝新進榜），沒有舊檔則整批不寫這個欄位、前端留白。**別為了「重跑一次確認」而連續跑兩次**——第二次會拿第一次的產出當基準，把真正的升降全洗成持平，而且救不回來（要復原只能從 git 取回上一版 `meta.json`）。

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

**語言分工**：介面文字與攻略文用繁體中文；卡名保留 Limitless 的英文原文（專有名詞，玩家在 Limitless 上看到的就是這個）；`decks.ts` 的策展牌組名是繁中譯名。程式碼識別字一律英文。

排行榜的牌組名（上游只有英文）**繁中為主、英文原名小字並列**：`deck-name.ts` 的 `toDeckNameTC()` 拿 `pokemon-names.json` 逐字翻，翻不出來就整串退回英文。英文那行不要拿掉——玩家拿它去 Limitless 對牌表，翻不出繁中時它也是唯一的顯示內容。譯名體例沿用 `decks.ts`：**Mega 保留原文**（官方譯作「超級」，但站內 26 套策展名寫的都是 `Mega阿勃梭魯ex`）、**ex 緊貼名字**。新寶可夢沒譯名時補 `pokemon-names.json`，**不要自己編譯名**，查官方台灣圖鑑。

**攻略頁配色**是硬編的水系淡藍（`#2a6f97` 深藍字、`#5fa8d3` 邊框、`#bfe3f5` 淺藍、`#eef7fc` 背景），不是走 `styles.css` 的 Tailwind theme token。改攻略頁 UI 時沿用這組色碼保持一致；`styles.css` 的 oklch design system 是 Lovable 模板帶來的，攻略頁沒在用。

**Lovable 連結**：本專案連到 Lovable（見 `AGENTS.md`）。不要改寫已推送的 git 歷史——force push、rebase、amend、squash 都會弄壞 Lovable 端的歷史。remote `origin` 指向 `https://github.com/hsjinde/Bubble-Beam.git`，與 Lovable 端的同步狀態待使用者確認。

**相依安裝**：`bunfig.toml` 設了 `minimumReleaseAge = 86400`（24 小時供應鏈防護，擋掉剛發布的版本）。要加例外到 `minimumReleaseAgeExcludes` 前先問使用者。

## Agent skills

### Issue tracker

Issues 走 GitHub Issues（`hsjinde/Bubble-Beam`），用 `gh` CLI 操作。See `docs/agents/issue-tracker.md`.

### Triage labels

沿用五個標準角色的預設標籤（`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`），標籤字串與角色同名。See `docs/agents/triage-labels.md`.

### Domain docs

單一 context：根目錄 `CONTEXT.md` ＋ `docs/adr/`（目前兩者都尚未建立，需要時才由 `/domain-modeling` 產生）。See `docs/agents/domain.md`.
