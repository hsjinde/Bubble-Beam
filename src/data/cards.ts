import type { CardEntry } from "./types";
import rawIndex from "./cards.json";

const index = rawIndex as Record<string, CardEntry>;

export function getCard(id: string): CardEntry | undefined {
  return index[id];
}
