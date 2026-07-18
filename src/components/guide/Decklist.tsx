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
            <span className="absolute -right-1 -top-1 rounded-full bg-[#2a6f97] px-2 py-0.5 text-xs font-bold text-white shadow">
              ×{c.count}
            </span>
            <figcaption className="mt-1 truncate text-center text-xs text-slate-600">
              {entry ? (entry.nameTC ?? entry.nameEN) : c.id}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
