<!-- Shared Agent Rules -->

# Workspace: Bubble-Beam

- Claude Code & Antigravity CLI Unified Context

## 開工前先讀

`docs/handoff.md` — 目前的前端品質狀態、待辦、部署驗證方式。每輪工作結束時更新它。

## 硬性規則

- **前端不要 `import cards.json`**（3520 張、約 580 KB，會整包進 client bundle）。
  查卡一律走 `getCard()`，它讀的是 `scripts/subset-cards.mjs` 生成的 `cards.used.json`。
  改完 `meta.json` 或 `decks.ts` 要重跑該腳本，或直接 `npm run build`（已掛 prebuild）。
- **`/decks` 目前 0 處對比失敗，這是底線。** 改顏色後要實測算繪色再算對比，
  不能只看 CSS 原始值（`oklch()`、透明度疊加、Tailwind 色階都要算繪後才準）。
- 動手前 `git fetch`，確認對方沒有正在進行的改動。
