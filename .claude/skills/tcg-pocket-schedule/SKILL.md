---
name: tcg-pocket-schedule
description: 更新 piplup-website /decks/schedule 擴充包與活動行事曆——人工維護的活動清單（src/data/events.json：新擴充包發售、Drop 活動、Wonder Pick、排名賽季）與自動生成的歷代擴充包時間軸（src/data/sets.json，由 scripts/fetch-sets.mjs 重跑）。查官方公告與社群站取得日期、要求可查證來源、寫成帶正確時區偏移的 ISO 8601、更新 updatedAt，再用瀏覽器拿來源核對顯示日期並確認無 hydration 警告。只要使用者提到更新行事曆／活動／賽程、新擴充包什麼時候發售、活動過期了或倒數不見了、想加一筆活動或賽季、events.json、擴充包時間軸沒有最新的那包，就用這個 skill——即使沒明講 skill 名稱。牌組排行榜、勝率、tier 那條資料是另一個 skill（tcg-pocket-tier-list），別搞混。
---

# 擴充包與活動行事曆更新

更新 `/decks/schedule` 的兩段內容，以及 `/decks` 頁頂那條「即將發售」提示。

核心是**日期可信**。行事曆唯一的價值是「倒數是對的」——倒數錯了比沒有倒數更糟，因為
讀者會照它安排開包與衝分。所以每筆活動都要有可查證的 url，來源打架又判不出來時寧可不收。
這不是保守，是這個頁面的功能定義。

## 兩條資料來源（刻意分開，不要混）

| 檔案 | 性質 | 誰維護 |
|---|---|---|
| `src/data/events.json` | 即將發售與遊戲內活動。上游卡片資料庫**不收**未發售擴充包，也沒有遊戲內活動，所以只能人工查 | 手寫（本 skill 的主體）|
| `src/data/sets.json` | 歷代擴充包時間軸（code／發售日／卡數／pack）| `scripts/fetch-sets.mjs` 生成，**不要手改** |
| `src/data/schedule.ts` | 資料層：型別、`eventPhase`／`activeEvents`／`daysUntil` | 手寫，改欄位才會動到 |
| `src/components/guide/ScheduleBoard.tsx` | 行事曆算繪 | 改版面才會動到 |
| `src/components/guide/NextSetBanner.tsx` | `/decks` 頁頂提示條，吃 `nextSetRelease()` | 同上 |

`fetch-sets.mjs` **沒有掛在 prebuild**（prebuild 只有 `subset-cards.mjs` 與 sitemap）。
所以「隨上游自動更新」的實際意思是「你跑腳本時才更新」——新擴充包發售後沒人跑，時間軸就會少一包。

## Workflow

1. **先看現況**，別憑印象判斷哪些過期了：

   ```bash
   node - <<'EOF'
   const fs = require("node:fs");
   const { updatedAt, events } = JSON.parse(fs.readFileSync("src/data/events.json", "utf8"));
   const now = Date.now();
   console.log("updatedAt:", updatedAt, "| 今天:", new Date(now).toISOString().slice(0, 10));
   for (const e of [...events].sort((a, b) => a.startAt.localeCompare(b.startAt))) {
     const s = Date.parse(e.startAt);
     const end = e.endAt ? Date.parse(e.endAt) : s;
     const phase = now < s ? "upcoming" : now > end ? "ended" : "ongoing";
     console.log(phase.padEnd(9), e.type.padEnd(10), e.id, "→", e.endAt ?? e.startAt);
   }
   EOF
   ```

   全部 `ended` 代表前端現在是空的（會顯示「目前沒有進行中或即將開始的活動」）——這就是
   使用者說「行事曆空了／倒數不見了」的成因。

2. **查目前與即將的活動**：要找的是新擴充包發售日、Drop 活動、Wonder Pick 活動、排名賽季起訖。
   **各來源要用不同工具才取得到**（有的直連逾時、有的擋 curl、覆蓋度最好的那個只有瀏覽器分頁能開），
   照「資料來源」表的取法走。日期以官方公告為準，官方沒明講就要**兩個以上獨立來源一致**才收。

3. **寫入 `events.json`**：欄位規則見下。時區偏移是這裡最容易錯的一件事，先讀「時區規則」。

4. **新擴充包已發售的話，重跑時間軸**：

   ```bash
   node scripts/fetch-sets.mjs            # 連線逾時的話見下方「陷阱」，是本地網路不是腳本壞了
   git diff --stat src/data/sets.json     # 確認真的多了一包，而不是白跑
   ```

   上游（flibustier）只在擴充包**實際發售後**才收錄。剛發售可能還沒進上游，此時 `sets.json`
   不會變，那包就繼續留在 `events.json` 當 `upcoming`——不用急，下次再跑。

5. **更新 `updatedAt`**：改任何一筆都要更新成今天（`YYYY-MM-DD`）。前端會把它顯示給讀者看
   （「活動清單為人工維護，最後更新 …」），沒更新等於騙人。

6. **驗證**（見下方「驗證」）。

## 時區規則（最容易錯的一件事，先讀完再動手）

**這是唯一會靜默出錯的地方，所以它值得你在動手前先讀完。**

`formatDate`（顯示）與 `daysUntil`（倒數）都是把 ISO 瞬間換算到**讀者當地時區**再取日曆日。
兩者用同一套換算，所以它們永遠自洽——時區偏移寫錯時，日期與天數會**一起**位移，
畫面看起來毫無破綻。實測（本機 +08:00、今天 7/24）：

| `endAt` | 卡片顯示 | 倒數 |
|---|---|---|
| `2026-07-26T23:59:00+08:00` | 2026/07/26 | 還有 2 天 |
| `2026-07-26T23:59:00Z` | 2026/07**/27** | 還有 **3** 天 |

兩列都自洽，但下面那列整整晚了一天。**所以驗證只能拿「來源寫的日期」去核對卡片顯示的日期，
不能拿卡片自己的兩個數字互相對。**

- **整天活動**（Drop、Wonder Pick、排名賽季）→ 一律寫 `+08:00`。
  本站讀者主要在台灣，遊戲內活動的「整天」指的是當地的一天。
  結束時間用當天的 `23:59:00+08:00`，不是隔天 `00:00`。
- **擴充包發售**這種官方有公布精確時刻的 → 照官方公告的真實時刻寫，可以是 `Z`
  （現有的 B4 就是 `2026-07-30T01:00:00Z`）。
- 只有起始時間點的（如發售）就不要寫 `endAt`，前端會渲染成「7/30 發售」而非區間。

## `events.json` 欄位

```json
{
  "id": "b4-ruler-of-the-skies",
  "type": "set",
  "title": "Ruler of the Skies（B4）",
  "titleTC": "天空的支配者",
  "startAt": "2026-07-30T01:00:00Z",
  "note": "第八個主要擴充包，Mega Rayquaza ex 登場。",
  "url": "https://www.pokemon.com/us/news/…"
}
```

- `id`：kebab-case。重複性活動帶年月或季數避免撞名（`ranked-season-15`、`hisuian-zorua-drop-2026-07`）。
- `type`：`set`／`drop`／`wonderpick`／`ranked`／`other`。型別 union 定義在 `schedule.ts`，
  要加新類型就得同步改那裡的 `EventType` 與 `EVENT_TYPE_LABEL`（少改一邊 tsc 會擋）。
- `title`：英文原文——玩家在遊戲與 Limitless 看到的就是這個。
- `titleTC`：官方繁中名。**官方還沒公布就整個欄位省略，不要自己翻**，前端會只顯示英文原名。
- `endAt`：沒有結束時間（如擴充包發售）就省略，前端會渲染成「7/30 發售」而非區間。
- `note`：一句繁中說明這活動在幹嘛。
- `url`：**必填**，可查證的來源。

檔案層級：

- **過期的活動不必刪**：前端依現在時間自動分桶，`ended` 的就不顯示。留著反而是查證紀錄。
  真的太舊（超過半年）再清，保持檔案好讀。
- 檔頭那段 `_comment` 陣列是給下一個維護者看的規則書。改了維護規則要同步更新它——
  它是合法 JSON 的一部分，別破壞格式。

## 資料來源

每個站擋機器人的方式不同，**用錯工具會得到 403 或逾時，看起來像「這站掛了」，其實只是走錯門**。
下表的取法是 2026-07-24 逐一實測的結果；站會改版，抓不到時先換另一條路徑再判定它真的不能用。

| 來源 | 取法（實測）| 內容 |
|---|---|---|
| **官方** `pokemon.com` 新聞稿、遊戲內公告、X `@PokemonTCGP` | WebSearch／WebFetch | 有官方就以官方為準，其餘都是佐證 |
| **Pokemon Zone** `pokemon-zone.com/schedule/` | **只有瀏覽器分頁能開**：`preview_start {url}` → `get_page_text`。直連逾時、WebFetch 吃 403 | 覆蓋度最好：進行中／即將／已結束、Wonder Pick、Drop、排名賽季、商店，還帶倒數 |
| **Game8** `game8.co/games/Pokemon-TCG-Pocket` | **WebFetch**（curl 會吃 403，擋 UA）| 活動細節與發售時刻詳盡（B4 的 `6pm PDT` 就查得到）|
| **Serebii** `serebii.net/tcgpocket/` | curl／WebFetch 皆可 | **索引頁沒有日期**，要進分頁：`events.shtml`（特殊活動）、`dropevents.shtml`、`wonderpickevents.shtml`、`rankedmatch.shtml` |
| **Limitless** `pocket.limitlesstcg.com` | curl／WebFetch 皆可 | 賽事端為主，擴充包發售日可交叉驗證 |

社群站彼此會互抄，兩個都抄同一篇不算「兩個獨立來源」——看它們有沒有各自附官方連結。

## 驗證

1. `npx prettier --check src/data/events.json`。**`npm run lint` 檢查不到它**——eslint 只設定了
   `**/*.{ts,tsx}`，JSON 一律被跳過（會回「File ignored because no matching configuration」）。
   只動 `events.json` 時跑 lint 等於什麼都沒驗。動到 `.ts`／`.tsx` 才需要 `npm run lint`。
2. 起 preview（`preview_start` config `piplup-dev`），開 `/decks/schedule`：
   - console **不能有 hydration 警告**。時間相關內容全部在 `useEffect` 之後才算繪就是為了這個，
     如果動到 `ScheduleBoard`／`NextSetBanner` 的算繪時機，這裡會炸。
   - 逐張卡拿**來源寫的日期**核對卡片顯示的日期：來源說 7/26 結束，卡片就要顯示「2026/07/26」。
     顯示成 7/27 就是把 `+08:00` 寫成 `Z` 了。**不要拿卡片自己的日期與倒數天數互相對**——
     兩者共用同一套時區換算，錯的時候會一起錯、看起來完全自洽（見「時區規則」的對照表）。
   - 有 `type: "set"` 的 upcoming 活動時，開 `/decks` 確認頁頂提示條出現且天數一致。
3. `npm run build`（動到 `schedule.ts` 型別時尤其要跑）。

## 陷阱

- **來源打架就不要收**：Wonder Pick 的結束日特別容易打架——連**同一個站的同一頁**都會不一致
  （2026-07-24 實測：Pokemon Zone 頂部把 Growlithe and Emolga 標成「7月19日 - 8月5日」，同頁下方
  Wonder Picks 區塊卻寫「Jul 19 - Jul 29」；Game8 也是 Jul 29）。多半是「抽卡開放期」與
  「任務／獎勵領取期」是兩段時間，被不同區塊各取一段。判不出來就整筆不放，空著比錯著好。
- **不要自己編 `titleTC`**：官方繁中名沒公布就省略欄位，前端會只顯示英文原名。自己翻的譯名
  會被讀者當成官方名。
- **`sets.json` 不要手改**：它是生成檔，下次跑 `fetch-sets.mjs` 會被整個覆寫，手改必然遺失。
  未發售的擴充包屬於 `events.json`，不屬於這裡。另外它目前**不在 `.prettierignore` 裡**（其他生成檔
  都在），而產生器沒寫結尾換行，所以 `npx prettier --check` 會對它報警——那是既有狀態，不是你弄壞的。
  別為此跑 `prettier --write` 去「修好」它：下次跑 `fetch-sets.mjs` 又會被寫回去，只是多一份無意義 diff。
- **`fetch-sets.mjs` 抓不到上游**：`raw.githubusercontent.com` 從這台機器連線逾時（2026-07-24
  實測，沙箱內外皆同，是本地網路而非腳本壞了）。同一份檔案的 CDN 鏡像可用且內容相同：
  `https://cdn.jsdelivr.net/gh/flibustier/pokemon-tcg-pocket-database@main/dist/sets.json`。
  需要時把 `fetch-sets.mjs` 的 `SRC` 暫時指過去，跑完 `git checkout scripts/fetch-sets.mjs` 還原，
  並用 `git status` 確認腳本沒被留下改動。
- **別把「更新行事曆」和「更新排行榜」混在一起**：牌組勝率／tier／Top 20 是 `tcg-pocket-tier-list`
  skill 的事，動的是 `meta.json`。兩者互不相干，一次做一件。
