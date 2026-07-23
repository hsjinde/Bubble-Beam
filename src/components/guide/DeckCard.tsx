import { Link } from "@tanstack/react-router";
import type { Deck } from "@/data/types";
import { getHeroCardId } from "@/data/hero-card";
import { CardImage } from "./CardImage";
import { EnergyIcon } from "./EnergyIcon";
import { TierBadge } from "./TierBadge";

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Link
      to="/decks/$deckId"
      params={{ deckId: deck.id }}
      className="block rounded-xl border border-guide-tint bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0">
          {/* 門面卡而非 cards[0]——牌表照進化線排，第一張常是進化前的小卡 */}
          <CardImage cardId={getHeroCardId(deck)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TierBadge tier={deck.tier} />
            <h3 className="truncate text-lg font-bold text-guide-ink">{deck.name}</h3>
          </div>
          <div className="mt-1 flex gap-1">
            {deck.energy.map((e) => (
              <EnergyIcon key={e} type={e} />
            ))}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{deck.summary}</p>
        </div>
      </div>
    </Link>
  );
}
