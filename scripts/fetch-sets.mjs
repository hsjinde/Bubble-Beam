// One-shot: fetch expansion metadata (code, release date, card count, packs) and
// write a local index for the /decks/schedule timeline.
//
// Data source: flibustier/pokemon-tcg-pocket-database — the same upstream the
// card index comes from (see fetch-cards.mjs).
//
// Caveats this script deliberately does NOT paper over:
//   - Upstream carries a Traditional Chinese set name for only a couple of the
//     earliest sets; the rest have `en` only. `nameTC` is written when upstream
//     has it and left out otherwise — src/data/events.json is where hand-written
//     Chinese names go, so generated and hand-maintained data stay separable.
//   - Upstream lags on unreleased sets. Anything not yet listed there belongs in
//     events.json as an upcoming entry, not here.
//
// Usage:
//   node scripts/fetch-sets.mjs
import { writeFile } from "node:fs/promises";

const SRC =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/sets.json";
const OUT = new URL("../src/data/sets.json", import.meta.url);

const res = await fetch(SRC);
if (!res.ok) throw new Error(`fetch sets failed: ${res.status}`);
const raw = await res.json();

// 上游用系列（"A"／"B"）分組，攤平成單一時間序列
const sets = [];
for (const [series, entries] of Object.entries(raw)) {
  for (const s of entries) {
    if (!s.releaseDate) continue;
    sets.push({
      code: s.code,
      series,
      releaseDate: s.releaseDate,
      // promo 系列沒有卡數，寫 0 不如省略，前端才能分辨「沒有資料」與「真的是 0」
      ...(typeof s.count === "number" ? { count: s.count } : {}),
      nameEN: s.name?.en ?? s.code,
      ...(s.name?.zh ? { nameTC: s.name.zh } : {}),
      packs: s.packs ?? [],
    });
  }
}
sets.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || a.code.localeCompare(b.code));

await writeFile(OUT, JSON.stringify(sets, null, 2));
console.log(
  `wrote sets.json: ${sets.length} sets (${sets.filter((s) => s.nameTC).length} with upstream 繁中名), ` +
    `${sets[0].releaseDate} → ${sets[sets.length - 1].releaseDate}`,
);
