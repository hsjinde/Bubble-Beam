---
name: pokopia-videos
description: 更新 piplup-website /pokopia/videos 頁的建築靈感影片清單（src/data/pokopia/pokopia.ts 的 VIDEOS）。從日系與英文的 Pokopia 建築主播頻道、YouTube 播放清單抓近期影片，用 oEmbed 逐支查證存在並取官方標題，抓觀看數與發布時間篩選近期熱門，過濾掉主播頻道混入的他遊戲影片，按 7 個建築類型（城市街景／住宅別墅／商店餐飲／主題地標／機關自動化／自然造景／設計技巧）分類，更新資料並用瀏覽器＋lint＋build 驗證。只要使用者提到更新／重抓／刷新 pokopia 或 /pokopia/videos 的建築影片、影片清單過期、想加某個主播或某支新影片到影片頁、汰換失效影片，就用這個 skill——即使沒明講 skill 名稱。
---

# Pokopia 建築影片更新

更新 piplup-website `/pokopia/videos` 頁的建築靈感影片。影片資料是
`src/data/pokopia/pokopia.ts` 的 `VIDEOS` 陣列，每支綁一個建築類型 `group`，前端
`VideoInspiration.tsx` 按 group 分區渲染。

核心是**流程可信**：影片全是外部 YouTube 資源，隨時可能下架、被主播換主題、或主播整個
轉去做別款遊戲。所以每次更新都要「查證存在 + 取官方標題」，絕不憑印象填 video id——
假 id 會讓縮圖 404、卡片連結失效。難的解析與查證封裝在 `scripts/fetch-yt.mjs`，
判斷（哪些算近期熱門、歸哪一類）留給你。

## 資料結構與檔案

| 檔案 | 角色 |
|---|---|
| `src/data/pokopia/pokopia.ts` → `VIDEOS` | 影片清單（要更新的主體）|
| `src/data/pokopia/types.ts` → `VideoGroup` | 7 個建築類型的 union 型別 |
| `src/components/pokopia/VideoInspiration.tsx` → `GROUPS` | 各分區的標題與說明文案 |
| `src/routes/pokopia/videos.tsx` | 影片頁 route（頁首 h1 與說明）|

每支影片欄位：`id`（YouTube video id）、`title`（官方原文標題，保留日文／英文，專有名詞
不翻）、`channel`（頻道名）、`blurb`（一句繁中說明它適合看什麼）、`group`。縮圖與連結都由
id 組出（`i.ytimg.com/vi/{id}/hqdefault.jpg`、`youtube.com/watch?v={id}`），所以資料裡不存
縮圖 url——id 對了就都對。

## Workflow

`<skill-path>` 指本 skill 目錄；`<scratchpad>` 用你的暫存目錄。腳本需 Node 18+、無相依。

1. **抓候選**：

   ```bash
   # 看已知主播近況 + 近期影片（含觀看數、相對發布時間、影片長度）
   node <skill-path>/scripts/fetch-yt.mjs channels @horriblegamingofficial @sukurutogames @RYOTAPANCAKE @capypaca @Game-li7lz --json <scratchpad>/channels.json
   # 或從使用者給的播放清單抓（帶 list id 或整條 url 都行）
   node <skill-path>/scripts/fetch-yt.mjs playlist <listId或url> --json <scratchpad>/playlist.json
   ```

2. **篩近期熱門**：讀 channels.json，每個主播挑 `ageDays` 小（近 1–2 個月）且 `viewsNum`
   相對高的。先確認主播是否還在做 Pokopia：若近期影片標題全是別款遊戲（見步驟 3），這位
   已淡出，跳過或只留其經典作。日系精緻建築小眾，觀看常只有幾百到幾千，別純看數字——綜合
   近期活躍度、主題代表性、跟其他入選的多樣性。

3. **查證 + 過濾他遊戲**：候選 id 丟 oEmbed 查證，同時用回傳的官方 title 過濾。

   ```bash
   node <skill-path>/scripts/fetch-yt.mjs verify <id1> <id2> ...
   ```

   全部要 `ok: true`。看官方 title：出現 `Minecraft`／`マイクラ`／`Mario Kart`／
   `マリオカート`／`Splatoon`／`スプラ`／`Disney Dreamlight Valley`／`あつ森`（動森）等，
   就是混入頻道的他遊戲影片，剔除。（真的踩過：HorribleGaming 的 Hercules 競技場其實是
   Disney Dreamlight Valley；Haruchi 的幾支高觀看影片是動森。用官方 title 複查才抓得到。）

4. **分類**：每支歸一個建築類型 `group`（見下）。日系與英文影片不分語言、按內容混排。

5. **更新資料**：用 Edit 改 `pokopia.ts` 的 `VIDEOS`。`title` 用 oEmbed 回的官方原文、
   `channel` 用 `author_name`、`blurb` 自己寫一句繁中。若新增分類或改分區文案，同步
   `types.ts` 的 `VideoGroup` 與 `VideoInspiration.tsx` 的 `GROUPS`。

6. **驗證**（見下方「驗證」）。

## 已知主播（起點清單，截至 2026-07）

主播會變，每次先跑 `channels` 看近況，別假設不變。

**近期活躍（Pokopia 建築）**：`@horriblegamingofficial`（HorribleGaming，日英雙語、高產）、
`@sukurutogames`（すくると，島嶼導覽）、`@RYOTAPANCAKE`（涼太ぱんけーき♭，街づくり系列）、
`@capypaca`（かぴぱか create，短片神建築教學）、`@Game-li7lz`（わむのスローライフっぽい，偏
自動化機關流）。

**已淡出／需注意**：`@BiKZOch`（びくちゃんねる。→ 轉做瑪利歐賽車）、`@Make8Can`（めいきゃん
→ 轉做 Minecraft）、`@haruchicreate`（Haruchi create，近期停更 Pokopia，但發售初期作品是
這批人裡觀看最高的，可留經典）。

**英文主播**：Lex Play、CloudySkies Gaming、MSensei NTD、zoibean、consolecaito、Syd Mac、
lizzy3kate、Crossing Channel（多為 speed build／設計技巧向）。

## 建築類型分類（7 類，對應 VideoGroup）

- `city` 城市・街景：大都會、街區、島嶼導覽
- `house` 住宅・別墅：新手家園到海邊別墅
- `shop` 商店・餐飲：速食店、冰淇淋店、咖啡廳等機能小店
- `landmark` 主題・地標・遊樂：神殿、觀星屋、水上樂園等吸睛主題設施
- `automation` 機關・自動化：自動化設施、電路機關、收納機能基地
- `nature` 自然造景：露營地、療癒棲地、自然風小鎮
- `tips` 設計技巧・綜合：通用排版技巧、多合一靈感展示

每類建議 3–4 支，住宅可略多（使用者最初訴求是找蓋房子靈感）。

## 驗證

改完 `pokopia.ts` 後：

1. `npm run lint`（日文標題含 emoji／全形字，prettier 可能要求長標題換行——跑
   `npx prettier --write src/data/pokopia/pokopia.ts` 修）。
2. 起 preview（`preview_start` config `piplup-dev`），開 `/pokopia/videos`，讀 console
   確認無錯誤，用 javascript 確認分區數、卡片數、每張卡的縮圖 src 與連結 id 相符。
3. 縮圖是 hotlink，主動載入確認可達：頁面 console 對每個 id 用 `new Image()` 載
   `i.ytimg.com/vi/{id}/hqdefault.jpg`，全部 onload 才算過。
4. `npm run build` 確認正式建置通過（動到 route 或型別時尤其要跑）。

## 陷阱

- **絕不捏造 video id**：一律 oEmbed 查證。假 id → 縮圖 404、連結死。
- **頻道 videos 頁會混他遊戲影片**：`channels` 不自動過濾，靠官方 title 人工判斷。
- **觀看數 vs 近期**：日系建築小眾，別讓「熱門」壓過「近期＋主題契合」。
- **標題保留原文**：日文／英文專有名詞不翻；`blurb` 才是繁中。
- **腳本失敗時**：`fetch-yt.mjs` 若報「找不到 ytInitialData」或解析空，多半是 YouTube 改了
  版面（videos 頁曾從 videoRenderer 換成 lockupViewModel）——手抓一頁 HTML 檢查結構再修
  `parseLockup`／`collectPlaylist`。
