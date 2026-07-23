/**
 * 產生 public/sitemap.xml 與 public/robots.txt。
 *
 *   node --experimental-strip-types scripts/generate-sitemap.mjs
 *
 * 已掛在 package.json 的 prebuild，`npm run build` 會自動重跑，
 * 所以正式建置產物的 sitemap 一定涵蓋當下所有策展牌組。
 *
 * 牌組清單直接 import `src/data/decks.ts`（靠 Node 的 type stripping），
 * **不要改成用 regex 掃檔案**——prettier 重排格式就會讓 regex 漏抓，
 * 而漏抓的頁面只是安靜地不進 sitemap，很難察覺。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Windows 的絕對路徑（D:\...）不是合法的 ESM 指定符，一定要轉成 file:// URL
const load = (rel) => import(pathToFileURL(path.join(root, rel)).href);

const { listDecks } = await load("src/data/decks.ts");
const { SITE_URL } = await load("src/lib/site.ts");
// meta.json 直接讀檔而非走 meta.ts：後者的 `import raw from "./meta.json"` 少了
// `with { type: "json" }`，Vite 吃得下但 Node 的 ESM loader 會拒絕。這裡只要一個欄位，
// 不值得為了它去改 app 程式碼。
const meta = JSON.parse(readFileSync(path.join(root, "src/data/meta.json"), "utf8"));

/** XML 文字節點的跳脫。牌組 slug 目前都是 ASCII，但別假設以後也是。 */
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const decks = listDecks();

/**
 * lastmod 只給真的知道時間的頁面。/decks 用排行榜資料的抓取時間——那是這頁內容
 * 真正改變的時刻。其餘頁面沒有可靠的時間來源，就不寫；Google 對不準的 lastmod
 * 會直接忽略整個欄位，寫假的比不寫更糟。changefreq／priority 已被 Google 忽略，不寫。
 */
const urls = [
  { loc: "/" },
  { loc: "/decks", lastmod: meta.fetchedAt },
  { loc: "/decks/schedule" },
  ...decks.map((d) => ({ loc: `/decks/${d.id}` })),
  { loc: "/pokopia" },
  { loc: "/pokopia/videos" },
  { loc: "/pokopia/habitats" },
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ loc, lastmod }) =>
    [
      "  <url>",
      `    <loc>${esc(SITE_URL + loc)}</loc>`,
      lastmod ? `    <lastmod>${esc(lastmod)}</lastmod>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  ),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "# 由 scripts/generate-sitemap.mjs 產生，不要手改",
  "User-agent: *",
  "Allow: /",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

writeFileSync(path.join(root, "public/sitemap.xml"), xml, "utf8");
writeFileSync(path.join(root, "public/robots.txt"), robots, "utf8");

console.log(`sitemap.xml：${urls.length} 個網址（含 ${decks.length} 頁策展攻略）`);
console.log("robots.txt：已寫入");
