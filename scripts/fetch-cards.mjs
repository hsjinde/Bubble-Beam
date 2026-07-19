// One-shot: fetch full card pools for the sets our curated decks use,
// and write a local id-keyed index so the app never hits the API at runtime.
//
// Data source: flibustier/pokemon-tcg-pocket-database (TCGdex lags behind —
// missing B3/B3a/B3b/PROMO-B as of 2026-07; see docs/superpowers/plans/deck-research.md).
// Card ids follow `${set}-${number}` with no zero padding (e.g. "B3b-41", "PROMO-A-7").
import { writeFile } from "node:fs/promises";

const SETS = [
  "A1", "A1a", "A2", "A2a", "A2b", "A3", "A3a", "A3b", "A4", "A4a", "A4b",
  "B1", "B1a", "B2", "B2a", "B2b", "B3", "B3a", "B3b",
  "PROMO-A", "PROMO-B",
];
const DATA_BASE =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/flibustier/pokemon-tcg-exchange/main/public/images/cards-by-set";
const OUT = new URL("../src/data/cards.json", import.meta.url);

const index = {};
for (const set of SETS) {
  const res = await fetch(`${DATA_BASE}/${set}.json`);
  if (!res.ok) throw new Error(`fetch ${set} failed: ${res.status}`);
  const cards = await res.json();
  for (const card of cards) {
    const id = `${card.set}-${card.number}`;
    index[id] = {
      id,
      nameEN: card.name,
      imageUrl: `${IMAGE_BASE}/${card.set}/${card.number}.webp`,
    };
  }
  console.log(`${set}: ${cards.length} cards`);
}
await writeFile(OUT, JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(index).length} cards`);
