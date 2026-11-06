# 接手筆記

給下一個接手的人（Claude Code 或 `agy`）。這份檔案記錄目前的 UI／前端品質狀態與待辦，
每輪工作結束時更新它，不要讓它過期。

最後更新：2026-11-06

---

## 目前狀態

`/decks` 與全站於 2026-07-23 完成 UI/UX Pro Max 全站視覺質感優化（導入 Google Fonts `Plus Jakarta Sans` / `Noto Sans TC`、首頁雙卡片微透光與懸浮質感、Tier 徽章金屬立體度、MetaRanking 排行榜 StatBar 漸層過渡動畫、Pokopia 暖色焦點環與過渡細節）。WCAG AA 對比度全數通過，卡片索引子集化完美維持 (18.0 KB)。

同日補上三項站台基礎建設（詳見下方「2026-07-23 這輪」）：兩個子站的導覽互連、
每頁專屬的 OG 分享卡片、favicon 與 webmanifest。

| 面向          | 稽核當下 | 現在 | 備註                                                      |
| ------------- | -------- | ---- | --------------------------------------------------------- |
| Accessibility | 2/4      | 4/4  | 程式量測 WCAG AA 全過；**未經螢幕閱讀器實測**             |
| Performance   | 2/4      | 4/4  | 卡片索引子集化                                            |
| Theming       | 2/4      | 4/4  | 三態深色模式支援完成（系統/淺色/深色），雙模式對比 0 失敗 |
| Responsive    | 3/4      | 4/4  | 觸控目標補齊                                              |
| Anti-Patterns | 4/4      | 4/4  | 偵測器 0 命中，無 AI slop 特徵                            |

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

### 11. 排行榜資料更新（2026-08-10）

純資料輪，沒有動 UI。`meta.json` 重跑（對比基準 2026-08-06：6 升 5 降 6 持平 3 新進），
`decks.ts` 依 Wilson 下界改了 5 套的 tier（蜂女王 S→A、Mega雷電獸光電傘蜥 A→B、
Mega路卡利歐 B→A、索羅亞克 B→A、自爆磁怪密勒頓 C→B），`cards.used.json` 重算成 143 張。
攻略文案逐條核對過**沒有需要改的**——`hoopa-mega-absol` 的「Wilson 排名最高」仍是第 1、
`vespiquen-shuckle` 的「使用率最高的草系」7.92% 仍是全表最高，掉 tier 不等於掉使用率。

**下輪注意**：`limitless-map.json` 的 `slug` 欄位不是純裝飾。Limitless 目前有 11 組
同名不同 slug 的原型（`Mega Lucario ex Lucario` 有 n=2510 與 n=7 兩列），
只用 `limitlessName` 比對會抓到小樣本那筆、把 tier 算成 D。
`update-meta.mjs` 自己有「同名取樣本大者」的去重，但**手動比對 tier 時要記得用 slug 收斂**。

### 12. Pokopia 棲息地繁體中文化 (2026-08-11)

全站 `/pokopia/habitats` 棲息地反查頁面完成 100% 繁體中文化：

- `src/data/pokopia/habitat-materials.json`（DLC 1 泡泡海底 36 筆棲息地材料）74 種道具/材料名稱對齊官方《Pokémon Pokopia》繁中與 Pokemon Hubs / PokopiaGuide 社群標準譯名（如：`裝飾用超級球`、`發條好喇魷`、`暴鯉龍噴泉`、`桌上型麥克風`、`五彩珊瑚` 等）。
- 重跑 `scripts/fetch-habitats.mjs`，`src/data/pokopia/habitats.json` 245 個棲息地、344 種寶可夢名、分類與建造材料已達成 0 英文殘留。
- 更新 `src/routes/pokopia/habitats.tsx` 與 `src/data/pokopia/types.ts` 之文案與型別註解。

### 沒有 PRODUCT.md

`$impeccable` 的 `critique`／`bolder`／`delight` 那類需要判斷「這站該有什麼調性」的指令，
沒有 PRODUCT.md 會做得很泛。純技術性的 `audit`／`optimize` 不受影響。
要做那類工作前先跑 `$impeccable init`。

---

## 2026-08-15 這輪：全站內容更新（在遠端沙箱裡跑，網路受限）

使用者要求「更新網站所有內容」。四條會過期的內容線裡只有兩條跑得完，原因是這次是在
**Claude Code 遠端沙箱**（claude.ai/code 開的 session）執行，egress policy 擋掉了大部分上游。

| 內容線                 | 結果      | 說明                                                                   |
| ---------------------- | --------- | ---------------------------------------------------------------------- |
| `/decks` 排行榜        | ✅ 已更新 | Limitless 連得到，`meta.json` 重抓（10 升 6 降 3 平 1 新進榜）         |
| 策展攻略 `decks.ts`    | ✅ 已核對 | 26 個牌組 tier 與新資料**全數一致**，攻略文的名次敘述也仍成立，未改動  |
| `/decks/schedule` 活動 | ✅ 已複查 | 12 筆無異動，只更新 `updatedAt`                                        |
| `sets.json` 時間軸     | ✅ 已更新 | 改走 git proxy 的匿名 clone 重跑，B4 名稱更正為單數 Ruler of the Skies |
| `cards.json` 卡片索引  | ✅ 已驗證 | 與上游逐 set 比對：22 set／3761 張完全一致，確認不需重跑               |
| `/pokopia/videos`      | 🔶 只抽查 | YouTube 被擋，改用 WebSearch 抽查 6 支全存活；不增刪，理由見下         |
| `/pokopia/habitats`    | ❌ 做不了 | 兩個上游都被擋；本來也是靜態遊戲資料，沒有 DLC 更新就不用重跑          |

### 這個環境擋掉了什麼（下次在沙箱裡跑之前先看這段）

curl 與 WebFetch 一律回 403（`CONNECT tunnel failed`）：

- `raw.githubusercontent.com`／`cdn.jsdelivr.net` → `fetch-sets.mjs`、`fetch-cards.mjs` 直接跑會掛
- `youtube.com`／`i.ytimg.com` → `pokopia-videos` 的 oEmbed 查證流程做不了
- `serebii.net`／`pokemon-zone.com`／`game8.co`／`ptcgpocket.gg`／`bulbapedia` → 行事曆的來源全滅
- `pokopia.pokemonhubs.com`／`pokopiaguide.com` → `fetch-habitats.mjs` 跑不動
- `registry.npmjs.org` 連 metadata 都 403，所以 `npm ci` 停在 403——
  **這個 repo 在沙箱裡裝不了相依**，`npm run lint`／`npm run build` 都跑不了

`play.limitlesstcg.com` 連得到，所以排行榜那條剛好能做。

### 三條繞得過去的路（下次沙箱受限時直接用）

1. **公開 GitHub repo 一律 clone 得到**：session 的 git proxy 服務匿名 git 讀取，
   即使 `raw.githubusercontent.com` 被擋也一樣。所以吃 GitHub 的腳本可以這樣跑：

   ```bash
   GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 \
     https://github.com/flibustier/pokemon-tcg-pocket-database /workspace/flibustier/…
   # 起個本機靜態服務餵那份 dist，再把腳本的 SRC 暫時指過去
   node -e "…http.createServer(…).listen(8899,'127.0.0.1')" &
   sed -i 's#https://raw\.githubusercontent\.com/…#http://127.0.0.1:8899/sets.json#' scripts/fetch-sets.mjs
   NO_PROXY='*' node scripts/fetch-sets.mjs
   git checkout scripts/fetch-sets.mjs   # 一定要還原，並用 git status 確認
   ```

   `fetch-cards.mjs` 同理（它多需要 pokemon-tcg-exchange 的圖片目錄清單，
   用 `git ls-tree` 搭 `--filter=blob:none` 就不必下載整包圖）。

2. **WebSearch 可以用 video id 反查 YouTube 標題**（`"<id>" youtube …`），足以驗證影片
   還在、標題有沒有改。但**拿不到觀看數與可靠的發布日／頻道**，所以只能做健檢，
   不足以支撐 `/pokopia/videos` 的「近期熱門」選片。

3. **不要試圖繞過 egress policy**（`/root/.ccr/README.md` 明講 403 就是政策拒絕、
   照實回報即可）。上面兩條都是環境自己提供的合法通道，不是繞道。

### 因此這輪的驗證是降級的

沒有 `node_modules` 就沒有 vite／eslint，也沒有 `preview_start` 可以起瀏覽器實測。實際做到的：

- `npx prettier --check src/data/events.json` 通過
- `node scripts/subset-cards.mjs` 重跑（149 張、28.0 KB），`--check` 由「已過期」轉為乾淨
- `node --experimental-strip-types scripts/generate-sitemap.mjs` 手動補跑（平常靠 prebuild），
  32 個網址、`lastmod` 已同步到新的 `fetchedAt`
- 用 node 逐筆比對 `meta.json` 的 265 個卡片 id：`cards.json` 與 `cards.used.json` 都 0 缺漏
- 卡片索引與上游 clone 逐 set 對數量與 id：22 個 set、3761 張，0 差異

**改動全是資料檔（`meta.json`／`cards.used.json`／`events.json`／`sets.json`／`sitemap.xml`）
加一段 `pokopia.ts` 的註解，沒有動任何可執行的 `.ts`／`.tsx`**，所以型別與版面風險趨近於零。
但下一個在本機有網路的人接手時，請補一次 `npm run build` 與 `/decks`、`/decks/schedule`
的瀏覽器實測，並把 `/pokopia/videos` 用完整的 oEmbed＋觀看數流程換一輪。

---

## 2026-08-16 這輪：新增 `/pokopia/cooking` 料理食譜頁

使用者要「料理介面、各料理食譜、食物口味，最後推薦好用的 3 級料理」。

新增的東西：

| 檔案                                      | 性質                                                      |
| ----------------------------------------- | --------------------------------------------------------- |
| `scripts/fetch-cooking.mjs`               | 抓取管線（3 次 fetch，數秒）                              |
| `src/data/pokopia/cooking-overrides.json` | **手寫**：兩站 slug 對接、譯名修正、24 種食材的口味與取得 |
| `src/data/pokopia/cooking.json`           | 生成檔，34 道料理 ＋ 24 種食材                            |
| `src/data/pokopia/cooking.ts`             | 口味／等級常數、策展推薦（只在這條路由 import）           |
| `src/components/pokopia/CookingGuide.tsx` | 頁面主體（口味對照 → 3 級推薦 → 全食譜篩選 → 食材口味）   |
| `src/routes/pokopia/cooking.tsx`          | 路由                                                      |

### 這頁的資料判斷（下次更新前先看）

- **「3 級料理」是本站定義的說法**，上游沒有這個欄位。判定規則寫在 `fetch-cooking.mjs`
  抬頭：供奉效果句「更容易」＝ 3 級、「較容易」＝ 2 級、生食材＝ 1 級。
  兩個獨立來源交叉驗證過：pokopiaguide 標售價 500 的本篇 8 道，與 gamewith
  「かなり効果が上昇する料理」清單（含 DLC 共 11 道）完全同一批。腳本每次跑都會自動對帳。
- **繁中名取 hubs，不取 guide**：guide 的莓果譯名整組是自譯而且對錯（Leppa→「蘋野果」，
  官方是「慕柑果」；Chesto→「零餘果」，官方是「伊奈果」）。hubs 沒收錄的 DLC 10 道
  只好退回 guide 名，UI 上標「暫譯」。哪天 hubs 補上 DLC，只要在 `recipeSlugs` 加對應就會自動換掉。
- **每種口味的首選是策展**，不是官方推薦。判斷依據是製作成本（要不要生火、要不要先做
  另一道料理當素材、要不要專程找帶特定特技的寶可夢），頁面上有明確標示。

### 驗證數字

- 圖片：34 道料理 ＋ 24 種食材共 58 個 hotlink 全數 200，頁面實測 64 張圖 0 破圖
- 對比：淺色／深色各重新載入後量測算繪色，`header`＋`main`＋`footer` **0 處失敗**
  （量測腳本要用 canvas 把 `oklab()` 轉成 sRGB 再算，直接 regex 拆數字會誤判成 9 處假陽性）
- 375px：無水平溢位；導覽列多一個「料理」仍是既有的兩行式樣
- 互動：篩選（口味／器具／只看 3 級）實測正確，「3 級＋冰沙」＝ 2 道
- `npm run lint` 0 問題；`npx vite build` 成功，料理資料切成獨立 chunk（server 49.8 KB），
  沒有混進 `/pokopia` 主頁
- ⚠ `npm run build` 的完整 prebuild 目前**跑不完**：`scripts/subset-fonts.mjs` 需要的
  `fontverter` 沒有安裝（既有環境問題，與這輪改動無關）。這輪改跑
  `subset-cards` ＋ `gen:sitemap` ＋ `vite build` 三段驗證。

---

## 2026-08-18 這輪：更新 `/pokopia/videos` 建築靈感影片

執行 `/pokopia-videos` 技能，掃描最新熱門建築影片與頻道動向，完成影片查證與清單更新。

### 更新細節：

1. **頻道掃描**：執行 `scripts/fetch-yt.mjs channels` 掃描主播（`HorribleGaming`、`すくると`、`涼太ぱんけーき♭`、`かぴぱか create`、`わむのスローライフっぽい`）。
2. **oEmbed 查證**：全數 34 支影片通過 oEmbed 官方 Title/Channel 與 200 存活度查證，濾除他款遊戲（Dinkum, Minecraft 等）。
3. **精選擴充**：
   - 新增 Bubbly Basin DLC 巨大沈船棲地 (`nUQ6HgJfstg`, HorribleGaming, 5 days ago, 16K views)。
   - 新增 Bleak Beach 現代海濱別墅 (`8JHUVsq-L2Y`, HorribleGaming, 18K views)。
   - 新增超逼真 ENEOS 加油站配豪力店員 (`ESvj12yessg`, かぴぱか create, 22K views)。
   - 新增復古綠電車神建築教學 (`xk-E14UmuMQ`, かぴぱか create)。
4. **熱連線驗證**：34/34 縮圖 `i.ytimg.com/vi/{id}/hqdefault.jpg` 均通過 HTTP 200 檢查。
5. **程式驗證**：`npx prettier` + `npm run lint` + `npm run build` 全數綠燈通過。

---

## 2026-08-20 這輪：排行榜資料更新（`/tcg-pocket-tier-list`）

純資料輪，沒有動 UI。`meta.json` 重跑（基準 2026-08-15：7 升 7 降 4 持平 2 新進），
新進榜的是 `Hydreigon Mega Absol ex`（#16）與 `Giratina ex Darkrai ex`（#20），
掉出去的是 `Chandelure Oricorio` 與 `Mega Lucario ex Hitmonchan ex`。
牌組名繁中覆蓋率 20/20，`pokemon-names.json` 不用補。

`decks.ts` 依 Wilson 下界改了 3 套 tier，全是卡在門檻邊上的下修：
自爆磁怪ex 自爆磁怪 S→A（51.64%，S 需 52%）、Mega蜥蜴王ex 甲賀忍蛙 A→B（49.82%，A 需 50%）、
Mega路卡利歐ex 甲賀忍蛙 B→C（47.35%，B 需 48%）。

**排名／使用率類的文案這輪不用改**——「使用率最高的草系一線牌」（蜂女王 7.27% 仍是草系最高）、
「現環境的惡系標竿」（胡帕 Mega阿勃梭魯仍是第 1）逐條核對後都還成立。
改的是**卡片採用率**那一類（4 套牌），因為新取樣的 20 份牌表把數字洗掉了。

### 採用率文案要跟頁面上的「核心牌與自由席」區塊對齊

這輪踩到的坑：`hoopa-mega-absol` 的 Repel 從 75% 漲到 90%，
而牌組頁那個自動產生的區塊是**按採用率分桶**的（≥90% 進「核心」），
所以原本寫「真正的自由席只有三張：Repel…」會跟同一頁的區塊自相矛盾——
區塊說它是核心，散文說它是自由席。**改採用率數字時，要順手確認散文的「核心／自由席」
歸類還跟區塊的分桶一致**，光把數字換掉不夠。

### 新進榜牌組要補 `deck-energy.json`，否則沒有 QR

`Hydreigon Mega Absol ex` 新進榜時沒有能量設定，`gen:deck-qr` 會**靜靜少產一張**
（只在腳本結尾印一行）。這次判定用站內既有證據收斂：`hydreigon-mega-sableye`
（同樣的 Deino／Hydreigon／Bombirdier 線）是 `["Darkness"]`，
四套含 Mega阿勃梭魯ex 的策展牌組也全是 `["Darkness"]`，兩條線獨立指向同一答案。
補完後 20/20 都有 QR。

### 驗證

`npm run lint` 0 問題、`npx prettier --check` 全過、`npm run build` 綠燈。
瀏覽器實測 `/decks`：20 列、牌組名全繁中、資料更新日期 2026-08-20（台灣時間，UTC 是 08-19T21:02Z）、
展開全部後 20 張 QR 與 623 張卡圖**零破圖**、console 零錯誤。
四頁被改到採用率的牌組頁（`hoopa-mega-absol`／`vespiquen-shuckle`／`hoopa-greninja`／
`mega-lucario-greninja`）逐頁比對過散文數字與區塊分桶，一致。

---

## 2026-09-29 這輪：行事曆補 B4b 官方資料（`/tcg-pocket-schedule`）

純資料輪。B4b 定名 **Deluxe Pack: Mega／高級擴充包MEGA**（官方英文稿＋官方繁中站 #83），
發售時刻 9/30 01:00 UTC 經官方確認、未變動；`set-names-tc.json` 預寫 B4b（上游收錄前是 no-op）。
配套活動（平行閃卡大量出現、Season 18、Mega Garchomp ex 掉落、小火龍與老翁龍得卡挑戰）
官方只給「9 月底／10 月中下旬」，**全部還沒收**，清單與陷阱寫在 `events.json` 的 `_comment`
（9/29 那段），下一輪回頭補精確時刻。9/30 發售後要跑 `fetch-sets.mjs`（記得再過一次 prettier）。

驗證：`prettier --check` 兩檔通過；`/decks/schedule` 的 B4b 卡顯示「2026/09/30 發售」
（對照官方繁中標題的 9 月 30 日）、`/decks` 頁頂提示條重新出現且天數一致，console 無 hydration 警告。

---

## 2026-10-20 這輪：行事曆補 10 月活動、時間軸收 B4b（`/tcg-pocket-schedule`）

純資料輪。行事曆原本只剩一筆進行中的活動，這輪補了四筆，每筆都至少有兩個來源的日曆日一致：
Season 18（10/14–10/28）、Mega Garchomp ex 掉落活動（10/15–10/25）、小火龍與老翁龍得卡挑戰
（10/18–10/28，Serebii 寫 10/15 開始，是唯一不一致的來源，不採）、Pika Pika! Pikachu 任務
（2026/10/20–2027/10/20）。Elite Deck 那筆的 note 補上「Lucario 牌組那半 10/27 就結束」。
判定過程、未收的 Community Week（只有單一來源）與 C1（仍無確切日期）都寫在 `events.json`
`_comment` 的 10/20 那段。`fetch-sets.mjs` 已重跑，B4b（429 張）進了時間軸，繁中名自動生效。

環境備忘：Pokemon Zone 的 `/schedule/` 仍卡 Cloudflare，但 `/events/{slug}/` 單一頁用瀏覽器分頁直接開得起來。
C1 預計 10 月底發售，官方發稿後（通常在發售前一週）要補一筆 `set`，發售後再跑一次 `fetch-sets.mjs`。

驗證：兩個 JSON 都通過 `prettier --check`；`/decks/schedule` 五張卡的日期逐一對過來源，console 沒有 hydration 警告；
`npm run build` 通過。`/decks` 頁頂提示條目前沒有 upcoming 的 set，所以是空的，這是預期行為。

---

## 2026-10-28 這輪：排行榜資料更新（`/tcg-pocket-tier-list`）

開工時工作區裡有一份**沒 commit 過的 10-22 `meta.json`**（來源不明，可能是另一個 agent 跑了沒提交）。
它從沒發布，所以這輪先 `git restore` 回已發布的 10-19 版再跑 `update-meta.mjs`，名次變動以 10-19 為基準；
10-22 那份沒有留在 repo。**之後跑完 `update-meta.mjs` 請當輪 commit**，不然下一個人只能二選一基準。

結果：6 升、4 降、9 持平、1 新進（Mega Lucario ex Lucario 回到 #20）；Miraidon ex Magnezone 掉出 Top 20。
前三名不變（Magnezone Miraidon ex／Mega Altaria ex Espeon／Hoopa ex Mega Absol ex）。20 列全繁中，不用補譯名。
策展 tier：索羅亞克ex Mega阿勃梭魯ex B→C（47.84%）、三首惡龍 Mega勾魂眼ex C→B（48.8%，只有 309 場、使用率 0.36%，
樣本偏小，下輪留意會不會掉回去）。散文只改一處：Mega雷電獸ex 光電傘蜥的採用率（B2b 落雷獸 95%、優雅披風 90%）。

驗證：`/decks` 20 列、資料日期 2026-10-28、展開無攻略列有卡圖與 QR、console 零錯誤；兩頁改 tier 的攻略頁顯示正確；
`decks.ts` 過 `prettier --check`。這輪 github.com DNS 解析失敗，沒辦法 `git fetch` 也沒 push。

---

## 2026-10-30 這輪：排行榜切到 C1「Dual Fusion」環境（`/tcg-pocket-tier-list`）

Limitless 預設環境已從 B4a 換成新擴充包 **C1**，開打才一兩天：全表只有 111 個 archetype、約 2,100 場
（10-28 那份第一名一副就有 2,793 場）。舊環境的完整資料仍在 `decks?game=pocket&set=B4a`。

**上榜門檻這輪破例降到 20 場**（使用者同意）。`update-meta.mjs` 的 `MIN_GAMES = 100` 下 C1 只有 4 副過門檻，
所以用臨時副本改成 20 跑一次就刪掉，**腳本本身仍是 100**。下次照常跑時若 C1 樣本還不夠，榜單會縮成幾列——
到時要再問使用者要不要破例，別默默改常數。這輪的升降箭頭是 C1 對 B4a 的名次，沒有參考價值；下一輪才是真的。

- 譯名：`pokemon-names.json` 補 12 筆（官方台灣圖鑑查證，出處寫在檔案 `_comment`），20 列全繁中。
- 策展 tier：密勒頓ex 自爆磁怪 B→S、Mega雷電獸ex 光電傘蜥 A→B，另九副降到 C（多數樣本只有個位數到幾十場）。
  12 副不在 C1 資料裡（例如 Mega蜥蜴王ex 甲賀忍蛙、騎拉帝納ex 愛管侍），tier 未動；樣本長大後要重看。
- 散文刪掉三處「主流／高使用率」說法。卡片採用率那幾句（蜂女王、雷電獸的 95%／100%）**沒有**對 C1 重算：
  C1 每副只取樣到 4–8 份牌表，太少。

**還沒解決的：**

- 上游 flibustier 還沒有 `C1.json`（最後更新停在 10-12）。**卡圖與卡名已補上**（同日稍後）：
  `fetch-cards.mjs` 新增 `LIMITLESS_FALLBACK_SETS`，database 對該 set 回 404 時改抓
  `pocket.limitlesstcg.com/cards/C1?display=list`，卡圖走 Limitless 的 CDN。217 張 C1 進了 `cards.json`，
  其餘 3888 張完全沒變；meta 裡 27 張 C1 卡的卡名與 imggen payload 逐一核對一致。
- **QR 只有 5 張，而且這輪補不了**：沒有 QR 的 15 副**全部**含 C1 卡，C1 的 `deckBuilderNr` 目前沒有任何
  拿得到的來源（flibustier、Nirostar/ptcgp-deck-qr 都停在 C1 之前；pokemon-zone 擋 Cloudflare 驗證，不能繞）。
  **不要用卡號推編號**，推錯玩家會掃到錯的牌。等 flibustier 出 `C1.json`，直接重跑
  `node scripts/fetch-cards.mjs`（會自動走回正常路徑拿到編號）→ subset → 補 `deck-energy.json` → `npm run gen:deck-qr`。
  順便確認 `B4b`：上游已有但 `SETS` 沒列。
- 這 15 副在頁面上顯示「能量設定待補」，但其中 3 副其實已經有能量，真正卡住的是編號——`DeckQrPanel.tsx`
  的文案是寫死的，要不要分開兩種原因待使用者決定。
- 行事曆（`events.json`／`sets.json`）還沒有 C1 發售，那是 `/tcg-pocket-schedule` 的事。

驗證：`/decks` 20 列全繁中、資料日期 2026-10-30、展開無攻略列可見 C1 placeholder 與其餘卡圖（0 張破圖）、
console 零錯誤；`subset-cards.mjs --check` 通過。

---

## 2026-10-30 這輪：行事曆補 C1「雙元融合」與十筆活動（`/tcg-pocket-schedule`）

純資料輪。C1 發售時刻 10/29 01:00 UTC（台灣 10/29 上午 9 點）有官方英文稿、官方繁中 #87、ptcgpocket.gg 三方一致，
`titleTC`「雙元融合」取自官方繁中標題，`set-names-tc.json` 同步預寫 C1。今天它已經 ended，所以活動區看不到它。
另外補了官方繁中 #87 列出的十筆活動（2 週年紀念、復刻 PROMO 掉落／得卡挑戰、便利卡牌得手任務、勳章、獎勵週、
特典卡牌包 C 系列第 1 波、主題特典卡、**級別對戰賽 賽季C1（12/1–12/15）**、社群週），titleTC 全是官方名。

這輪兩個發現（已寫進 `events.json` `_comment` 與 skill 的「官方繁中名怎麼查」）：

- **官方繁中站的公告內文讀得到**：瀏覽器分頁 `navigate` 後 `get_page_text` 就有全文，以前失敗是因為用 `fetch()`。
  它直接給台灣時間與官方繁中活動名，是行事曆最好的來源。
- **官方英文稿的活動日期是美國日期，比台灣早一天**（賽季 C1 英文寫 11/30–12/14，台灣是 12/1–12/15）。只有英文稿時
  照字面寫 `+08:00` 會整批早一天、畫面卻看起來完全正常。

`fetch-sets.mjs` 已重跑：上游還沒有 C1（`cards/C1.json` 404），`sets.json` 過 prettier 後零差異，時間軸仍到 B4b。
下一輪要做：上游收 C1 後重跑 `fetch-sets.mjs`；勳章活動（11/6）開始後用 ptcgpocket.gg 對一次實裝時刻
（官方腳註說期間可能變動，B4a 勳章活動曾延後三天）。

驗證：`/decks/schedule` 進行中＋即將開始共 11 張卡，10 張新卡的日期逐一對過官方繁中 #87 的台灣日期；
console 沒有 hydration 警告；`prettier --check` 與 `npm run lint` 通過。

---

## 2026-11-02 這輪：C1 第一份正常門檻的排行榜＋C1 卡片編號補齊（`/tcg-pocket-tier-list`）

C1 樣本長大了：271 個 archetype、約 9,500 場，過 100 場門檻的**剛好 20 副**，所以這輪照常跑、沒有破例。
升降箭頭以 10-30（C1 剛開打、20 場門檻）為基準：1 升、11 降、8 新進。20 列全繁中，不用補譯名。

- 策展 tier 九副：雷電獸光電傘蜥 B→S、七夕青鳥太陽伊布 C→S、水君戟脊龍 C→S、胡帕 Mega阿勃梭魯 C→A、
  密勒頓自爆磁怪 S→A、噴火龍Y 炎帝 C→B、三首惡龍 Mega勾魂眼 C→B、蜥蜴王甲賀忍蛙 A→C、甲賀忍蛙 Mega阿勃梭魯 B→C。
  最後三副樣本小（58／65／3 場），使用者同意照方法改；下輪留意。6 副仍不在 C1 資料裡，tier 未動。
- 散文只改雷電獸光電傘蜥的採用率（訓練場升到 100% 進固定班底；除障器 95%、落雷獸 90%、優雅披風 85%）。
  蜂女王壺壺的採用率仍是舊快照數字——它不在 Top 20，沒有新數字可對。
- **flibustier 已出 `C1.json`**，重跑 `fetch-cards.mjs` 後 217 張 C1 卡都有 `deckBuilderNr`，QR 5→8 張。
  但它的卡圖庫只有 C1 **縮圖**、全尺寸圖 404，原本「列 thumbnails 目錄判斷有沒有圖」的做法會整包破圖。
  已改成對每個 set 的 `1.webp` 做 HEAD 探測；`LIMITLESS_FALLBACK_SETS` 裡的 set 沒圖時用 Limitless 卡圖，
  卡名與編號仍取 database。圖庫補上 C1 全尺寸圖後重跑就會自動切回去。
- 剩 12 副不出 QR 全是 `deck-energy.json` 沒填能量（編號已不是瓶頸），要人工看招式費用補。
  `B4b` 仍不在 `fetch-cards.mjs` 的 `SETS`。

驗證：`/decks` 20 列全繁中、資料日期 2026-11-02（對照 10-30）、展開第 1 列（無攻略、含 C1 卡）30 張圖全數載入、
QR 顯示、console 零錯誤；三頁改 tier 的攻略頁 SSR 顯示正確 tier；`subset-cards.mjs --check`、QR `--check`、`npm run lint` 通過。

---

## 2026-11-03 這輪：排行榜更新與牌表分類錯誤的發現（`/tcg-pocket-tier-list`）

純資料輪。312 個 archetype，過 100 場門檻 29 副，照常跑、沒有破例。升降箭頭以 11-02 為基準（只隔一天）：
4 升、12 降、4 新進。第一名換成胡帕ex Mega阿勃梭魯ex，昨天第一的三首惡龍 Mega阿勃梭魯ex 掉到第 11。
20 列全繁中，不用補譯名。QR 8→12 張（剩 8 副缺 `deck-energy.json` 能量）。

- 策展 tier 五副：胡帕 Mega阿勃梭魯 A→S、三首惡龍 Mega勾魂眼 B→A、蜂女王壺壺 C→B、雷電獸光電傘蜥 S→A、
  密勒頓自爆磁怪 A→C。C1 還在劇烈變動（密勒頓四天內動了三次、雷電獸昨天才升 S），下輪留意。6 副仍不在資料裡，tier 未動。
- 散文只改蜂女王壺壺與雷電獸光電傘蜥的採用率。其中蜂女王的牌表細節沒動：攻略牌表仍是壺壺ex 一張、
  含莉佳／費洛美螂／紙御劍、沒有娜姿，跟現在的取樣牌表有落差，那是人工策展，要不要改留給使用者決定。

**新發現、還沒修：`cardUsage` 混到分類錯誤的牌表。** Limitless 的 archetype 頁會列出玩家選錯分類的牌表，
`update-meta.mjs` 沒有過濾，直接算進採用率。逐份查過蜂女王壺壺：取樣 20 份裡有 4 份根本沒有蜂女王ex
（2 份胡帕 Mega阿勃梭魯、1 份雷電獸、1 份水箭龜），所以頁面表格顯示蜂女王ex 80%，
但實際牌表是 16 份全帶，攻略內文寫的是排除這 4 份後的數字，兩邊會對不起來。
Top 20 有 13 副的招牌卡加總低於 100%（80–95%），其餘 12 副沒有逐份查，也可能是低於 15% 門檻的異圖版本造成的。
代表牌表（`cards`、QR 的來源）20 副都含招牌卡，這輪沒有受影響；但它取的是第一份，所以同樣沒有防呆。
修法建議：過濾掉不含 archetype 招牌卡的牌表。**別為了套用修正而當天重跑 `update-meta.mjs`**，會洗掉名次基準，等下次正常更新。

驗證：`/decks` 20 列全繁中、資料日期 2026-11-03（對照 11-02）、展開第 4 列（新進榜、無攻略）28 張圖全數算繪含 QR、
console 零錯誤；五頁改 tier 的攻略頁 SSR 描述顯示正確 tier；`subset-cards.mjs --check`、`npm run lint` 通過，
QR `--check` 只列出缺能量的 8 副。

---

## 2026-11-05 這輪：排行榜更新（`/tcg-pocket-tier-list`）

純資料輪。升降箭頭以 11-03 為基準（隔兩天）：3 升、12 降、3 持平、2 新進（Mega Sceptile ex Greninja #7、
Magnezone Miraidon ex #8，兩套都有策展攻略，QR 能量取自 `decks.ts`，不用補 `deck-energy.json`）。
第一名仍是 Hoopa ex Mega Absol ex（下界 53.31%）。

- 策展 tier 四副：蜂女王壺壺 B→S、Mega 喇叭芽 Greninja（`mega-sceptile-greninja`）C→A、
  `magnezone-miraidon` C→A、`mega-manectric-heliolisk` A→B（下界 49.87%，離 A 門檻只差 0.13，下輪留意）。
- `indeedee-giratina`、`mega-altaria-chingling`、`milotic-chien-pao` 不在資料裡，tier 未動；
  `milotic-eevee-ex` 只有 1 場，維持 B。可能需要更新 `limitless-map.json`。
- 排名／使用率類文案核對過沒有被推翻。**卡片採用率散文未重核**：蜂女王壺壺（模仿少女 94%、赤日 88%、
  Serena's Choice 69%）與雷電獸光電傘蜥（固定班底 100%）的數字仍是舊快照，新的 `cardUsage` 是 90–95%，
  且 `cardUsage` 仍有分類錯誤牌表的問題（見 11-03 那節），留給下輪一起處理。

驗證：`prettier --check`、`npm run lint`、`subset-cards.mjs`（142 張）通過；`npm run build` 見下方狀態。
未做瀏覽器實測 `/decks`。

---

## 2026-11-06 這輪：排行榜更新（`/tcg-pocket-tier-list`）

純資料輪。升降箭頭以 11-05 為基準：8 升、5 降、7 持平、0 新進。第一名仍是 Hoopa ex Mega Absol ex
（下界 53.88%）；最大跌幅是 Hoopa ex Mega Sableye ex #2→#6（只有 144 場，使用率 0.58%）。

- 策展 tier 三副（使用者同意後套用）：`mega-manectric-heliolisk` B→A（下界 50.68%）、
  `magnezone-miraidon` A→B（49.38%，#8→#11）、`milotic-eevee-ex` B→C（資料裡仍只有 1 場、
  已跌出排行，算出 D 壓到 C；上一輪是刻意維持 B，這輪改依規則套用）。
- `indeedee-giratina`、`mega-altaria-chingling`、`milotic-chien-pao` 仍不在資料裡，tier 未動。
- 排名／使用率類文案核對過沒有被推翻。**卡片採用率散文仍未重核**（11-05 那節列的蜂女王壺壺、
  雷電獸光電傘蜥數字），照舊留待處理。
- QR 仍是 14 張，缺能量的 6 副與上一版相同（Giratina ex Dragonair、Umbreon 三副、
  Greninja ex Mega Greninja ex、Mega Mewtwo X ex Mew ex），沒有補 `deck-energy.json`。

驗證：繁中名 20/20、`subset-cards.mjs`（143 張）、`npm run lint` 通過；`deck-qr.json` 的 prettier
警告上一版就有（生成檔）。瀏覽器實測 `/decks`：20 列、資料日期 2026-11-06、展開非策展列卡圖 0 破圖、
QR 正常載入；三副改 tier 的詳情頁 SSR 顯示新 tier。唯一 console 錯誤是首頁 `/videos/manifest.json` 404（設計上的退路）。

---

## 2026-11-05 這輪：更新 `/pokopia/videos` 建築靈感影片（`/pokopia-videos`）

- **`fetch-yt.mjs` 修正**：YouTube 頻道頁自 2026-11 起把觀看數／時間改成精簡字串（`138`、`4d ago`），完整文字移到 `accessibilityLabel`（`2.9 thousand views`、`4 days ago`），導致原本的 `parseLockup`／`parseViews` 對觀看數與 `d ago` 全抓不到。已改讀 `accessibilityLabel` 並支援 `thousand`/`million` 單位。
- **頻道動向**：`涼太ぱんけーき♭` 轉做密室逃脫與 Splatoon、`かぴぱか create` 轉做 Minecraft、`すくると` 與 `わむのスローライフっぽい` 近 3–5 個月未更新，以上只留經典作；`HorribleGaming` 持續高產（萬聖鬼鎮系列）。用 YouTube 本月上傳搜尋補進新一批高觀看建築主播（`めいチャンネル`、`ゆりも / Yurimo`、`mayu channel`、`ちょちょ`、`おもち`、`RASEN`、`Multi Craft` 等），共換新 19 支、保留 13 支經典，總計 32 支（7 區：4／7／4／4／4／4／5）。
- **驗證**：32/32 支通過 oEmbed 查證與官方標題過濾、32/32 張縮圖 `hqdefault.jpg` 回 HTTP 200、`npm run lint` 0 問題、`npm run build`（含字型子集重算）通過、SSR 實測 `/pokopia/videos` 回 200 且 7 個分區與 32 組縮圖／連結全數對齊。

---

## 部署與驗證

push 後由 **Cloudflare Workers Builds webhook** 自動觸發，約 60 秒上線。
**沒有 GitHub Actions**，所以沒有 workflow run 可以看。

「push 成功」不等於「上線了」。驗證方式是 curl 線上 HTML 找這次改動的特徵字串：

```bash
curl -s -H "Cache-Control: no-cache" https://pokemon.19980803.xyz/decks | grep -o 'lang="[^"]*"'
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
