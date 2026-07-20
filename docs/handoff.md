# 接手筆記

給下一個接手的人（Claude Code 或 `agy`）。這份檔案記錄目前的 UI／前端品質狀態與待辦，
每輪工作結束時更新它，不要讓它過期。

最後更新：2026-07-21

---

## 目前狀態

`/decks` 在 2026-07-21 跑過一次 `$impeccable audit`，五個面向 13/20（Acceptable）。
P1 已全數修完並上線，估計 18/20。

| 面向          | 稽核當下 | 現在    | 備註                                          |
| ------------- | -------- | ------- | --------------------------------------------- |
| Accessibility | 2/4      | 4/4     | 程式量測 WCAG AA 全過；**未經螢幕閱讀器實測** |
| Performance   | 2/4      | 4/4     | 卡片索引子集化                                |
| Theming       | 2/4      | **2/4** | **唯一沒動的面向**，見待辦 A                  |
| Responsive    | 3/4      | 4/4     | 觸控目標補齊                                  |
| Anti-Patterns | 4/4      | 4/4     | 偵測器 0 命中，無 AI slop 特徵                |

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

### A. 收斂色彩語彙（優先）

Theming 是唯一還是 2/4 的面向。同一個 app 並存四套色彩語彙，沒有單一事實來源，
導致每次調對比都要逐檔搜十六進位：

1. 硬編十六進位（攻略頁全部）：`#2a6f97` `#5fa8d3` `#bfe3f5` `#eef7fc` `#f8fcff` `#f4fbff` `#1d5273`
2. oklch design token（僅 404／error 頁）：`bg-background`、`text-foreground`
3. Tailwind 內建色階（`TierBadge`）：`bg-amber-400`、`bg-sky-300`…
4. inline style 十六進位（`EnergyIcon`、`RankChangeBadge`）

要求：把水藍那組收斂成一組具名 token，**色值維持完全不變**（那是刻意的品牌選擇，見 CLAUDE.md）。
不要改用 `styles.css` 那套 Lovable 帶來的 oklch design system——攻略頁沒在用它。
另外 `styles.css` 有 34 個 `.dark` 變數但全站沒有任何地方會加 `.dark` class，確認是死碼就清掉。

建議指令：`$impeccable polish /decks`

### B. 首頁從沒被稽核過

首頁 `/` 和 `/decks` 是完全不同的 register——首頁是 brand（全螢幕、影片背景、塗鴉層、
跟隨滑鼠的波加曼），不是 product。稽核時要讀 `reference/brand.md` 而不是 `product.md`。

已知起點：`GuideEntry` 有兩處對比不足——說明文字 `#5f93b1` on white = 3.34:1、
箭頭 `#5fa8d3` = 2.62:1（都需要 4.5）。

`Piplup.tsx`、`Doodles.tsx`、`VideoBackdrop.tsx` 從沒被稽核過。
`VideoBackdrop` 有本地影片／YouTube／純色三段降級，別破壞那條路徑；
`public/videos/*.mp4` 絕對不要提交（版權，已在 `.gitignore`）。

建議指令：`$impeccable audit /`

### C. 補完無障礙驗證

WCAG AA 是用程式量測的，**沒有用真的螢幕閱讀器跑過流程**。要補：

1. NVDA 或 Windows 朗讀程式實走 `/decks`：表格欄位關聯（剛補 `scope="col"`）、
   展開時 `aria-expanded` 狀態播報、三個 badge 的 `aria-label` 是否念得合理
2. 純鍵盤操作一次，確認沒有 focus 陷阱、tab 順序合理

### D. 小修

- `https://bubble.19980803.xyz/favicon.ico` 回 404。`__root.tsx` 有 `<link rel="icon">`
  但 `public/` 下沒有這個檔。`public/piplup.png` 可當來源。順便補 apple-touch-icon 與 webmanifest。
- `npm run lint` 有 717 個錯誤，全是 prettier 的 `Delete ␍`。根因是 git `core.autocrlf=true`
  簽出成 CRLF 但 prettier 要 LF。要根治得加 `.gitattributes`（`* text=auto eol=lf`）＋
  `git add --renormalize .` ＋ `npm run format`。diff 會很大但應該純粹是行尾變化。
  **目前 lint 是沒有訊號的關卡——永遠紅燈。**

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
