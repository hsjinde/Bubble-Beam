#!/usr/bin/env node
/**
 * 驗證自架字型子集沒有漏字：把全站每一頁「實際會渲染的字」跟子集字型 cmap
 * **真的含有的字圖**對照，差集必須是空的。
 *
 * 為什麼不是比對 scripts/fonts.manifest.json 的 charset 就好：那是「請求」的字元集，
 * 字型本身沒有的字（例如 emoji）harfbuzz 會靜靜丟掉。要證明沒有漏字，
 * 得讀產出檔的 cmap，不是讀我們要求了什麼。
 *
 * 頁面清單取自 public/sitemap.xml，逐頁抓 SSR HTML 取可見文字——
 * 不需要瀏覽器，但需要一個跑著的伺服器。
 *
 * SSR HTML 抓不到「hydration 之後才組出來」的文字（/decks/schedule 的活動清單就是
 * 這樣：SSR 當下 now 還沒定案，事件列表是 client 才渲染的）。要把那部分也納入，
 * 在瀏覽器 console 收集實際 DOM 的文字存成檔，用 --extra 餵進來。
 *
 * 用法：
 *   npm run dev                                   # 另一個終端
 *   node scripts/check-font-coverage.mjs                       # 預設 http://localhost:8080
 *   node scripts/check-font-coverage.mjs http://localhost:8081
 *   node scripts/check-font-coverage.mjs http://localhost:8081 --extra live.txt
 *
 * 沒掛進 prebuild：它要連伺服器，不適合擋建置。資料更新（meta.json／decks.ts／
 * pokopia）之後跑一次就好。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import fontverter from "fontverter";
import { readCmap } from "./lib/sfnt.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:8080";
const EXTRA = args[args.indexOf("--extra") + 1];
const MANIFEST = join(ROOT, "scripts", "fonts.manifest.json");
const FONTS = [
  join(ROOT, "public", "fonts", "noto-sans-tc-subset.woff2"),
  join(ROOT, "public", "fonts", "plus-jakarta-sans-subset.woff2"),
];

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** 從 SSR HTML 取可見文字。script／style 整段拿掉（裡面有序列化的 router 資料）。 */
function visibleText(html) {
  const body = html.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ");
  const attrs = [...body.matchAll(/\s(?:alt|title|placeholder|aria-label)="([^"]*)"/gi)].map(
    (m) => m[1],
  );
  const text = body.replace(/<[^>]*>/g, " ") + " " + attrs.join(" ");
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, ref) => {
    if (ref[0] === "#") {
      const cp = ref[1] === "x" || ref[1] === "X" ? parseInt(ref.slice(2), 16) : +ref.slice(1);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : whole;
    }
    return ENTITIES[ref.toLowerCase()] ?? whole;
  });
}

const isCJK = (cp) =>
  (cp >= 0x2e80 && cp <= 0x2fff) || // 部首
  (cp >= 0x3000 && cp <= 0x30ff) || // CJK 標點、平假名、片假名
  (cp >= 0x3400 && cp <= 0x4dbf) ||
  (cp >= 0x4e00 && cp <= 0x9fff) ||
  (cp >= 0xf900 && cp <= 0xfaff) ||
  (cp >= 0xff00 && cp <= 0xffef); // 全形

async function main() {
  const smXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const paths = [...smXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (paths.length === 0) throw new Error(`${BASE}/sitemap.xml 沒有任何 <loc>`);

  const rendered = new Map(); // codepoint -> 第一個用到它的頁面
  for (const path of paths) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${path} 回 ${res.status}`);
    for (const ch of visibleText(await res.text())) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x20 && !rendered.has(cp)) rendered.set(cp, path);
    }
  }

  if (EXTRA && args.includes("--extra")) {
    for (const ch of readFileSync(EXTRA, "utf8")) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x20 && !rendered.has(cp)) rendered.set(cp, `${EXTRA}（瀏覽器實測）`);
    }
  }

  const covered = new Set();
  for (const file of FONTS) {
    const sfnt = await fontverter.convert(readFileSync(file), "sfnt", "woff2");
    for (const cp of readCmap(sfnt)) covered.add(cp);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const requested = new Set([...manifest.charset].map((c) => c.codePointAt(0)));

  const missing = [...rendered.keys()].filter((cp) => !covered.has(cp)).sort((a, b) => a - b);

  /*
   * 差集要分成兩種，混在一起看的話真問題會被雜訊蓋掉：
   *
   *   A. 有請求、但來源字型根本沒這個字圖 —— 例如日文新字體漢字（楽 図 変 対）。
   *      Noto Sans TC 的 cmap 只有 20,745 個 codepoint，不含日本專用字形。
   *      改自架子集**之前**走 Google Fonts 也是一樣的結果，不是迴歸，無從修。
   *   B. 連請求都沒請求到 —— 表示 subset-fonts.mjs 的掃描漏掉了這個字
   *      （最可能的來源：執行時才組出來、原始碼裡不存在的文字）。
   *      這是真漏字，要把字補進 subset-fonts.mjs 的 RUNTIME_TEXT 再重跑。
   */
  const unscanned = missing.filter((cp) => !requested.has(cp));
  const unsupported = missing.filter((cp) => requested.has(cp));

  console.log(`掃描 ${paths.length} 個頁面，渲染出 ${rendered.size} 個相異字元`);
  console.log(`子集字型 cmap 涵蓋 ${covered.size} 個 codepoint`);

  if (unsupported.length > 0) {
    console.log(
      `\n來源字型本來就沒有字圖、退到系統字型的有 ${unsupported.length} 個（非迴歸，無從修）：`,
    );
    for (const cp of unsupported) {
      console.log(
        `  U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${String.fromCodePoint(cp)}` +
          `  ${isCJK(cp) ? "" : "（非 CJK，多半是 emoji）"}← ${rendered.get(cp)}`,
      );
    }
  }

  if (unscanned.length > 0) {
    console.error(`\n真漏字 ${unscanned.length} 個 —— 子集根本沒收到這些字：`);
    for (const cp of unscanned) {
      console.error(
        `  U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${String.fromCodePoint(cp)}  ← ${rendered.get(cp)}`,
      );
    }
    console.error("\n把它們補進 scripts/subset-fonts.mjs 的 RUNTIME_TEXT，再重跑一次。");
    process.exit(1);
  }

  console.log("\n掃描漏收的字：0");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
