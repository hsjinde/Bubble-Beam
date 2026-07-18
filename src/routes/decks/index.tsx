import { createFileRoute } from "@tanstack/react-router";
import { listDecks } from "@/data/decks";
import type { Deck, Tier } from "@/data/types";
import { DeckCard } from "@/components/guide/DeckCard";
import { GuideLayout } from "@/components/guide/GuideLayout";

export const Route = createFileRoute("/decks/")({
  head: () => ({
    meta: [
      { title: "牌組攻略 — Piplup! TCG Pocket" },
      { name: "description", content: "Pokémon TCG Pocket 熱門牌組整理與繁中攻略。" },
    ],
  }),
  component: DecksPage,
});

const TIERS: Tier[] = ["S", "A", "B", "C"];

function DecksPage() {
  const decks = listDecks();
  const byTier = new Map<Tier, Deck[]>();
  for (const d of decks) byTier.set(d.tier, [...(byTier.get(d.tier) ?? []), d]);

  return (
    <GuideLayout>
      <h1 className="text-3xl font-bold text-[#2a6f97]">TCG Pocket 牌組攻略</h1>
      <p className="mt-2 text-slate-600">
        人工整理的當前熱門牌組。點進牌組看完整牌表與打法。
      </p>
      {TIERS.filter((t) => byTier.has(t)).map((tier) => (
        <section key={tier} className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-[#2a6f97]">Tier {tier}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {byTier.get(tier)!.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      ))}
    </GuideLayout>
  );
}
