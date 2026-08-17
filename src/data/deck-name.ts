// `with { type: "json" }`：理由同 cards.ts——Vite 不需要，但 scripts/generate-sitemap.mjs
// 走 Node 的 type stripping 直接 import src/ 下的模組，少了它 prebuild 會掛。
import rawNames from "./pokemon-names.json" with { type: "json" };

const NAMES: Record<string, string> = rawNames.names;

/**
 * 比對用的 key 依「字數」由多到少排序，這樣 `Gouging Fire`／`Charizard Y`／
 * `Castform Sunny Form` 這種含空白的名字會先被整段比中，不會被拆成兩個字各翻各的。
 */
const MAX_WORDS = Math.max(...Object.keys(NAMES).map((k) => k.split(" ").length));

/** ex 之前要不要補空白：前一段結尾是 ASCII 字母（「噴火龍Y」的 Y）時補，中文字則緊貼。 */
function appendEx(segment: string): string {
  return /[A-Za-z0-9]$/.test(segment) ? `${segment} ex` : `${segment}ex`;
}

/**
 * 把 Limitless 的英文牌組名（`Hoopa ex Mega Absol ex`）翻成繁中（`胡帕ex Mega阿勃梭魯ex`）。
 *
 * 體例沿用 decks.ts 的策展名，不要改成別的：**Mega 保留原文**（官方繁中譯作「超級」，
 * 但本站 26 套策展牌組寫的都是 `Mega阿勃梭魯ex`，同一頁兩套寫法比不翻更糟）、
 * **ex 緊貼前一個名字**。
 *
 * **只要有一個字翻不出來就整串回傳 null**，呼叫端要退回顯示英文原名。這是刻意的：
 * 排行榜每次抓取都會換牌組，「胡帕ex Mega Sableye ex」這種中英混雜比純英文更難讀，
 * 而漏掉的那隻寶可夢該做的是補進 pokemon-names.json，不是在畫面上湊合。
 */
export function toDeckNameTC(name: string): string | null {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const segments: string[] = [];
  let pendingMega = false;
  let i = 0;

  while (i < words.length) {
    const word = words[i];

    if (word === "Mega") {
      // 連續兩個 Mega、或 Mega 出現在字串結尾，都不是我們認得的格式
      if (pendingMega) return null;
      pendingMega = true;
      i += 1;
      continue;
    }

    if (word === "ex") {
      // ex 沒有可以附著的名字（開頭就是 ex、或 `Mega ex`）代表格式不如預期
      if (pendingMega || segments.length === 0) return null;
      segments[segments.length - 1] = appendEx(segments[segments.length - 1]);
      i += 1;
      continue;
    }

    let matched: { tc: string; words: number } | null = null;
    for (let len = Math.min(MAX_WORDS, words.length - i); len >= 1; len -= 1) {
      const tc = NAMES[words.slice(i, i + len).join(" ")];
      if (tc) {
        matched = { tc, words: len };
        break;
      }
    }
    if (!matched) return null;

    segments.push(pendingMega ? `Mega${matched.tc}` : matched.tc);
    pendingMega = false;
    i += matched.words;
  }

  // 結尾還掛著沒消化的 Mega（`Hoopa ex Mega`）同樣視為不認得
  if (pendingMega) return null;

  return segments.join(" ");
}
