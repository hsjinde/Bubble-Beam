import { useState } from "react";
import { getCard } from "@/data/cards";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg border-2 border-guide-accent bg-gradient-to-br from-guide-tint to-guide-accent p-1 text-center text-xs font-semibold text-guide-ink">
      {label}
    </div>
  );
}

export function CardImage({ cardId, className = "" }: { cardId: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const card = getCard(cardId);
  if (!card) return <Placeholder label={cardId} />;
  if (failed) return <Placeholder label={card.nameTC ?? card.nameEN} />;
  return (
    <img
      src={card.imageUrl}
      alt={card.nameTC ?? card.nameEN}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`aspect-[63/88] w-full rounded-lg shadow ${className}`}
    />
  );
}
