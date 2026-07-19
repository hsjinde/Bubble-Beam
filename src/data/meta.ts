import type { MetaDeck } from "./types";
import raw from "./meta.json";

export interface MetaSnapshot {
  fetchedAt: string; // ISO timestamp
  source: string;
  decks: MetaDeck[];
}

export function getMeta(): MetaSnapshot {
  return raw as MetaSnapshot;
}
