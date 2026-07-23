import { useMemo, useState } from "react";
import {
  getPokemonHabitats,
  habitatImageUrl,
  habitats,
  pokemonList,
  pokemonSpriteUrl,
} from "@/data/pokopia/habitats";
import type { Habitat, HabitatPokemon } from "@/data/pokopia/types";

/**
 * 「我想要 XX 寶可夢 → 該蓋哪個棲息地」反查。
 *
 * 這是玩家最常搜的問題，但上游只提供「棲息地 → 出沒寶可夢」的方向，反查索引在
 * data/pokopia/habitats.ts 由資料推導。搜尋比對繁中名與英文 slug。
 */

function Sprite({ pokemon, size }: { pokemon: HabitatPokemon; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full bg-pokopia-tint text-[0.6rem] font-bold text-pokopia-ink"
        style={{ width: size, height: size }}
      >
        {pokemon.name.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={pokemonSpriteUrl(pokemon)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0"
    />
  );
}

function HabitatCard({ habitat }: { habitat: Habitat }) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="overflow-hidden rounded-xl border border-pokopia-tint bg-pokopia-bg-panel">
      {failed ? (
        <div
          aria-hidden="true"
          className="flex h-20 items-center justify-center bg-pokopia-tint text-sm font-bold text-pokopia-ink"
        >
          No.{String(habitat.no).padStart(3, "0")}
        </div>
      ) : (
        <img
          src={habitatImageUrl(habitat)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-20 w-full object-cover"
        />
      )}
      <div className="p-3">
        <p className="text-xs font-medium text-pokopia-ink-soft">
          No.{String(habitat.no).padStart(3, "0")}
        </p>
        <p className="font-semibold text-pokopia-ink">{habitat.name}</p>
        <ul className="mt-2 flex flex-wrap items-center gap-1.5">
          {habitat.pokemon.map((p) => (
            <li key={p.id} className="inline-flex items-center gap-1" title={p.name}>
              <Sprite pokemon={p} size={24} />
              <span className="text-xs text-pokopia-ink-soft">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function HabitatLookup({
  selectedPokemonId,
  onSelectPokemon,
}: {
  selectedPokemonId: string | null;
  onSelectPokemon: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pokemonList
      .filter(
        (e) => e.pokemon.name.toLowerCase().includes(q) || e.formIds.some((id) => id.includes(q)),
      )
      .slice(0, 24);
  }, [query]);

  const selected = selectedPokemonId ? getPokemonHabitats(selectedPokemonId) : undefined;

  return (
    <div>
      <div className="rounded-2xl border border-pokopia-tint bg-pokopia-bg-panel p-5 shadow-xs">
        <label htmlFor="habitat-search" className="block text-sm font-bold text-pokopia-ink">
          想招來哪隻寶可夢？
        </label>
        <input
          id="habitat-search"
          type="search"
          inputMode="search"
          placeholder="輸入寶可夢名稱，例如「皮卡丘」"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-pokopia-tint bg-white px-4 text-pokopia-ink transition-all placeholder:text-pokopia-ink-soft/70 focus:border-pokopia-accent focus:ring-2 focus:ring-pokopia-accent/30 focus:outline-none"
        />

        {query.trim() && (
          <div className="mt-3" aria-live="polite">
            {matches.length === 0 ? (
              <p className="text-sm text-pokopia-ink-soft">
                沒有找到會出沒的寶可夢——牠可能不是靠棲息地招來的。
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {matches.map((e) => {
                  // 網址帶的可能是任一形態 slug，比對整組而不是只比代表那個
                  const active =
                    selectedPokemonId !== null && e.formIds.includes(selectedPokemonId);
                  return (
                    <li key={e.pokemon.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelectPokemon(active ? null : e.pokemon.id)}
                        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
                          active
                            ? "border-pokopia-accent bg-pokopia-accent text-white"
                            : "border-pokopia-tint bg-white text-pokopia-ink hover:border-pokopia-accent"
                        }`}
                      >
                        <Sprite pokemon={e.pokemon} size={24} />
                        {e.pokemon.name}
                        {/* 實心白字，不用 /80：半透明疊在 accent 上只有 3.63:1，沒過 AA */}
                        <span className={active ? "text-white" : "text-pokopia-ink-soft"}>
                          {e.habitats.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {selected && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-pokopia-ink">
            {selected.pokemon.name} 會出沒的棲息地（{selected.habitats.length}）
          </h2>
          {selected.pokemon.category && (
            <p className="mt-1 text-sm text-pokopia-ink-soft">{selected.pokemon.category}</p>
          )}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selected.habitats.map((h) => (
              <HabitatCard key={h.id} habitat={h} />
            ))}
          </ul>
        </section>
      )}

      {!selected && !query.trim() && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-pokopia-ink">全部棲息地（{habitats.length}）</h2>
          <p className="mt-1 text-sm text-pokopia-ink-soft">
            也可以反過來看：每個棲息地各自會招來哪些寶可夢。
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habitats.map((h) => (
              <HabitatCard key={h.id} habitat={h} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
