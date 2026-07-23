import type { CardEntry } from "./types";
// 刻意 import 子集而非完整的 cards.json：完整索引 3520 張／約 580 KB 會整包進
// client bundle，但全站只用到約 100 張。子集由 scripts/subset-cards.mjs 生成，
// 已掛在 prebuild，正式建置一定是最新的。改 meta.json 或 decks.ts 之後要重跑。
// `with { type: "json" }`：Vite 不需要，但沒有它的話 Node 的 ESM loader 會拒絕載入
// 這個模組。scripts/generate-sitemap.mjs 走 type stripping 直接 import src/ 下的模組，
// 少了這個屬性會讓 prebuild 掛掉——而 prebuild 掛掉等於每一次部署都失敗。
import rawIndex from "./cards.used.json" with { type: "json" };

const index = rawIndex as Record<string, CardEntry>;

/**
 * 查不到會回 undefined，呼叫端（CardImage）必須保留退成文字 placeholder 的處理：
 * 排行榜牌表來自上游 Limitless，隨時可能出現本地索引還沒有的新卡。
 */
export function getCard(id: string): CardEntry | undefined {
  return index[id];
}
