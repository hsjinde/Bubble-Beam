#!/usr/bin/env node
/**
 * 從完整卡片索引 cards.json 產生「只含本站實際引用」的子集 cards.used.json。
 *
 * 為什麼要這個：cards.json 有 3520 筆／約 580 KB，會被 cards.ts 靜態 import，
 * 整包進 client bundle（實測 562.7 KB，比整個 React + router 還大）。
 * 但全站只引用約 100 張卡，子集約 16 KB —— 省掉約 97% 的無用負載。
 *
 * 收集方式刻意「寧可多收」：掃過 src/ 下所有原始碼與 JSON 的字串字面值，
 * 凡是能對上 cards.json 的 key 就收進來。不靠 id 格式正則猜測，
 * 因為漏收會讓卡圖無聲退成文字 placeholder，很難察覺。
 *
 * 用法：
 *   node scripts/subset-cards.mjs            # 產生 src/data/cards.used.json
 *   node scripts/subset-cards.mjs --check    # 只檢查是否過期，不寫檔（CI 用）
 *
 * 已掛在 package.json 的 prebuild，正式建置會自動重跑。
 * 手動更新 meta.json 或 decks.ts 之後，記得也跑一次（見 CLAUDE.md 資料更新指令）。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(ROOT, "src");
const FULL_INDEX = join(ROOT, "src", "data", "cards.json");
const SUBSET_OUT = join(ROOT, "src", "data", "cards.used.json");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".json"]);
// 完整索引自己不用掃（掃了會把 3520 筆全收進來，子集就沒意義了）
const SKIP_FILES = new Set([FULL_INDEX, SUBSET_OUT]);

/** 遞迴列出 src/ 下所有要掃描的檔案。 */
function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry)) && !SKIP_FILES.has(full)) {
      out.push(full);
    }
  }
  return out;
}

/** 抓出檔案裡所有雙引號／單引號字串字面值的內容。 */
function extractStringLiterals(text) {
  const found = new Set();
  for (const m of text.matchAll(/"([^"\\\n]{1,64})"|'([^'\\\n]{1,64})'/g)) {
    found.add(m[1] ?? m[2]);
  }
  return found;
}

function main() {
  if (!existsSync(FULL_INDEX)) {
    console.error(`找不到完整索引 ${FULL_INDEX}，請先跑 node scripts/fetch-cards.mjs`);
    process.exit(1);
  }

  const fullIndex = JSON.parse(readFileSync(FULL_INDEX, "utf8"));
  const knownIds = new Set(Object.keys(fullIndex));

  const referenced = new Set();
  let scanned = 0;
  for (const file of collectFiles(SRC_DIR)) {
    scanned++;
    for (const literal of extractStringLiterals(readFileSync(file, "utf8"))) {
      if (knownIds.has(literal)) referenced.add(literal);
    }
  }

  // 依原索引順序輸出，讓 diff 穩定
  const subset = {};
  for (const id of Object.keys(fullIndex)) {
    if (referenced.has(id)) subset[id] = fullIndex[id];
  }

  const json = JSON.stringify(subset, null, 2) + "\n";
  const fullKB = (Buffer.byteLength(readFileSync(FULL_INDEX)) / 1024).toFixed(1);
  const subsetKB = (Buffer.byteLength(json) / 1024).toFixed(1);

  if (process.argv.includes("--check")) {
    const current = existsSync(SUBSET_OUT) ? readFileSync(SUBSET_OUT, "utf8") : "";
    if (current !== json) {
      console.error("cards.used.json 已過期，請跑 node scripts/subset-cards.mjs");
      process.exit(1);
    }
    console.log(`cards.used.json 是最新的（${referenced.size} 張）`);
    return;
  }

  writeFileSync(SUBSET_OUT, json);
  console.log(
    `掃描 ${scanned} 個檔案：${knownIds.size} 張索引 → 引用 ${referenced.size} 張` +
      `（${fullKB} KB → ${subsetKB} KB）`,
  );
}

main();
