# 波加曼互動頁面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建一個波加曼互動頁面：全頁影片背景輪播＋手繪塗鴉前景＋跟隨滑鼠的波加曼（三狀態機），線上版部署在 Lovable、本地版可播下載的影片檔。

**Architecture:** 主力在 Lovable 平台開發（透過 Lovable MCP 的 `create_project` / `send_message` 迭代），瀏覽器實測驗證。程式碼內建影片來源開關：`/videos/manifest.json` 存在時用本地 `<video>`，否則用 YouTube IFrame 嵌入——同一份程式碼支援線上／本地雙版本。最後把程式碼經 MCP 導出到本地 repo，影片用 yt-dlp 下載（僅存本地，不進部署）。

**Tech Stack:** Lovable（React + Vite + Tailwind）、YouTube IFrame API、PokeAPI sprites、yt-dlp（本地）

## Global Constraints

- 驗證方式一律為瀏覽器實測（無測試框架）——spec 明定。
- 淡藍水系配色，基底色 `#bfe3f5`，手繪塗鴉風。
- `DoodleLayer` 必須 `pointer-events: none`，不得攔截滑鼠事件。
- 下載的影片檔**絕不**上傳或進入部署：`public/videos/*.mp4` 與 `public/videos/manifest.json` 必須在 `.gitignore`。
- yt-dlp 下載清單需先向使用者列出並取得同意才執行。
- 按下 Lovable 部署前需向使用者確認。
- 波加曼素材：PokeAPI `#393`（official artwork：`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png`）。
- 給 Lovable 的 prompt 用英文（生成品質較穩），使用者溝通用繁體中文。

---

### Task 1: 建立 Lovable 專案與三層骨架

**Files:**
- Lovable 專案（新建）：頁面骨架，元件由 Lovable 自行組織
- 本計畫檔：勾選進度

**Interfaces:**
- Produces: Lovable 專案 ID 與 preview URL（後續所有任務用 `send_message` 對同一專案迭代）；三個圖層 DOM：`#video-backdrop`（z-0）、色調覆蓋層（z-10）、`#doodle-layer`（z-20, pointer-events-none）、`#piplup`（z-30）

- [ ] **Step 1: 載入 Lovable MCP 工具**

用 ToolSearch 載入：`select:mcp__a40737eb-41a3-470f-a972-953bf059636f__create_project,mcp__a40737eb-41a3-470f-a972-953bf059636f__send_message,mcp__a40737eb-41a3-470f-a972-953bf059636f__get_project,mcp__a40737eb-41a3-470f-a972-953bf059636f__list_messages`

- [ ] **Step 2: create_project 建立專案**

Prompt（傳給 `create_project`）：

```text
Create a playful single-page Piplup (Pokémon #393) fan site. No routing, no navbar, no footer.

Full-viewport layout with stacked fixed layers:
1. id="video-backdrop", z-0, full screen: for now just a light-blue background (#bfe3f5) with a subtle hand-drawn paper texture (CSS only).
2. A translucent light-blue tint overlay, z-10, full screen (rgba(191,227,245,0.25)). This layer keeps default pointer-events so the mouse never reaches the backdrop below.
3. id="doodle-layer", z-20, full screen, style pointer-events: none. Empty for now.
4. id="piplup", z-30: an <img> (src https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png, width 120px, draggable=false) absolutely positioned at screen center.

Add a small hand-drawn-style title "Piplup!" (rounded playful font, dark blue #2a6f97) in the top-left corner inside the doodle layer. Nothing else.
```

- [ ] **Step 3: 瀏覽器驗證骨架**

`get_project` 取得 preview URL → `mcp__Claude_Browser__navigate` 開啟 → 截圖。
預期：淡藍底、置中波加曼圖、左上角 Piplup! 標題；console（`read_console_messages`）無紅字錯誤。

- [ ] **Step 4: 回報進度並在本計畫勾選 Task 1**

---

### Task 2: 挑選官方影片清單（需使用者確認）

**Files:**
- Create: `docs/superpowers/plans/video-list.md`（影片清單記錄：標題 + YouTube video ID + 網址）

**Interfaces:**
- Produces: 3–5 部官方波加曼影片的 YouTube video ID 陣列，供 Task 3（嵌入輪播）與 Task 8（yt-dlp 下載）共用

- [ ] **Step 1: 搜尋候選影片**

用 WebSearch／瀏覽器搜尋「Piplup official Pokémon YouTube」「ポッチャマ 公式」等關鍵字，鎖定**寶可夢官方頻道**（The Official Pokémon YouTube channel、Pokémon Kids TV 等）的波加曼主題影片，挑 3–5 部，記下標題與 video ID。選片標準：畫面可愛、適合當背景（動態豐富）、長度 1–5 分鐘佳。

- [ ] **Step 2: 向使用者列出清單並取得同意**

列表格式：標題／頻道／長度／網址。使用者可換片。**未同意前不進入下一步。**

- [ ] **Step 3: 寫入 `video-list.md` 並 commit**

```bash
git add docs/superpowers/plans/video-list.md
git commit -m "docs: confirmed Piplup video playlist"
```

---

### Task 3: VideoBackdrop——YouTube 輪播背景

**Files:**
- Lovable 專案：`VideoBackdrop` 元件（`send_message` 迭代）

**Interfaces:**
- Consumes: Task 2 的 video ID 陣列（填入 prompt 的 `VIDEO_IDS`）
- Produces: 全頁 YouTube 輪播背景；`#video-backdrop` 內部實作改變，對外圖層結構不變

- [ ] **Step 1: send_message 實作 YouTube 輪播**

Prompt（`<VIDEO_IDS>` 換成 Task 2 確認的 ID 陣列）：

```text
Replace the #video-backdrop placeholder with a YouTube background carousel component named VideoBackdrop.

Requirements:
- const VIDEO_IDS = [<VIDEO_IDS>]; keep it in a small config file so it is easy to edit.
- Use the YouTube IFrame Player API (load https://www.youtube.com/iframe_api once).
- Player options: autoplay 1, mute 1, controls 0, disablekeyboard, playsinline 1, rel 0, modestbranding 1.
- Cover-crop technique: size the iframe to cover the viewport like background-size: cover — center it and scale so both dimensions always fill the screen (use a 16:9 assumption, recompute on window resize).
- On video ENDED: play the next ID (loop back to the first after the last).
- Keep the existing z-10 tint overlay above the iframe; the iframe must never receive mouse events.
- Keep the paper-texture light-blue background behind the iframe as loading backdrop.
```

- [ ] **Step 2: 瀏覽器驗證輪播**

開 preview URL：影片應靜音自動播放且滿版無黑邊；用 `javascript_tool` 執行 `player.seekTo(player.getDuration()-3)` 類似手段（或等待）驗證播畢會切下一部；縮放視窗驗證 resize 後仍滿版。console 無紅字。

- [ ] **Step 3: 勾選 Task 3**

---

### Task 4: Piplup 追逐狀態（跟隨滑鼠）

**Files:**
- Lovable 專案：`Piplup` 元件

**Interfaces:**
- Produces: `Piplup` 元件內部狀態機骨架（`chase` 狀態），Task 5 在其上加 `idle`/`sleep`/`react`

- [ ] **Step 1: send_message 實作追逐**

```text
Make the #piplup image chase the mouse cursor. Implement inside a Piplup component:

- Track the cursor with a window mousemove listener; target = cursor position offset by (+24px, +24px) so Piplup runs beside the pointer, not under it.
- Animation loop with requestAnimationFrame: position += (target - position) * 0.07 (linear interpolation, so it naturally runs faster when far away).
- Structure it as a tiny state machine with a `state` variable, currently only "chase"; more states come later.
- When distance to target < 12px, treat as "arrived": stop the bounce (below) and stand still.
- Flip horizontally with transform scaleX(-1) when the target is to the left of Piplup (artwork faces right by default; flip logic must make Piplup face its running direction — verify visually and invert if needed).
- While moving, bounce: translateY = sin(time * 18) * 6px. No bounce when arrived.
- Piplup must never be selectable or draggable; cursor stays default.
```

- [ ] **Step 2: 瀏覽器驗證追逐**

移動滑鼠畫圈：波加曼要平滑追上、遠快近慢、朝向移動方向翻轉、跑動有彈跳、到達後靜止。滑鼠移到影片區上方（tint overlay）追逐仍要正常（iframe 未搶事件）。

- [ ] **Step 3: 勾選 Task 4**

---

### Task 5: 發呆／睡著＋點擊反應

**Files:**
- Lovable 專案：`Piplup` 元件（擴充狀態機）

**Interfaces:**
- Consumes: Task 4 的 `chase` 狀態機
- Produces: 完整四狀態：`chase` / `idle` / `sleep` / `react`

- [ ] **Step 1: send_message 擴充狀態機**

```text
Extend the Piplup state machine with three more states:

- idle: if the mouse has not moved for 5 seconds, enter idle — Piplup sways gently side to side (small rotate -4deg..4deg loop) and blinks (briefly scale a small dark overlay or squint via CSS, keep it simple: a slow subtle squash animation is fine).
- sleep: after 15 seconds of no mouse movement (10s after idle began), enter sleep — stop swaying, add a floating hand-drawn "Zzz" (inline SVG, wobbly stroke style, dark blue) rising above Piplup's head on a loop.
- Any mousemove instantly returns to chase (remove Zzz immediately).
- react: when the user clicks on Piplup (pointer events on the image only), jump: quick translateY up 40px and back (300ms ease-out), and spawn 3 small hand-drawn hearts (inline SVG, pink-red, wobbly stroke) that float up from Piplup and fade out over 1s. Then return to the previous behavior. Clicking during any state works, including sleep (it wakes Piplup).
- Timers must reset correctly on every mousemove; no stacked timeouts (clear on reset).
```

- [ ] **Step 2: 瀏覽器驗證四狀態**

（1）停 5 秒 → 搖晃發呆；（2）續停到 15 秒 → Zzz 出現；（3）動滑鼠 → Zzz 立即消失並恢復追逐；（4）點波加曼 → 跳起＋愛心飄散；（5）睡著時點擊也會醒。console 無紅字、反覆進出狀態無累積錯誤（timers 沒清乾淨會出現行為錯亂——重複測 3 輪）。

- [ ] **Step 3: 勾選 Task 5**

---

### Task 6: DoodleLayer 塗鴉前景＋游標水滴粒子

**Files:**
- Lovable 專案：`DoodleLayer` 元件

**Interfaces:**
- Produces: 前景裝飾層；維持 `pointer-events: none` 之全域約束

- [ ] **Step 1: send_message 實作塗鴉層**

```text
Fill the #doodle-layer (pointer-events: none, keep it that way) with hand-drawn doodle decorations:

- 10-14 inline SVG doodles: water bubbles, four-point sparkle stars, tiny fish, music notes. Hand-drawn look: wobbly stroke paths, stroke width 2-3, stroke colors from #2a6f97 / #5fa8d3 / white, mostly transparent fills.
- Scatter them around the viewport edges and corners (avoid the center where Piplup plays), sizes 24-64px.
- Each doodle floats: slow drift up/down or side to side, gentle rotation, subtle scale pulse. Randomize duration 8-20s and delay per doodle so nothing moves in sync. CSS animations only.
- Cursor droplets: on mousemove (throttled to every ~120ms), spawn a small hand-drawn water droplet SVG at the cursor that falls ~40px and fades out over 800ms, then is removed from the DOM. Cap live droplets at 20 — skip spawning when at cap.
- All of this must not affect the existing layers or performance: no layout thrash, transforms + opacity only.
```

- [ ] **Step 2: 瀏覽器驗證塗鴉層**

塗鴉飄浮不同步、不擋畫面中心；快速甩滑鼠 30 秒：水滴出現又消失、DOM 節點數不增長（`javascript_tool` 查 `document.querySelectorAll('#doodle-layer *').length` 前後比較）、波加曼追逐與點擊完全不受影響（pointer-events 穿透）。截圖整體視覺給使用者。

- [ ] **Step 3: 勾選 Task 6**

---

### Task 7: 錯誤處理與影片來源開關（雙版本關鍵）

**Files:**
- Lovable 專案：`VideoBackdrop`（來源開關）、`Piplup`（圖片 fallback）

**Interfaces:**
- Produces: `fetch('/videos/manifest.json')` 開關協定——本地版只要放 `public/videos/manifest.json`（格式：`{"videos":["file1.mp4", ...]}`）＋影片檔即自動切換為本地 `<video>` 模式。Task 9 依賴此協定。

- [ ] **Step 1: send_message 實作開關與 fallback**

```text
Two robustness changes:

1. Video source switch in VideoBackdrop:
   - On mount, fetch('/videos/manifest.json'). If it returns ok with JSON {"videos": [...]} and the array is non-empty, use LOCAL mode; otherwise (404, network error, empty) use the existing YouTube mode.
   - LOCAL mode: render a full-screen <video> (muted, autoplay, playsinline, no controls, object-fit: cover) playing /videos/<name> from the manifest list; onEnded advance to the next file, loop the list. Reuse the same cover-fill and tint overlay.
   - YouTube mode error handling: on the player's onError event, skip to the next video id. If every id in the list has errored, hide the iframe and fall back to the light-blue paper-texture background permanently (doodles and Piplup still work).

2. Piplup image fallback chain: try src "/piplup.png" first; onError switch to https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png; if that also errors, render an inline SVG placeholder: a simple hand-drawn penguin shape (light blue body #5fa8d3, white face, orange beak) so the site never shows a broken image.
```

- [ ] **Step 2: 瀏覽器驗證 fallback**

（1）正常載入仍為 YouTube 模式（線上沒有 manifest → 404 → fallback 正確）；（2）用 `javascript_tool` 暫時把 VIDEO_IDS 換成不存在的 ID 模擬全滅 → 應退回淡藍紙張背景且波加曼照常互動（改完記得重整還原）；（3）`/piplup.png` 線上不存在 → 應自動用 PokeAPI 圖（Network 面板確認 fallback 鏈觸發）。

- [ ] **Step 3: 勾選 Task 7**

---

### Task 8: 程式碼導出到本地 repo

**Files:**
- Create: 本地 repo 根目錄（`package.json`、`src/**`、`public/**` 等，全部來自 Lovable 專案）
- Create: `.gitignore`（含影片排除規則）
- Create: `public/videos/.gitkeep`

**Interfaces:**
- Consumes: Lovable MCP `list_files` / `read_file`
- Produces: 可 `npm run dev` 的本地專案；`public/videos/` 空資料夾等待 Task 9 放影片

- [ ] **Step 1: 導出所有專案檔**

載入 `mcp__a40737eb-41a3-470f-a972-953bf059636f__list_files` 與 `read_file` → 列出專案全部檔案 → 逐一 `read_file` 並寫到 `D:\piplup-website\` 對應路徑（跳過 node_modules 類）。

- [ ] **Step 2: 建立 `.gitignore` 與影片資料夾**

`.gitignore` 必含：

```gitignore
node_modules/
dist/
public/videos/*.mp4
public/videos/*.webm
public/videos/manifest.json
```

建立 `public/videos/.gitkeep`。

- [ ] **Step 3: 本地跑起來驗證**

```powershell
npm install; npm run dev
```

用瀏覽器開 `http://localhost:5173`（或 Vite 實際 port）：行為應與線上版一致（YouTube 模式，因為 videos/ 還是空的）。

- [ ] **Step 4: 下載波加曼圖到 public**

下載 `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png` 存為 `public/piplup.png`（約 300KB；Task 7 的 fallback 鏈第一順位，讓本地離線也有圖）。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: export Piplup site from Lovable, add local video scaffolding"
```

---

### Task 9: yt-dlp 下載影片＋本地版驗證

**Files:**
- Create: `public/videos/*.mp4`（不進 git）
- Create: `public/videos/manifest.json`（不進 git）

**Interfaces:**
- Consumes: Task 2 確認過的影片清單；Task 7 的 manifest 協定

- [ ] **Step 1: 確認 yt-dlp 可用**

```powershell
yt-dlp --version
```

沒裝的話：`winget install yt-dlp.yt-dlp`（需向使用者確認安裝）。

- [ ] **Step 2: 向使用者最後確認下載動作**

列出 Task 2 清單（含每部預估檔案大小），確認後才下載。

- [ ] **Step 3: 逐部下載**

```powershell
yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "public/videos/%(id)s.mp4" <影片URL>
```

- [ ] **Step 4: 產生 manifest.json**

```powershell
$files = Get-ChildItem public/videos -Filter *.mp4 | Select-Object -ExpandProperty Name
@{ videos = $files } | ConvertTo-Json | Out-File -Encoding utf8 public/videos/manifest.json
```

- [ ] **Step 5: 本地驗證影片模式**

`npm run dev` → 開瀏覽器：背景應改播本地影片（無 YT 浮水印）、播畢換下一部；`git status` 確認影片與 manifest 未被追蹤。再驗證波加曼、塗鴉一切正常。

- [ ] **Step 6: 勾選 Task 9（無 commit——本任務產物皆在 .gitignore 內）**

---

### Task 10: 部署（需使用者確認）

**Files:**
- Lovable 專案：部署設定

**Interfaces:**
- Consumes: Lovable MCP `deploy_project`
- Produces: 公開網址

- [ ] **Step 1: 向使用者確認部署**

確認：（1）要部署、（2）公開範圍（公開連結即可？）。**未確認不執行。**

- [ ] **Step 2: deploy_project 並驗證線上版**

載入並呼叫 `mcp__a40737eb-41a3-470f-a972-953bf059636f__deploy_project` → 用瀏覽器開部署網址，跑一次 Task 3–7 的驗證重點（輪播、追逐、四狀態、塗鴉、fallback 為 YouTube 模式）。

- [ ] **Step 3: 把網址回報給使用者，計畫全部勾選完成**
