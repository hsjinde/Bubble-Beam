#!/usr/bin/env node
/**
 * 產生自架的中文／拉丁字型子集，取代從 Google Fonts 載入整套 Noto Sans TC。
 *
 * 為什麼要這個：Google Fonts 的漢字分塊是照「全語料使用頻率」切的，一篇正常長度的
 * 中文內容就會散落在二十幾個 unicode-range 區段裡，等於幾乎整套都得載。
 * /decks 實測（Resource Timing 的 decodedBodySize）：Noto Sans TC 23 個分塊 1463 KB，
 * 而該頁只用到 383 個相異漢字。unicode-range 不會自動幫忙省，自架子集才會。
 *
 * 收集方式刻意「寧可多收」，而且**不是**抄 subset-cards.mjs 的字串字面值正則：
 * 那支的 regex 上限 64 字、不吃反斜線、不吃樣板字串，decks.ts 的長篇攻略會被整段漏掉。
 * 這裡改成讀原始 UTF-8 全文、逐 codepoint 收。原始碼除了內容本身都是 ASCII，
 * 所以「全文收」比「解析字面值」更安全，也不是用正則猜結構。
 *
 * 產出（都要進版控）：
 *   public/fonts/noto-sans-tc-subset.woff2
 *   public/fonts/plus-jakarta-sans-subset.woff2
 *   public/fonts/OFL-Noto-Sans-TC.txt / OFL-Plus-Jakarta-Sans.txt
 *   scripts/fonts.manifest.json   ← 字元集本身＋來源／產出的 SHA-256
 *
 * 用法：
 *   node scripts/subset-fonts.mjs            # 需要時重建（字元集沒變就是 no-op）
 *   node scripts/subset-fonts.mjs --check    # 只檢查是否過期，不寫檔（CI 用）
 *   node scripts/subset-fonts.mjs --force    # 忽略 no-op 判斷，強制重建
 *
 * 已掛在 package.json 的 prebuild。字元集沒變時完全不碰網路、不碰原始字型檔，
 * 所以 CI 上的正式建置不需要下載那兩支幾 MB 的來源 TTF。
 *
 * 漏字不會變成豆腐框：styles.css 的 font stack 在子集之後接了系統 CJK 字型，
 * 缺字會逐字退到系統字型。所以字元集過期時這支腳本只警告、不中斷建置。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import fontverter from "fontverter";
import subsetFont from "subset-font";
import { readAxes, readCmap } from "./lib/sfnt.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(ROOT, "src");
const OUT_DIR = join(ROOT, "public", "fonts");
const CACHE_DIR = join(ROOT, ".cache", "fonts");
const MANIFEST = join(ROOT, "scripts", "fonts.manifest.json");

/*
 * 來源是 google/fonts 的原始可變字型 TTF，經 jsDelivr 取得
 * （raw.githubusercontent.com 在本機網路環境不可解析，jsDelivr 可以）。
 *
 * 釘在 @main 而不是某個 commit：google/fonts 沒有版本 tag，jsDelivr 的
 * resolved API 對 gh 套件回 version=null，拿不到可釘的 SHA。改用「把來源檔的
 * SHA-256 寫進 manifest」讓上游改版看得見——manifest 的 sourceSha256 變了，
 * 就是上游更新了字型，diff 會直接顯示出來。
 *
 * 授權：兩者都是 OFL。
 *   Noto Sans TC 的 OFL 保留字是 'Source'（它衍生自 Source Han Sans），
 *   "Noto Sans TC" 本身不是保留名；Plus Jakarta Sans 沒有宣告任何保留字。
 * 所以散布「子集後的修改版」並沿用原字體名是允許的。授權全文一併放進 public/fonts/。
 */
const GH = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl";

const FONTS = [
  {
    key: "noto-sans-tc",
    family: "Noto Sans TC",
    sourceUrl: `${GH}/notosanstc/NotoSansTC%5Bwght%5D.ttf`,
    licenseUrl: `${GH}/notosanstc/OFL.txt`,
    out: "noto-sans-tc-subset.woff2",
    license: "OFL-Noto-Sans-TC.txt",
  },
  {
    key: "plus-jakarta-sans",
    family: "Plus Jakarta Sans",
    sourceUrl: `${GH}/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf`,
    licenseUrl: `${GH}/plusjakartasans/OFL.txt`,
    out: "plus-jakarta-sans-subset.woff2",
    license: "OFL-Plus-Jakarta-Sans.txt",
  },
];

/*
 * 兩支字型都收同一份字元集。harfbuzz 只會保留字型本身有的字，
 * 所以拉丁字型不會因為請求漢字而變大，反過來 Noto Sans TC 會多含一份 ASCII——
 * 那是刻意的保險：拉丁字型載入失敗時混排不會整段掉到系統字型。
 */

/** 掃描哪些副檔名。.md 是文件不會上線，不收。 */
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".json", ".css"]);

/** 完整卡片索引 3520 筆但前端不引用（見 CLAUDE.md），收了只是拖慢掃描。 */
const SKIP_FILES = new Set([join(SRC_DIR, "data", "cards.json")]);

/** src/ 以外還要掃的檔案（會出現在畫面或 PWA 安裝介面上的文字）。 */
const EXTRA_FILES = [join(ROOT, "public", "site.webmanifest")];

/**
 * 一律收進來的區段。掃描抓得到的是「原始碼裡寫死的字」，
 * 這裡補的是排版與符號類——寧可多收幾百個字，也不要哪天加一個「※」就缺字。
 */
const ALWAYS_RANGES = [
  [0x20, 0x7e], // 可見 ASCII
  [0xa0, 0xff], // Latin-1 補充：° · × ÷ © ® µ é 之類
  [0x2010, 0x2027], // 一般標點：– — ' ' " " † ‡ • …
  [0x3000, 0x303f], // CJK 標點：、。〈〉《》「」『』【】〔〕・〜
  [0xff01, 0xff5e], // 全形 ASCII
  [0xffe0, 0xffe6], // 全形貨幣與符號：￥ ￡ ￠ ￣
];

/** 上面區段沒涵蓋、但排版常用的零散符號。 */
const ALWAYS_CHARS = "‰′″※←↑→↓↔⇒∈∞≈≠≤≥±×÷√°℃№☆★○●◎◆◇□■△▲▽▼♠♥♦♣✓✔✕✖①②③④⑤⑥⑦⑧⑨⑩";

/**
 * 執行時才組出來、原始碼裡不存在的字。
 *
 * 目前實際掃過的結果是：日期是 `${年}/${月}/${日}` 純數字，天數字樣
 * （「還有 N 天」「今天結束」）都寫在 .tsx 的樣板字串裡，掃描收得到；
 * `toLocaleString()` 只用在數字千分位。也就是說這一段現在是純保險。
 *
 * 但這類文字一旦改成 `Intl.DateTimeFormat('zh-TW')` 就會憑空冒出「年」「月」
 * 「星期」「上午」，而那是掃不到的——所以這個區塊要留著，成本只有幾十個字。
 */
const RUNTIME_TEXT =
  "年月日時分秒週星期上午下午今天明天昨天前後剩還有共第場次個更新於已結束開始進行中即將發售小時分鐘" +
  "零一二三四五六七八九十百千萬億正負點約比至和與或";

/** 遞迴列出目錄下所有要掃描的檔案。 */
function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry)) && !SKIP_FILES.has(full)) {
      out.push(full);
    }
  }
  return out;
}

/** 把字串裡每個 codepoint 加進集合（用 for...of 才會正確處理代理對）。 */
function addCodepoints(set, text) {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x20) set.add(cp);
  }
}

/** 掃描原始碼，回傳排序過的字元集字串（排序是為了讓輸出的二進位檔穩定）。 */
function buildCharset() {
  const set = new Set();

  for (const [lo, hi] of ALWAYS_RANGES) {
    for (let cp = lo; cp <= hi; cp++) set.add(cp);
  }
  addCodepoints(set, ALWAYS_CHARS);
  addCodepoints(set, RUNTIME_TEXT);

  const files = [...collectFiles(SRC_DIR), ...EXTRA_FILES.filter((f) => existsSync(f))];
  for (const file of files) {
    addCodepoints(set, readFileSync(file, "utf8"));
  }

  const sorted = [...set].sort((a, b) => a - b);
  return {
    charset: sorted.map((cp) => String.fromCodePoint(cp)).join(""),
    codepoints: sorted,
    scanned: files.length,
  };
}

const isCJK = (cp) =>
  (cp >= 0x3400 && cp <= 0x4dbf) || // 擴充 A
  (cp >= 0x4e00 && cp <= 0x9fff) || // 基本區
  (cp >= 0xf900 && cp <= 0xfaff) || // 相容漢字
  (cp >= 0x20000 && cp <= 0x2ebef); // 擴充 B–F

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** 下載並快取來源字型／授權檔。快取目錄有進 .gitignore，不隨版控。 */
async function fetchCached(url, name) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cached = join(CACHE_DIR, name);
  if (existsSync(cached)) return readFileSync(cached);

  process.stdout.write(`  下載 ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下載失敗 ${res.status} ${res.statusText}：${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(cached, buf);
  return buf;
}

async function buildFont(font, charset) {
  const source = await fetchCached(font.sourceUrl, `${font.key}.ttf`);
  const licenseText = await fetchCached(font.licenseUrl, `${font.key}-OFL.txt`);

  // 先產 SFNT 才能讀 fvar 驗軸，再交給 fontverter 壓成 woff2。
  //
  // wght 收斂到 400..700：站上只用到這個範圍，砍掉 100..399 與 701..900 的
  // delta 可以省不少位元組，同時 font-medium(500)／font-semibold(600) 仍由軸插值。
  //
  // 量過但**刻意不採用**的兩個選項，別再重試一次：
  //   - `variationAxes: { wght: 400 }`（釘死字重）：611 KB → 339 KB，省 272 KB，
  //     但 500／600 會退成合成或最近字重，推翻 114c2b2 的視覺決定。不能用。
  //   - `noLayoutClosure: true`：611 KB → 538 KB，只省 12%，代價是 GSUB lookup
  //     可能指向被丟掉的字圖，而本專案沒有能抓到這種破圖的測試。不值得。
  const sfnt = await subsetFont(source, charset, {
    targetFormat: "sfnt",
    variationAxes: { wght: { min: 400, max: 700, default: 400 } },
  });
  const axes = readAxes(sfnt);
  const wght = axes.find((a) => a.tag === "wght");
  if (!wght || wght.min !== 400 || wght.max !== 700) {
    throw new Error(
      `${font.family} 的 wght 可變軸沒有保留成 400..700（實際：${JSON.stringify(axes)}）。` +
        `軸被實例化掉的話，font-medium/font-semibold 會靜靜地退成一般字重。`,
    );
  }

  const woff2 = await fontverter.convert(sfnt, "woff2", "sfnt");
  return { source, licenseText, woff2, axes, covered: readCmap(sfnt) };
}

async function main() {
  const force = process.argv.includes("--force");
  const check = process.argv.includes("--check");

  const { charset, codepoints, scanned } = buildCharset();
  const charsetHash = sha256(charset);
  const cjkCount = codepoints.filter(isCJK).length;

  const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : null;
  const outputsExist = FONTS.every((f) => existsSync(join(OUT_DIR, f.out)));
  const upToDate = previous?.charsetHash === charsetHash && outputsExist;

  const summary = `${codepoints.length} 個字元（其中漢字 ${cjkCount}），掃描 ${scanned} 個檔案`;

  if (check) {
    if (!upToDate) {
      console.error(`字型子集已過期（${summary}），請跑 node scripts/subset-fonts.mjs`);
      process.exit(1);
    }
    console.log(`字型子集是最新的：${summary}`);
    return;
  }

  if (upToDate && !force) {
    console.log(`字型子集是最新的，略過重建：${summary}`);
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {
    "//": "scripts/subset-fonts.mjs 生成，不要手改。charset 是排序過的完整字元集，改動會反映在 diff 上。",
    charsetHash,
    charCount: codepoints.length,
    cjkCount,
    scannedFiles: scanned,
    fonts: [],
    unsupported: "",
    charset,
  };

  const coveredByAny = new Set();
  for (const font of FONTS) {
    console.log(`子集化 ${font.family}…`);
    const { source, licenseText, woff2, axes, covered } = await buildFont(font, charset);
    for (const cp of covered) coveredByAny.add(cp);

    writeFileSync(join(OUT_DIR, font.out), woff2);
    writeFileSync(join(OUT_DIR, font.license), licenseText);

    manifest.fonts.push({
      family: font.family,
      sourceUrl: font.sourceUrl,
      sourceBytes: source.length,
      sourceSha256: sha256(source),
      out: `public/fonts/${font.out}`,
      outBytes: woff2.length,
      outSha256: sha256(woff2),
      glyphCodepoints: covered.size,
      variationAxes: axes,
    });

    const pct = ((1 - woff2.length / source.length) * 100).toFixed(1);
    console.log(
      `  ${(source.length / 1024).toFixed(1)} KB TTF → ${(woff2.length / 1024).toFixed(1)} KB woff2（−${pct}%）` +
        `，軸 ${axes.map((a) => `${a.tag} ${a.min}..${a.max}`).join(", ")}`,
    );
  }

  /*
   * 有些字是「我們要了，但兩支來源字型本來就沒有」——例如日文新字體漢字
   * （楽 図 変 対 収 単 区 …）。Noto Sans TC 的 cmap 只有 20,745 個 codepoint，
   * 不含這些日本專用字形；/pokopia/videos 的日文影片標題就會用到。
   *
   * 這**不是**子集造成的漏字：改用自架子集之前，走 Google Fonts 的 Noto Sans TC
   * 一樣沒有這些字圖，一樣是逐字退到系統日文／中文字型。記在這裡是為了讓
   * check-font-coverage.mjs 能把「上游本來就沒有」跟「掃描漏收」分開，
   * 不要每次都誤報成迴歸。
   */
  manifest.unsupported = codepoints
    .filter((cp) => !coveredByAny.has(cp))
    .map((cp) => String.fromCodePoint(cp))
    .join("");

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`完成：${summary}`);
  if (manifest.unsupported.length > 0) {
    console.log(
      `  來源字型沒有字圖、只能退到系統字型的有 ${[...manifest.unsupported].length} 個：` +
        manifest.unsupported,
    );
  }
  for (const f of manifest.fonts) {
    console.log(`  ${relative(ROOT, join(ROOT, f.out))}  ${(f.outBytes / 1024).toFixed(1)} KB`);
  }
}

main().catch((err) => {
  // 子集過期時漏的字會逐字退到系統 CJK 字型（見檔頭），不是豆腐框，
  // 所以這裡不讓建置整個掛掉——但要吵得夠大聲，不能靜靜地帶著舊子集出貨。
  console.error(`\n字型子集化失敗：${err.message}`);
  console.error("沿用已存在的子集繼續建置。缺字會退到系統 CJK 字型，不會出現豆腐框。");
  const missing = FONTS.filter((f) => !existsSync(join(OUT_DIR, f.out)));
  if (missing.length > 0) {
    console.error(`但 ${missing.map((f) => f.out).join("、")} 根本不存在，建置無法繼續。`);
    process.exit(1);
  }
});
