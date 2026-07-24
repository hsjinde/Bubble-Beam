import type { DeckCard as DeckCardEntry } from "@/data/types";
import { getCard } from "@/data/cards";
import { CardImage } from "./CardImage";

export function Decklist({ cards }: { cards: DeckCardEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {cards.map((c) => {
        const entry = getCard(c.id);
        return (
          <figure key={c.id} className="relative">
            <CardImage cardId={c.id} />
            <span className="absolute -right-1 -top-1 rounded-full bg-guide-ink px-2 py-0.5 text-xs font-bold text-guide-on-ink shadow">
              ×{c.count}
            </span>
            <figcaption className="mt-1 truncate text-center text-xs text-guide-ink-muted">
              {entry ? (entry.nameTC ?? entry.nameEN) : c.id}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
