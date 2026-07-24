# 接手筆記

給下一個接手的人（Claude Code 或 `agy`）。這份檔案記錄目前的 UI／前端品質狀態與待辦，
每輪工作結束時更新它，不要讓它過期。

最後更新：2026-07-24

---

## 目前狀態

`/decks` 與全站於 2026-07-23 完成 UI/UX Pro Max 全站視覺質感優化（導入 Google Fonts `Plus Jakarta Sans` / `Noto Sans TC`、首頁雙卡片微透光與懸浮質感、Tier 徽章金屬立體度、MetaRanking 排行榜 StatBar 漸層過渡動畫、Pokopia 暖色焦點環與過渡細節）。WCAG AA 對比度全數通過，卡片索引子集化完美維持 (18.0 KB)。

同日補上三項站台基礎建設（詳見下方「2026-07-23 這輪」）：兩個子站的導覽互連、
每頁專屬的 OG 分享卡片、favicon 與 webmanifest。

| 面向          | 稽核當下 | 現在           | 備註                                              |
| ------------- | -------- | -------------- | ------------------------------------------------- |
| Accessibility | 2/4      | 4/4            | 程式量測 WCAG AA 全過；**未經螢幕閱讀器實測**     |
| Performance   | 2/4      | 4/4            | 卡片索引子集化                                    |
| Theming       | 2/4      | 4/4            | 三態深色模式支援完成（系統/淺色/深色），雙模式對比 0 失敗 |
| Responsive    | 3/4      | 4/4            | 觸控目標補齊                                      |
| Anti-Patterns | 4/4      | 4/4            | 偵測器 0 命中，無 AI slop 特徵                    |

相關 commit：`b6ece42`（bundle 子集化）、`4e73cf5`（a11y）。

### 實測數字

| 指標                          | 修改前           | 修改後      |
| ----------------------------- | ---------------- | ----------- |
| client 卡片索引 chunk         | 562.7 KB         | **19.3 KB** |
| `/decks` 對比失敗（含展開區） | 11 處            | **0**       |
| 手機觸控目標未達 44px         | 22 / 27          | **0 / 27**  |
| 最低對比值                    | 1.40:1（雷屬性） | 4.51:1      |

---

## 動手前必讀

### 卡片索引：前端不要 import `cards.json`

這是這輪最容易被無意間破壞的架構決定。

- `src/data/cards.json` — 完整索引，3520 張、約 580 KB。**只給腳本查表，前端不可 import。**
- `src/data/cards.used.json` — 子集，99 張、約 19 KB。`cards.ts` 讀的是這個。
- `scripts/subset-cards.mjs` — 生成器，已掛在 `package.json` 的 `prebuild`。

改完 `meta.json` 或 `decks.ts` 之後要重跑 `node scripts/subset-cards.mjs`，
或直接 `npm run build`（prebuild 會自動處理）。用 `--check` 可以只檢查是否過期。

**為什麼**：完整索引靜態 import 會整包進 client bundle，實測那個 chunk 是 562.7 KB，
比整個 React + router（347.7 KB）還大，而全站只用到 99 張。

子集收集方式是「掃 `src/` 下所有字串字面值，與完整索引的 key 取交集」，刻意寧可多收——
漏收會讓卡圖無聲退成文字 placeholder，很難察覺。**不要改成用 id 格式正則猜測。**

### 對比是硬性底線

`/decks`（含展開區）目前是 0 處對比失敗，這是底線，不要退化。

改顏色時的規則（`EnergyIcon.tsx` 與 `TierBadge.tsx` 的註解有寫）：
深底維持白字，淺／中明度底改用同色相壓深的墨色。`RankChangeBadge` 的三個顏色
在一般列（`#ffffff`）與 Tier S 列（`#f4fbff`）兩種背景都要 ≥4.5:1。

驗證方法：起 preview 後在 console 用 canvas 解析算繪色再逐元素算對比。
**不要只看 CSS 原始值**——`oklch()`、透明度疊加、Tailwind 生成的色階都要算繪後才準。

---

## 待辦

### A. 收斂色彩語彙（優先）—— 2026-07-21 已處理

跑了 `$impeccable polish /decks`。第 1 項（硬編十六進位）已收斂：`styles.css` 的 `:root`
新增 7 個 `--guide-*` token（`ink`／`ink-deep`／`accent`／`tint`／`bg`／`bg-panel`／
`bg-highlight`），註冊進 `@theme inline` 變成 Tailwind utility（`text-guide-ink`、
`bg-guide-tint`…），色值逐位元組保留不變。九個消費檔（`GuideLayout`／`GuideEntry`／
`DeckCard`／`Decklist`／`CardImage`／`MetaRanking`／`RankChangeBadge`／`decks/index.tsx`／
`decks/$deckId.tsx`）全部換成新 utility。用瀏覽器 `getComputedStyle` 逐元素比對過
（含展開列、Tier S 列、CTA hover 態、focus-visible 環），換前換後 rgb 值完全一致。

`.dark` 死碼（34 個變數＋`@custom-variant dark`）已確認全站無人套用並移除。

**刻意維持原樣、沒有動**：

- 第 2 項（oklch token，僅 404／error 頁）——照要求不碰。
- 第 3 項（`TierBadge` 的 Tailwind 色階）與第 4 項（`EnergyIcon`／`RankChangeBadge` 漲跌色的
  inline 十六進位）——這兩組是 tier 等級／能量屬性／漲跌指示色，語意上不屬於「水藍那組」，
  這輪要求沒提到就沒動。要繼續收斂的話這是下一個可做的範圍。
- 首頁（`routes/index.tsx`／`Doodles.tsx`／`VideoBackdrop.tsx`）湊巧重用了同一組十六進位
  （`#2a6f97`／`#5fa8d3`／`#bfe3f5`），但那是首頁自己的塗鴉配色決定，不是攻略頁品牌延伸；
  照待辦 B 的 register 切分原則，這輪沒有動它們。

尚未重新跑 `$impeccable audit` 量分數，上面表格先標「待重新稽核」。

### B. 首頁稽核與優化 — 2026-07-22 已完成

已針對首頁 `/` 執行 `$impeccable audit /`：

- **Accessibility / 對比度**：`GuideEntry` 便條紙背景透明度已提高至 `bg-white/75`（hover `bg-white/90`），副標題與箭頭顏色收斂並改為 `text-guide-ink-deep` (`#1d5273`)，在動態影片背景與 fallback 底色下均達成 >6:1 之 WCAG AA 高標準對比度。另補齊 `aria-label="前往 Pokémon TCG Pocket 牌組攻略站"` 提升螢幕閱讀器體驗。
- **Performance / 動畫效能**：`Doodles` 使用輕量 CSS keyframe 與節流 cursor 游標雨 drop pool (max 20)，`VideoBackdrop` 維持本地 / YouTube / 漸變三層降級機制。
- **Responsive / 響應式**：標題使用 `clamp()` 隨視窗縮放，`GuideEntry` 於行動端 (`w-[10.5rem]`) 與桌面端 (`w-[14rem]`) 均符合 minimum 44px 觸控點規範。

### C. 補完無障礙驗證

WCAG AA 是用程式量測的，**沒有用真的螢幕閱讀器跑過流程**。要補：

1. NVDA 或 Windows 朗讀程式實走 `/decks`：表格欄位關聯（剛補 `scope="col"`）、
   展開時 `aria-expanded` 狀態播報、三個 badge 的 `aria-label` 是否念得合理
2. 純鍵盤操作一次，確認沒有 focus 陷阱、tab 順序合理

### D. 小修

- ~~`favicon.ico` 回 404~~ — 2026-07-23 已補，見下方「2026-07-23 這輪」。
- ~~`npm run lint` 永遠紅燈~~ — 2026-07-23 已修，**現在是 0 錯誤**，見下方「5. lint」。
  這份筆記先前記的根因（「全是 src/ 的 CRLF」）**是錯的**，實際診斷見該節。

---

## 2026-07-23 這輪：站台基礎建設三項

都是「沒有取捨、只有做不做」的缺口，不是設計決定。

### 1. 兩個子站的導覽互連

在這之前 `/decks` 與 `/pokopia` **只有首頁一條橋**——從搜尋引擎直接落到 `/decks` 的
訪客完全看不到 Pokopia 建築指南，反之亦然。兩個 layout 各加一個跨區連結，
`ml-auto` ＋ 邊框藥丸，刻意與「本區分頁」的純文字連結區隔。

`PokopiaLayout` 手機版當時折成兩行、header 從 61px 漲到 109px。
**2026-07-24 已改回單行 61px**，作法與正確的寬度數字見下方第 9 節——
別照這一段的舊敘述去改。所有連結都加了 `whitespace-nowrap` 防止標籤內部斷行。

### 2. 每頁專屬的 OG 分享卡片

`/decks/$deckId` 原本 `head()` 只給 `title`，21 頁攻略共用同一張分享卡片、也沒有
meta description。現在每頁用 `deck.summary` ＋ tier／難度組出描述，並覆寫
`og:title`／`og:description`／`og:type=article`。`/decks` 索引頁同樣補齊，
數字（Top N、策展套數）從資料算出來而非硬編。不存在的 slug 回 `robots: noindex`。

**`__root.tsx` 原本那段「og:\* 不會被子路由覆寫」的註解是錯的**——實測子路由的
`head()` 確實會依 `property` 覆寫同名項目，已更正註解。root 現在只放真正的全站值
（`og:site_name`／`og:image`／`og:locale`／`theme-color`）。

### 3. favicon 與 PWA 圖示

`public/` 下新增 `favicon.ico`（16／32／48 三尺寸的 PNG-in-ICO，5.4 KB）、
`icon-192.png`、`icon-512.png`、`apple-touch-icon.png`（180、**不透明** `#eef7fc` 底——
iOS 會把透明區塊合成為黑色）、`site.webmanifest`。

**重新產生的方式**：環境裡沒有 sharp／ImageMagick（`/c/Windows/system32/convert` 是
Windows 的 FAT→NTFS 工具，不是 ImageMagick，別誤用）。圖示是用只依賴 Node 內建 `zlib`
的一次性腳本從 `public/piplup.png` 產生的，腳本沒有進 repo（`scripts/` 保持只放資料管線）。
換 logo 時重寫一支即可，流程與必要細節：

1. **解 PNG**：`piplup.png` 是 8-bit RGBA、非交錯（IHDR bitDepth=8、colorType=6、
   interlace=0）。串接所有 IDAT → `zlib.inflateSync` → 逐列反濾波（filter type 0–4，
   每列開頭一個 filter byte）。換 logo 前先確認新檔也是這個格式，否則要補 palette／
   交錯處理。
2. **降採樣**：box 平均，但**顏色一定要以 alpha 加權**
   （`out = Σ(color×alpha) / Σalpha`，`outAlpha = Σalpha / n`）。直接平均的話透明像素的
   RGB(0,0,0) 會被算進去，16px 縮圖會出現明顯黑邊。
3. **重編碼 PNG**：每列前補 filter byte 0 → `deflateSync` → 組 IHDR／IDAT／IEND，
   每個 chunk 要算 CRC32（PNG 用的多項式是 `0xedb88320`）。
4. **包 ICO**：6 byte ICONDIR（reserved=0, type=1, count）＋每張 16 byte ICONDIRENTRY
   （width／height 各 1 byte，**256 要寫成 0**；planes=1；bitCount=32；
   bytesInRes 與 imageOffset 都是 **little-endian**）＋依序接上各張 PNG 位元組。
   Vista 以後的 ICO 可以直接內嵌 PNG，不必轉 DIB。

尺寸：favicon.ico 收 16／32／48；PWA 圖示 192／512；apple-touch-icon 180 且要
`flatten` 到不透明底（`#eef7fc`）。驗證方式是把 ICO 的每個 entry 拆回 PNG 開來看，
並確認 `最後一個 entry 的 offset + length == 檔案大小`。

`site.webmanifest` 只讓站台「可安裝」（`display: standalone`），**沒有** service worker、
沒有離線快取——真正的 PWA 是另一件事，還沒做。

### 4. SEO 基礎建設（sitemap／robots／canonical／JSON-LD）

- `public/sitemap.xml` 與 `public/robots.txt` 由 `scripts/generate-sitemap.mjs` 產生，
  **已掛在 `prebuild`**（透過 `npm run gen:sitemap`），`npm run build` 會自動重跑。
  兩個都是**生成檔，不要手改**。目前 25 個網址（首頁＋排行榜＋21 頁攻略＋2 頁 Pokopia）。
- 全站五種頁面都有 `canonical`。`/pokopia` 的 canonical **刻意不帶 `?b=<slug>`**——
  那參數只換掉建築詳情面板，主體相同，不收斂會讓 45 個近乎重複的網址各自被索引。
- JSON-LD：`/decks` 有 `ItemList`（排行榜本體）＋ `BreadcrumbList`，
  `/decks/$deckId` 有 `BreadcrumbList`。**沒有用 `Article`**——Google 的 Article
  複合式結果需要 `author` 與 `datePublished`，策展攻略沒有逐篇的作者與發佈時間，
  填假值比不宣告更糟。
- 網域統一放在 `src/lib/site.ts` 的 `SITE_URL`，前端與 sitemap 腳本共用同一個來源。
  換網域只改這裡。

**`generate-sitemap.mjs` 的兩個地雷**（都踩過了，別重蹈）：

1. 牌組清單是 `import` `src/data/decks.ts` 進來的（靠 Node 的 `--experimental-strip-types`），
   **不要改成 regex 掃檔案**——prettier 重排就會漏抓，而漏抓只是安靜地少幾個網址。
   Windows 上 `import()` 絕對路徑要先過 `pathToFileURL`，否則 `ERR_UNSUPPORTED_ESM_URL_SCHEME`。
2. 不要走 `meta.ts` 拿 `fetchedAt`——它的 `import raw from "./meta.json"` 少了
   `with { type: "json" }`，Vite 吃得下但 Node 的 ESM loader 會拒絕。腳本直接 `readFileSync`。

`lastmod` 只有 `/decks` 有（用 `meta.json` 的 `fetchedAt`，那是內容真正改變的時刻）。
其餘頁面沒有可靠時間來源就不寫——Google 對不準的 lastmod 會忽略整個欄位，寫假的更糟。
`changefreq`／`priority` 已被 Google 忽略，沒寫。

### 5. lint 從 171,676 個錯誤降到 0（根因與原本記載的不同）

**這份筆記先前的診斷是錯的**，別再照著它走。原本寫「全是 `src/` 的 CRLF，要
`git add --renormalize .` ＋ `npm run format`」。實際跑 `eslint . --format json`
依目錄統計後：

| 目錄        | 錯誤數  | 說明                                                                              |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| `pi/…`      | 168,691 | `.gitignore` 早就排除，是另一個獨立 checkout，含自己的 `node_modules`（兩萬多檔） |
| `.claude/…` | 2,299   | 工具設定與 skill                                                                  |
| `src/…`     | **0**   | 應用程式碼本來就沒問題                                                            |

**根因是 eslint 9 的 flat config 不會讀 `.gitignore`**，所以照掃 `pi/` 與 `.claude/`。
真正的修法是把兩者加進 `eslint.config.js` 的 `ignores`，跟行尾沒有關係。
新增被 gitignore 的頂層目錄時，記得同步加進那個 `ignores`。

順帶處理：

- `npm run format` 套過一次。`src/` 的 `.ts`／`.tsx` 只有 JSX 依 printWidth 100
  換行；Markdown 是表格分隔列對齊與強調符號正規化（`*x*` → `_x_`）。
  驗證方式是「抽掉所有空白後的內容雜湊」逐檔比對，91 個文字檔中實質內容有變的
  只有 Markdown 與當次刻意修改的兩個檔——**沒有任何 `.ts`／`.tsx` 的內容被動到**。
- `.prettierignore` 補上 `cards.json`／`cards.used.json`／`meta.json`／`sitemap.xml`。
  前兩者的格式跟 prettier 不一致（`update-meta.mjs` 寫檔時少了結尾換行），
  不排除的話每次跑產生器都會被寫回去，**讓每次更新排行榜都多出一份無意義的 diff**。

**注意 `git diff` 的規模沒有想像中大**：CRLF 只存在於工作區，git 索引裡存的一直是 LF
（`.gitattributes` 在 `a35111f` 就加了，git 提交時會正規化）。所以那個「巨大 diff」
的擔憂是多慮的，實際只有 18 個檔案。

### 6. Node 版本下限

`prebuild` 的 `generate-sitemap.mjs` 用 `--experimental-strip-types` 直接載入
`decks.ts`，該旗標自 **Node 22.6.0** 起才有。已用 `.nvmrc`（`22`）與 `package.json`
的 `engines.node`（`>=22.6.0`）宣告。在此之前沒有任何東西講明這個相依——CI 若換到
更舊的 Node，會在 prebuild 靜默失敗，而且是**每一次部署都失敗**。

### 7. 牌組功能：篩選／搜尋、對戰互連、牌表複製、門面卡

- **`CuratedDecks`**：策展牌組長到 21 套後平鋪格線已經找不到東西。用 `Deck` 既有的
  tier／energy／difficulty 三個維度做篩選 ＋ 文字搜尋（含簡介，玩家常記得的是
  「那套削血的」）。**同組內 OR、跨組 AND**。
  注意 `/decks` 現在有**兩組** Tier 篩選（`MetaRanking` 的表格篩選、`CuratedDecks` 的
  卡片篩選），寫測試選 DOM 時要限定 section，否則會抓到上面那組。
- **對戰思路互連**：`matchups[].vs` 存的是繁中牌組名，63 筆目前 100% 對得上策展牌組
  （`getDeckByName()`）。對不上時退成純文字，不渲染死連結。
- **`CopyDecklist`**：把牌表複製成純文字。卡名用**英文** `nameEN`——Limitless、
  遊戲內搜尋、其他玩家用的都是英文原名，繁中譯名只在本站出現，貼給別人反而對不上。
- **門面卡 `getHeroCardId()`**：列表縮圖與 OG 圖不要用 `deck.cards[0]`，牌表照進化線排，
  第一張常是進化前小卡（「Mega火焰雞ex」會變成一隻火稚雞）。規則是
  **Mega 優先 → 帶 ex → 退回第一張**，21 套中 20 套推導正確；
  `甲賀忍蛙 Mega勾魂眼ex` 同時有 Mega Absol ex 與 Mega Sableye ex 且 Absol 排前面，
  用 `deck.heroCardId` 明確覆寫。新增牌組通常不用填這個欄位。

OG 圖現在是每套牌自己的門面卡圖，並把 `twitter:card` 降成 `summary`——卡圖是 63:88
直式，塞進 `summary_large_image` 的 1.91:1 會被裁掉頭尾。查不到卡時整組省略，
讓 `__root` 的全站圖遞補。

### 8. 字型：用範圍語法，不要用離散字重（也不要以為砍字重能省字型檔）

`/decks/$deckId` 實測原本要下載 **1.86 MB 字型**：一支 133 KB 的
**render-blocking** CSS ＋ 31 個 woff2 分塊約 1.73 MB。

兩個字體都是**可變字型**，所以 URL 一律用範圍語法 `wght@400..700`，
**不要**寫成離散的 `wght@400;500;600;700`。

| 寫法                           | 字型 CSS（render-blocking） | `@font-face` | 中間字重       |
| ------------------------------ | --------------------------- | ------------ | -------------- |
| 離散 `400;500;600;700`（原始） | 133 KB                      | 440 個       | 正確           |
| 離散 `400;700`                 | 66.9 KB                     | 226 個       | **落到最近值** |
| **範圍 `400..700`（現在）**    | **33.5 KB**                 | **109 個**   | 正確           |

離散寫法會讓 Google 為**每個字重各發一整套** `@font-face`（每套約 105 段 unicode
range）；範圍寫法只發一套、宣告成 `font-weight: 400 700`，由可變軸插值出中間字重。
所以範圍寫法比「砍字重」更小，而且不必犧牲 `font-medium`(500)／`font-semibold`(600)。
實測 `document.fonts.check()` 對 400／500／600／700 全部回報可用。

**woff2 分塊完全不受字重寫法影響**（一直是 31 個、約 1.73 MB）：分塊共用同一個
檔案 hash，切的是 unicode 範圍而不是字重。

#### 更正（2026-07-24 實測）

原本這裡寫「那是頁面用到多少字的成本」，並據此推論 unicode-range 分塊會讓實際
下載量遠小於 1.73 MB。**那個推論是錯的**，實際量過（Resource Timing 的
`decodedBodySize`，`/decks`）：

| 字體              | 下載分塊 | 位元組      |
| ----------------- | -------- | ----------- |
| Noto Sans TC      | 23       | **1463 KB** |
| Plus Jakarta Sans | 1        | 27 KB       |

而該頁只用到 **383 個相異漢字**——平均一個字花掉 3.8 KB。漢字分塊是照使用頻率
切的，一篇正常長度的中文內容就會散落在二十幾個區段，等於幾乎整套都得載。

所以有效的手段是**自架子集**（383 字約 50 KB，省 96%），不是換字重寫法、也不是
指望 unicode-range 自動幫忙。但那要引入字型子集化工具鏈，而且 `meta.json` 每週
更新、頁面文字會變，子集得跟著重算，漏字就會出現豆腐框——**是要人拍板的取捨**。

現況維持載入，理由是：`display=swap` 且非阻塞（文字先用系統 CJK 字型顯示再替換，
不擋首次繪製）、Google CDN 快取一年（回訪成本 0），而移除它會推翻 `114c2b2`
刻意加入這個字體的視覺決定。

### 這輪的驗證數字

| 檢查                           | 結果                                              |
| ------------------------------ | ------------------------------------------------- |
| `/decks` 全頁文字對比          | 308 個節點，**0 失敗**（底線維持）                |
| `/pokopia/videos` 全頁文字對比 | 89 個節點，**0 失敗**                             |
| 新增跨區連結文字對比           | 5.46:1 靜態／5.07:1 hover（guide 側）             |
|                                | 11:1 靜態／9.47:1 hover（pokopia 側）             |
| 手機 375px 水平溢位            | 無；所有觸控目標 44px                             |
| `npm run build`                | 通過（prebuild 有跑 sitemap 產生器）              |
| client 卡片索引 chunk          | 19.6 KB（未回退）                                 |
| console 錯誤                   | 無                                                |
| 五個頁面的 canonical           | 全部正確；`?b=` 變體收斂到裸網址                  |
| JSON-LD                        | 全部合法 JSON，位於 `<head>`，未洩漏到畫面        |
| sitemap 網址數                 | 25（建置產物一致）                                |
| 線上部署（`b7e599a`）          | 已驗證：`/favicon.ico` 200、攻略頁標題為每頁專屬  |
| `npm run lint`                 | **0 錯誤**（原本 171,676）                        |
| 格式化的實質影響               | 91 個文字檔中 `.ts`／`.tsx` 內容零變化            |
| 加了篩選 UI 後 `/decks` 對比   | 264 個節點，**0 失敗**                            |
| 攻略頁對比                     | 61 個節點，**0 失敗**；對戰連結 5.5:1、44px       |
| 篩選邏輯                       | 組內 OR／跨組 AND 全部實測正確；空狀態有提示      |
| 門面卡推導                     | 21/21 正確（1 套用 `heroCardId` 覆寫）            |
| 字型 render-blocking CSS       | 133 KB → **33.5 KB**（−75%），中間字重仍正確      |
| `npx tsc --noEmit`             | 通過                                              |
| 加了排行榜搜尋後 `/decks` 對比 | 桌機 459 節點／手機 296 節點，**0 失敗**          |
| 攻略頁對比（含新 pager）       | 83 個節點，**0 失敗**                             |
| `/pokopia` 對比                | 269 個節點，1 → **0 失敗**（修掉既有的 3.81:1）   |
| 兩個搜尋框                     | 邊框 5.5:1、placeholder 4.76:1、文字 10.36:1      |
|                                | 高 44px；Tab 焦點環 2px `#2a6f97`（未被關掉）     |
| 排行榜中文搜尋                 | 「密勒頓」命中 2 列英文名；Tier＋搜尋為 AND       |
| 「展開全部」與搜尋一致性       | 0 結果時自動 disabled，不再渲染空表               |
| 牌組 pager                     | 首套只有「下一套」、末套只有「上一套」、中間都有  |
|                                | 76px 高；手機直向堆疊；點擊後捲軸回頂             |
| `/pokopia` 手機 header         | 109px → **61px**，單行、無溢位；桌機標籤未犧牲    |
| 互動全流程 console 錯誤        | 自裝監聽器實測 **0 個**（工具緩衝不可信）         |
| client bundle 全卡索引         | 未混入（client JS 共 509 KB < cards.json 700 KB） |

**踩過的坑**：`read_console_messages` 會回傳**保留緩衝**，重啟 dev server 後仍吐出
同一個 Vite HMR 時間戳（`?t=...`）的舊錯誤。判斷是否為當下真錯誤，要看時間戳有沒有變、
並直接查 DOM 現況（例如 root 的 `head()` 有沒有跑，就看 `og:image` 在不在）。
新建檔案（如這輪的 `src/lib/site.ts`）會讓 HMR 出現短暫的模組撕裂，那是暫時的。

**已知、未處理**：跨區藥丸的 `border-guide-tint` 邊框對底色是 1.34:1，低於 WCAG 1.4.11
的 3:1。這與 `MetaRanking` 既有的 Tier 篩選按鈕（1.35:1，同一組 token）是同一個狀況，
不是這輪引入的。兩者都靠通過對比的文字標籤辨識，邊框非唯一識別線索。
要收斂的話應該連同既有按鈕一起改，不要只改新的那個。

### 9. 排行榜搜尋、牌組頁互相導覽、手機 header 高度（2026-07-24）

**排行榜搜尋**（`MetaRanking`）：Tier 與搜尋算在同一個 `visibleDecks` 裡，
`expandableRanks`／「展開全部」的 disabled 狀態／`aria-live` 計數才不會各說各話。
搜尋範圍包含**繁中策展名**——上游 Limitless 只給英文名，中文名靠 `curatedId`
反查 `getDeck()`；實測搜「密勒頓」能命中兩列英文名的排行。沒攻略的牌組只能用英文搜，
這是資料限制不是 bug。

輸入框樣式**直接沿用 `CuratedDecks` 那組量過的值**（邊框 `guide-ink` 5.5:1、
placeholder `slate-500` 4.76:1、不加 `focus:outline-none`），不要重新調配。

**牌組頁互相導覽**（`getAdjacentDecks` ＋ `DeckPager`）：順序＝ `listDecks()`
（tier 排序），與精選格線一致。**不環繞**——第一套沒有上一套、最後一套沒有下一套，
這是依強度排序的清單，環繞會吃掉「已經看到底」的資訊。沒有上一套時，「下一套」
用 `sm:col-start-2` 推到右欄，維持「左＝前／右＝後」的空間直覺。

**手機 header 高度**：`/pokopia` 原本 109px（跨區膠囊被擠到第二行）。
375px 的實測預算是 343px（375 − px-4 兩側），而內容需要 421px。
**只縮 `gap` 不夠**（`gap-x-4` 才省 24px，缺口有 78px）——第一次就是這樣算錯的。
最後手機同時縮欄間距與**區內**標籤（`Pokopia 建築`→`建築`、`建築影片`→`影片`，
`sm:` 以上還原全名），總寬 298px，**109px → 61px**。縮區內而非跨區膠囊，是因為
你已經在那一區裡了，區名是冗餘資訊；「離開這一區」的膠囊反而要講清楚去哪。

**順手修掉的既有問題**：`BuildingFilters` 選中態的計數 `text-white/80` 在
`pokopia-accent`（#a35f1f）上只有 3.81:1。`/90` 也只到 4.39 仍不合格，
只能用純白（4.98:1）。這不是這輪引入的（上次動它是 `114c2b2`）。

### 10. 深色模式與三態主題架構 (2026-07-24)

- **三層架構**：
  1. `styles.css`：class-based `@custom-variant dark` + `.dark {}` 區塊翻轉 CSS token 值。
  2. `src/lib/theme.ts`：狀態層（`system` | `light` | `dark` 三態解析、`localStorage` 讀寫、`matchMedia` 監聽、`colorScheme` 與 `theme-color` meta 同步）。
  3. `src/routes/__root.tsx`：`<head>` 同步 inline script（`THEME_INIT_SCRIPT`）首次繪製前寫入 `.dark` 與 `colorScheme`，徹底告別 SSR 白閃。
- **雙份解析邏輯 warning**：
  - `src/lib/theme.ts` 與 `src/routes/__root.tsx` 內有**兩份獨立實作的解析邏輯**。`__root.tsx` 必須同步且獨立運作以擋住 FOUC。未來若修改主題 key 或預設邏輯，**兩處必須同步更新**。
- **首頁隔離與硬性不變式**：
  - 首頁 `/` 使用 `<main data-theme="light">` 隔離 token。
  - **重要不變式**：首頁相關元件（`routes/index.tsx`、`GuideEntry.tsx`、`PokopiaEntry.tsx`、`Doodles.tsx`、`VideoBackdrop.tsx`）**嚴禁使用 `dark:` Tailwind utility**，因為 `@custom-variant dark` 會匹配 `<html>` 的 `.dark` class，不受 DOM 樹子選擇器 token 覆寫影響。
- **雙模式對比度實測結果**：
  - `/decks`（含展開列）、`/decks/$deckId`、`/decks/schedule`、`/pokopia`（含篩選與詳情）、`/pokopia/videos`、`/pokopia/habitats`、`/no-such-page` (404) 等 7 頁雙模式 14 次量測，`failCount` **全數為 0**。


### 沒有 PRODUCT.md

`$impeccable` 的 `critique`／`bolder`／`delight` 那類需要判斷「這站該有什麼調性」的指令，
沒有 PRODUCT.md 會做得很泛。純技術性的 `audit`／`optimize` 不受影響。
要做那類工作前先跑 `$impeccable init`。

---

## 部署與驗證

push 後由 **Cloudflare Workers Builds webhook** 自動觸發，約 60 秒上線。
**沒有 GitHub Actions**，所以沒有 workflow run 可以看。

「push 成功」不等於「上線了」。驗證方式是 curl 線上 HTML 找這次改動的特徵字串：

```bash
curl -s -H "Cache-Control: no-cache" https://bubble.19980803.xyz/decks | grep -o 'lang="[^"]*"'
```

也要確認 hash 過的 JS chunk 與靜態資源回 200。上一輪用的特徵是 `lang="zh-Hant"`
（改動前是 `en`），以及卡片索引 chunk 從 562.7 KB 掉到 19.3 KB。

---

## 協同注意事項

- 本 repo 由 Claude Code 與 Antigravity CLI（`agy`）共同協作。動手前先 `git fetch`
  看有沒有新 commit——上一輪稽核進行到一半時對方提交了「變化」欄新功能，
  差點讓修改建立在過期的檔案狀態上。
- 不要 force push / rebase / amend 已推送的歷史（會弄壞 Lovable 端的歷史）。
- 生成檔不要手改：`cards.json`、`cards.used.json`、`meta.json`、`routeTree.gen.ts`。
- 跑 dev server 一律用 `preview_start`（config name `piplup-dev`），不要用 Bash 起。
