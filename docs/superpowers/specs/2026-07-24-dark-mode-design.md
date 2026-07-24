# 深色模式 設計文件

日期：2026-07-24
狀態：已與使用者確認定案

## 目的

替兩個閱讀型子站 `/decks` 與 `/pokopia` 加上深色模式，預設跟隨作業系統偏好，
並提供手動覆寫（系統／淺色／深色三態）且記住選擇。

深色模式的真正成本不是 CSS 管線，是**對比驗證面積翻倍**——`/decks` 目前 0 處對比
失敗是專案硬底線（見 `core_rules.md`），加入深色模式後每個配色決定都要在兩個模式
各驗一次。所有取捨都圍繞這件事。

## 範圍

| 區塊                 | 是否做深色模式 | 理由                                                   |
| -------------------- | -------------- | ------------------------------------------------------ |
| `/decks`（含子頁）   | ✅ 做          | 閱讀型子站，停留時間長                                 |
| `/pokopia`（含子頁） | ✅ 做          | 同上                                                   |
| 404 / error 頁       | ✅ 做          | `.dark` 掛在 `<html>` 是全站的，不補會在深色模式下爆白 |
| `/`（首頁）          | ❌ 不做        | 全螢幕影片背景＋手繪塗鴉，沒有可反轉的主題表面         |

**首頁「不做」不等於「不用動」**——見下方「首頁隔離（陷阱二）」。

本設計有兩個「直覺會漏、漏了就是對比災難」的點，都在盤點時才浮現，
各自獨立成節：**陷阱一 `text-white` 不是自動安全的**、**陷阱二 首頁隔離**。

### 明確排除（非目標）

- 不順手完成 `docs/handoff.md` 待辦 A 的色彩收斂。只 token 化深色模式**強迫**要動的部分。
- 不改任何淺色模式的算繪值。淺色模式在這次改動前後必須逐位元組相同。
- 不引入主題管理套件（`next-themes` 等）。本專案不是 Next.js，且 `bunfig.toml` 的
  24 小時供應鏈防護讓加相依有額外摩擦。手寫的份量本來就小。

## 總體架構：三層，各管一件事

| 層        | 檔案                                              | 職責                                                                                              |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| CSS token | `src/styles.css`                                  | 重新宣告 `@custom-variant dark` ＋ `.dark {}` 區塊翻三組 token 值（guide／pokopia／shadcn oklch） |
| 主題狀態  | `src/lib/theme.ts`（新）                          | 三態解析、localStorage、監聽系統偏好變化、操作 `<html>` 的 class                                  |
| 切換 UI   | `src/components/ThemeToggle.tsx`（新）            | 44×44 按鈕 ＋ 三選項小選單，放進兩個 layout 的 header                                             |
| 防閃      | `src/routes/__root.tsx` 的 `<head>` inline script | 在首次繪製前搶先寫上 class，避免 SSR 白閃                                                         |

### 為什麼需要 `@custom-variant dark`

Tailwind v4 的 `dark:` variant **預設綁 `prefers-color-scheme`**，跟 class 無關。
要走 class 切換必須明確宣告：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

已確認目前全站 `dark:` 用量為 **0 處**、`@custom-variant dark` 確實不存在
（上一輪當死碼移除，`styles.css` 頂端註解已預告「若要加深色模式，連同 real toggle 一起補回」）。

## 色彩推導

依 UI/UX Pro Max 的 `color-dark-mode` 規則：**深色模式用去飽和／淺色調變體，不是把
顏色反轉**，且對比要分開量測。兩個子站的色系區隔（水藍 vs 暖棕，見 `CLAUDE.md`）
在深色模式下維持。

### `/decks` 水藍系（色相 ≈ 205°）

| token                  | 淺色      | 深色（起點） | 語意          |
| ---------------------- | --------- | ------------ | ------------- |
| `--guide-bg`           | `#eef7fc` | `#0f1a22`    | 頁面底        |
| `--guide-bg-panel`     | `#f8fcff` | `#16242f`    | 面板          |
| `--guide-bg-highlight` | `#f4fbff` | `#1a2c39`    | Tier S 高亮列 |
| `--guide-ink`          | `#2a6f97` | `#9fd0ea`    | 主要文字      |
| `--guide-ink-deep`     | `#1d5273` | `#cfe9f7`    | 強調文字      |
| `--guide-accent`       | `#5fa8d3` | `#5fa8d3`    | 點綴（不變）  |
| `--guide-tint`         | `#bfe3f5` | `#2e4b5e`    | 邊框／分隔    |

### `/pokopia` 暖棕系（色相 ≈ 27°）

| token                 | 淺色      | 深色（起點） |
| --------------------- | --------- | ------------ |
| `--pokopia-bg`        | `#faf6f1` | `#1a1512`    |
| `--pokopia-bg-panel`  | `#fffdf9` | `#241d17`    |
| `--pokopia-highlight` | `#fbe8dd` | `#33251b`    |
| `--pokopia-ink`       | `#4a3728` | `#ecdcc9`    |
| `--pokopia-ink-soft`  | `#6f5844` | `#bfa78d`    |
| `--pokopia-accent`    | `#a35f1f` | `#d98b3f`    |
| `--pokopia-tint`      | `#e8dcc8` | `#4a3b2c`    |

`--pokopia-accent` 是唯一必須換值的點綴色：`#a35f1f` 在深棕底上亮度差太小，
提亮到 `#d98b3f`。`--guide-accent` 的 `#5fa8d3` 在深藍底上本來就達標，維持原值。

### shadcn oklch 那組（404 / error 頁）

`--background`／`--foreground`／`--primary`… 等 34 個 oklch 變數只有 404 與 error 頁在用。
**直接用 shadcn 的標準深色值**（Lovable 模板原本就有、上一輪當死碼移除的那份），
不重新調配——這兩頁不是本次的設計重點，用上游標準值即可，只需驗對比通過。

### 兩個要注意的語意反轉

1. **`ink-deep` 在深色模式是「更亮」不是「更深」**。它承載的語意是「更強調」，
   淺色模式靠壓深達成，深色模式靠提亮達成。照字面理解會配出對比更低的值。
2. **`bg-highlight` 在深色模式是「更亮一階」**。淺色模式的高亮列比一般列更白，
   深色模式要比一般列更亮，不是更暗。

### 深色值是起點，不是定案

上表的深色值是依色相與明度階推導的起點。實作時照專案既有作法——起 preview、
用 canvas 解析**算繪後**顏色、逐節點算對比——逐一調整到全數通過。
`core_rules.md` 明訂不能只看 CSS 原始值。

## 硬編色處理：C 混合策略

已盤點：29 個檔案、約 180 處硬編色。策略是**只動深色模式強迫要動的**。

**其餘約 84 處為什麼不動**（先講清楚，免得審閱時以為漏了）：語意色晶片刻意維持
（tier 10 組、能量屬性十幾個、漲跌藥丸）、首頁那些硬編十六進位（隔離後不受影響）、
以及本來就安全的（`bg-black/55` 之類實心黑底、深底上的白字）。

### 收斂成 token（76 處，6 個新 token）

這幾組是深色模式下不動就會壞的，且它們本來就承載明確語意。
**所有新 token 的淺色值都逐位元組沿用現值**，淺色模式算繪結果不變。

| 現況                                | 新 token              | 淺色（保值） | 深色（起點） | 處數 |
| ----------------------------------- | --------------------- | ------------ | ------------ | ---- |
| `bg-white`（guide 側）              | `--guide-surface`     | `#ffffff`    | `#1e313f`    | 15   |
| `bg-white`（pokopia 側）            | `--pokopia-surface`   | `#ffffff`    | `#2b221b`    | 8    |
| `text-slate-700`                    | `--guide-ink-body`    | `#334155`    | `#b3c6d3`    | 10   |
| `text-slate-600`                    | `--guide-ink-muted`   | `#475569`    | `#93a9ba`    | 28   |
| `text-white` on `bg-guide-ink`      | `--guide-on-ink`      | `#ffffff`    | `#0f1a22`    | 8    |
| `text-white` on `bg-pokopia-accent` | `--pokopia-on-accent` | `#ffffff`    | `#1a1512`    | 7    |

**`surface` 刻意不併進 `bg-panel`**：`bg-white` 是 `#ffffff`、`--guide-bg-panel` 是
`#f8fcff`，合併會讓淺色模式的 23 處背景悄悄變色，等於把淺色的視覺變更夾帶進
「深色模式」這個改動裡。

**`ink-body` 與 `ink-muted` 刻意分成兩個**：`text-slate-700`（`#334155`）與
`text-slate-600`（`#475569`）是兩個不同明度階，併成一個 token 同樣會改到淺色算繪值。

### `text-white` 不是自動安全的（陷阱一）

直覺會以為「白字在深底上，深色模式下還是深底，不用動」。**盤點結果相反**：
16 處 `text-white` 裡有 **15 處**的底色是 `bg-guide-ink` 或 `bg-pokopia-accent`——
這兩個 token 在深色模式會翻成**淺色**（`#9fd0ea` / `#d98b3f`），白字壓上去對比直接爆掉。

涉及的元件：`CardUsagePanel`、`CuratedDecks`（Tier 篩選選中態）、`Decklist`、
`MetaRanking`（×2，含篩選選中態）、`NextSetBanner`、`RankChangeBadge`（「新」徽章）、
`ScheduleBoard`、`BuildingDetail`、`BuildingFilters`（×2）、`HabitatLookup`（×2）、
`PokopiaPage`、`BuildingList`。

解法就是上表的 `--guide-on-ink` / `--pokopia-on-accent`。命名沿用 Material 的
`on-<color>` 慣例（UI/UX Pro Max 的色板資料同樣有 `On Primary` / `On Accent` 欄位）。
深色值是同色相壓深的墨色——**這正是專案既有的規則**，`EnergyIcon.tsx` 與
`TierBadge.tsx` 的註解早就寫了「深底維持白字，淺／中明度底改用同色相壓深的墨色」，
只是在此之前只需要在淺色模式套用。

**唯一安全的那一處**是 `VideoInspiration.tsx:99` 的 `bg-black/55`——實心黑底不翻值，
白字維持原樣。

#### 底層不變式（給實作一個封閉集合，不要逐元件重新發現）

真正的規則不是「white 要換掉」，而是：**只要底色 token 在深色模式翻向淺色，
壓在上面的前景就必須跟著翻**。全站符合這個條件的底色只有兩個——
`bg-guide-ink` 與 `bg-pokopia-accent`（語意色晶片是自包含的，不算）。

已用 `grep -rnE "bg-(guide-ink|pokopia-accent)" src --include=*.tsx` 掃過全部 16 個
使用點，前景**清一色是 `text-white`**，沒有其他 `text-guide-*` / `text-pokopia-*`
混在上面。集合封閉——實作時只要確認這兩個底色的前景都走 `on-*` token 即可。

**兩處例外是沒有前景文字的純填色**（進度條）：`CardUsagePanel.tsx:41`
（`bg-guide-ink` 填在 `bg-guide-tint` 軌道上）與 `PokopiaPage.tsx:90`
（`bg-pokopia-accent` 填在 `bg-pokopia-tint` 軌道上）。它們不需要 `on-*` token，
但**填色與軌道的對比**要照 WCAG 1.4.11 驗（非文字 3:1），列進驗證清單。

### 就地加 `dark:` variant（約 20 處）

零星的功能色（`text-emerald-600`、`text-rose-500`、`bg-black/40` scrim 等）留在原地，
它們的深色值是各自獨立的判斷，抽成 token 反而失去脈絡。

### 語意色晶片：維持淺底深字，不做深色版

Tier 徽章（10 個 token）、能量屬性圖示、排名漲跌藥丸在深色模式**維持原樣**。

理由：徽章的作用就是要跳出來，而且它們的對比是**晶片內部**的（淺底 vs 深字），
不受頁面背景影響——已量測過的 10 組 tier 值與十幾個屬性色完全不用重算。

盤點時確認 `RankChangeBadge` 的漲跌**已經是淺底藥丸**（`#fce7ec` / `#e2f3ec` 底
＋ `#e30041` / `#008251` 字），符合這個決定，不用動。**唯一要處理的是 `same` 態**
的 `#69737e`——那是純文字色直接踩在頁面背景上，深色模式必須提亮。

## 首頁隔離（陷阱二）

`.dark` class 掛在 `<html>` 上是全站生效的，而首頁**大量讀 guide token**：

| 檔案                | 讀到的 token                                                  |
| ------------------- | ------------------------------------------------------------- |
| `routes/index.tsx`  | `--guide-tint`（tint 疊層）、`--guide-ink`（標題）            |
| `GuideEntry.tsx`    | `text-guide-ink`、`text-guide-ink-deep` ×3、`guide-tint` 漸層 |
| `Doodles.tsx`       | `--guide-ink`、`--guide-accent`（塗鴉線條與填色）             |
| `VideoBackdrop.tsx` | `--guide-tint`（fallback 底）、`--guide-ink`（點陣紋理）      |

若放著不管，深色模式下 `GuideEntry` 的便條紙仍是 `bg-white/80` 白底，但文字
`text-guide-ink-deep` 會變成 `#cfe9f7` 淺藍——**白底淺字，對比直接爆掉**。
首頁標題與塗鴉線條同理。

**作法**：`routes/index.tsx` 的根 `<main>` 加 `data-theme="light"`，
`styles.css` 補一個把 7 個 guide token 重設回淺色值的規則：

```css
/* 首頁不參與深色模式：把 token 值在該子樹重設回淺色 */
.dark [data-theme="light"] {
  --guide-ink: #2a6f97;
  --guide-ink-deep: #1d5273;
  --guide-accent: #5fa8d3;
  --guide-tint: #bfe3f5;
  --guide-bg: #eef7fc;
  --guide-bg-panel: #f8fcff;
  --guide-bg-highlight: #f4fbff;
}
```

CSS 自訂屬性沿 DOM 樹繼承（不是視覺樹），`GuideEntry` / `PokopiaEntry` 雖然是
`fixed` 定位，仍在 `<main>` 的 DOM 子樹內，因此涵蓋得到。

`PokopiaEntry.tsx` 用的是硬編十六進位（`#4a3728` / `#6f5844` / `#fffdf9`），
不讀 token，自動免疫，不用處理。

**這個隔離只擋 token，擋不了 `dark:` utility。** `.dark` 仍然掛在 `<html>` 上，
所以首頁子樹裡任何 `dark:` class 都還是會生效——token 重設對它們無效。
目前首頁 0 處 `dark:`（只用 token ＋ 硬編十六進位），所以現在是安全的，
但本計畫會在別處新增約 20 個 `dark:` variant。因此立一條不變式：

> **首頁的五個檔案（`routes/index.tsx`、`GuideEntry`、`PokopiaEntry`、`Doodles`、
> `VideoBackdrop`）不得使用 `dark:` utility。** 要改首頁配色就直接改值。

在 `styles.css` 的隔離規則旁留註解記下這條，否則日後有人在 `GuideEntry` 加一個
`dark:` 就會在首頁破洞，而且症狀只在深色模式的首頁出現，很難聯想。

**備案（未採用）**：把首頁那 4 個檔案的 token 消費改成硬編十六進位，讓首頁與攻略頁
完全脫鉤。概念更單純，也符合 `handoff.md` 已記載的認知（首頁重用同一組色是巧合，
不是品牌延伸），但 diff 大 4 倍。若日後首頁要有自己的深色版，再改走這條。

## 主題狀態（`src/lib/theme.ts`）

```
type ThemePreference = "system" | "light" | "dark";   // 使用者的選擇
type ResolvedTheme   = "light" | "dark";              // 實際套用的
```

- localStorage key：`piplup-theme`。值不合法或讀取失敗時退回 `"system"`。
- `"system"` 時讀 `matchMedia("(prefers-color-scheme: dark)")` 解析，
  並**監聽該 query 的變化**——使用者在系統層切換時要即時反應。
  切到 `"light"` / `"dark"` 時移除監聽。
- 套用方式：在 `<html>` 上加／移 `dark` class，同時設
  `style.colorScheme = resolved`——讓瀏覽器原生 UI（捲軸、表單控制項、autofill 底色）
  跟著變，否則深色頁面配白色捲軸。
- `theme-color` meta 同步更新（淺 `#eef7fc` / 深 `#0f1a22`）。
  不用 `media` 屬性的雙 meta 寫法，那只跟隨系統、不認手動覆寫。

### 錯誤處理

| 情況                               | 行為                                            |
| ---------------------------------- | ----------------------------------------------- |
| localStorage 不可用（隱私模式）    | try/catch 包住讀寫，退回 `"system"`，功能不中斷 |
| 存的值不是三個合法字串之一         | 視為 `"system"`                                 |
| SSR 環境沒有 `window` / `document` | `theme.ts` 的副作用只在 `useEffect` 內跑        |

## 防閃（FOUC）

SSR 產出的 HTML 不知道使用者偏好，若等 React hydrate 後才加 class，深色模式使用者
會先看到一幀白底。解法是在 `__root.tsx` 的 `<head>` 放一段**同步** inline script，
在首次繪製前就把 class 與 `colorScheme` 寫好。

限制：必須同步、無相依、自包含（不能 import `theme.ts`，那時模組還沒載入），
所以三態解析邏輯會在 script 與 `theme.ts` 各有一份。**兩份必須同步修改**，
在兩處都留註解互相指向。

## 切換元件（`ThemeToggle.tsx`）

**形式**：單一 44×44 按鈕開啟三選項小選單（系統／淺色／深色）。
不用 segmented control（塞不下，見下）、不用單鈕循環（使用者無法預期下一態是什麼）。

**避開 hydration mismatch**：按鈕的圖示切換用 **CSS**（靠 `.dark` class 決定顯示
哪個 svg），不用 React state。SSR 與首次 client render 的輸出因此完全一致。
選單內「目前選中哪一態」才需要 state，而那是點開後才渲染的。

**無障礙**：`aria-expanded`、Escape 關閉、點外面關閉、方向鍵在選項間移動、
選中項用 `aria-checked`。焦點環沿用全域 `:focus-visible` 規則（不加 `focus:outline-none`）。

### 硬約束：`/pokopia` 手機 header 的寬度預算

`PokopiaLayout` 剛在 2026-07-24 從 109px 壓回 61px，375px 下的實測預算是
可用寬 343px、目前佔 298px，**只剩 45px 餘裕**。塞一個 44px 按鈕會剛好吃光甚至溢位
折行，把上一輪的成果推翻。

**這是實測項，不能紙上決定。** 實作時要重新量 375px 的實際佔用，可能得把跨區膠囊
在手機版縮成圖示＋箭頭。使用者已確認可以接受動到跨區膠囊。

`GuideLayout` 的手機 header 較寬鬆，但同樣要重量一次。

## 驗證計畫

本專案沒有測試框架（見 `CLAUDE.md`），驗證方式是瀏覽器實測。
起 preview 用 `preview_start`（config `piplup-dev`），不要用 Bash 起。

### 對比（硬底線）

**七個頁面 × 兩個模式**各跑一次，用 canvas 解析算繪後顏色逐節點算對比：
`/decks`、`/decks/$deckId`、`/decks/schedule`、`/pokopia`、`/pokopia/videos`、
`/pokopia/habitats`，以及**一個不存在的網址**（觸發 404 頁，驗 shadcn oklch 那組）。

- `/decks` 深色模式也要 **0 處失敗**（淺色模式的 0 失敗不得退化）
- 內文 ≥4.5:1，次要文字 ≥3:1（pro-rules 的 Light/Dark 對比表）
- 展開列、Tier S 列、hover 態、focus-visible 環都要涵蓋

### 兩個模式都要檢查的非文字項目

依 pro-rules 的 `Border and divider visibility` 與 `State contrast parity`：

- 邊框／分隔線在深色模式看得見（`--guide-tint` / `--pokopia-tint` 是全新值）
- 兩條進度條的填色 vs 軌道對比 ≥3:1（`CardUsagePanel` 與 `PokopiaPage`，
  兩者的填色與軌道在深色模式**同時**換了值）
- focus 環在深色底可見（深色模式下 `--guide-ink` 變成淺藍，需確認）
- `bg-black/40` scrim 在深色背景上仍有隔離效果
- hover / 選中 / disabled 三個狀態在深色模式仍可區分

### 主題機制本身

- 硬重新整理（深色偏好下）首畫面**無白閃**
- `"system"` 態下改作業系統偏好，頁面即時反應
- 手動選深色 → 重新整理 → 仍是深色
- 隱私模式下切換不報錯（localStorage 被擋）
- 跨頁導覽（`/decks` → `/pokopia` → 首頁）主題狀態一致，且首頁維持淺色

### 回歸

- `npm run lint` 0 錯誤、`npx tsc --noEmit` 通過、`npm run build` 通過
- client 卡片索引 chunk 未回退（應維持 ~19 KB）
- console 0 錯誤（注意 `read_console_messages` 會回傳保留緩衝，見 `handoff.md`）
- 手機 375px 無水平溢位；所有觸控目標 ≥44px
- 淺色模式算繪值與改動前逐位元組相同（用 `getComputedStyle` 逐元素比對）

## 收工

完成後更新 `docs/handoff.md`：記錄深色模式的 token 對照、首頁隔離機制、
inline script 與 `theme.ts` 的雙份邏輯、兩個模式的實測對比數字。
