<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# AGENTS.md

本檔案為 AI Agents（包括 Antigravity, Claude Code, Codex 等）提供在 **Bubble-Beam** 專案庫中協作開發時的指導與規範。

---

## 1. 跨 Agent 共用規則與協同機制

- **主要指引檔案**：`CLAUDE.md` 與 `AGENTS.md`、`core_rules.md` 為專案的核心規則來源。
- **工作狀態追蹤**：
  - 開工前請務必閱讀 `docs/handoff.md`（掌握目前前端品質狀態、待辦事項、部署驗證方式）。
  - 動手前執行 `git fetch`，確認沒有其他人 / Agent 正在進行衝突的改動。
  - 每輪工作結束時，需同步更新 `docs/handoff.md`。

---

## 2. 專案概述與架構

本專案為一個非官方波加曼（Piplup）與 Pokémon TCG Pocket 攻略粉絲站，基於 **TanStack Start (React)** + **Vite** 打造：

1. **`/` (首頁)**：
   - 波加曼互動遊樂場，包含全螢幕背景影片、手繪塗鴉層（`Doodles`）、跟隨滑鼠的波加曼狀態機（`Piplup`）。
   - **圖層堆疊**：`VideoBackdrop` (z-0) → 淡藍 tint (z-10) → `Doodles` 塗鴉層 (z-20, `pointer-events: none`) → `Piplup` (z-30)。
   - **雙模式影片背景**：優先讀取 `/videos/manifest.json` 使用本地影片，否則 fallback 到 YouTube IFrame API / 純色背景。
   - ⚠️ **版權與部署禁忌**：`public/videos/*.mp4` 與 `manifest.json` 已被 `.gitignore` 排除，**絕對不要將影片檔提交至 git 或部署出去**。
2. **`/decks` 與 `/decks/$deckId` (攻略站)**：
   - Pokémon TCG Pocket 牌組攻略。包含 Limitless 賽事數據排行榜（Wilson score）＋人工策展繁中攻略。

---

## 3. 資料層管線與硬性禁忌

`/decks` 的資料由人工策展與自動化腳本匯合：

| 檔案 | 性質 | 維護方式 |
| --- | --- | --- |
| `src/data/decks.ts` | 人工策展牌組（繁中攻略、對戰思路、Tier S–C） | 手寫 |
| `src/data/meta.json` | Limitless Top 20 即時排行（勝率、使用率、代表牌表） | `scripts/update-meta.mjs` 生成 |
| `src/data/limitless-map.json` | 策展 id ↔ Limitless 英文牌組名映射表 | 手寫 |
| `src/data/cards.json` | 完整卡片索引（3520張，約 580 KB） | `scripts/fetch-cards.mjs` 生成（僅供腳本查表） |
| `src/data/cards.used.json` | 本站引用卡片子集（約 100張，~19 KB） | `scripts/subset-cards.mjs` 生成（前端使用） |

### ⛔ 硬性禁忌與規則：
1. **前端嚴禁 `import cards.json`**：完整卡片檔過大（580KB），會膨脹 client bundle。前端一律經由 `getCard()` 讀取 `cards.used.json`。
2. **嚴禁手動修改生成檔**：`cards.json`、`cards.used.json`、`meta.json`、`routeTree.gen.ts`。
3. **改動資料後的更新流程**：
   - 修改 `meta.json` 或 `decks.ts` 後，必須執行 `node scripts/subset-cards.mjs` 更新子集。
   - `npm run build` 時會透過 `prebuild` 自動觸發 `subset-cards.mjs`。
4. **`meta.json` 更新注意事項**：
   - `update-meta.mjs` 會以現有的 `meta.json` 作為排名變化（`previousRank`）比較基準，**切勿連續執行兩次**（否則會將名次變更洗成持平且不可逆）。
5. **卡片 ID 慣例**：格式為 `{SET}-{number}`（如 `B3b-41`、`PROMO-A-7`），**不補零**。

---

## 4. 開發、指令與測試

### 常用指令：
```bash
npm run dev        # 開發伺服器（port 8080）
npm run build      # 正式建置（nitro，預設 target 為 cloudflare）
npm run lint       # eslint 檢查
npm run format     # prettier 格式化
```

### 伺服器啟動與測試規範：
- **Dev Server 啟動方式**：跑 dev server 請優先使用 preview / dev 工具（`piplup-dev`），避免產生殘留背景進程。
- **無自動化測試框架**：專案未安裝 Jest/Vitest。驗證必須透過瀏覽器實測、檢查 console/network 紀錄，並回報結果。**請勿擅自安裝測試框架**。
- **對比度標準**：`/decks` 版面必須保持 0 處 accessibility 對比失敗。調整顏色時必須實測渲染後的色彩數值。

---

## 5. 專案慣例與架構注意事項

- **路由機制**：採用 TanStack Start 檔案式路由。全站唯一的 App Shell 為 `src/routes/__root.tsx`。**請勿建立** `src/pages/` 或 `app/layout.tsx`。
- **建置設定 (`vite.config.ts`)**：已使用 `@lovable.dev/vite-tanstack-config`，內部已整合 React、TanStack Start、Tailwind 等 plugin。**切勿重複手動添加相同 plugin**。
- **錯誤處理 (SSR)**：`src/server.ts` 及 `src/start.ts` 包裹了 SSR 錯誤擷取管線，修改 SSR 進入點時務必保留 `error-capture` 與 `lovable-error-reporting` 邏輯。
- **語言分工**：
  - UI 介面與攻略內文使用**繁體中文**。
  - 牌組名與卡名保留 Limitless 英文原文（策展牌組譯名為繁中）。
  - 程式碼識別字與變數名稱一律使用英文。
- **攻略頁配色**：採用專屬水系淡藍色系（`#2a6f97` 深藍字、`#5fa8d3` 邊框、`#bfe3f5` 淺藍、`#eef7fc` 背景），非 `styles.css` 的 Tailwind theme token。

---

## 6. Git 與平台整合 (Lovable)

- 專案已與 [Lovable](https://lovable.dev) 整合。
- **嚴禁重寫 Git 歷史**：禁止使用 `force push`、`rebase`、`commit amend` 或 `squash` 已推送的 commit，否則會破壞 Lovable 端歷史記錄。
- 始終維持分支在可建置與運作狀態。
