import habitatsData from "./habitats.json";
import type { Habitat, HabitatPokemon } from "./types";

/**
 * 棲息地資料與「寶可夢 → 棲息地」反查索引。
 *
 * **這個模組刻意獨立於 `pokopia.ts`**：habitats.json 約 88 KB，只有 /pokopia/habitats
 * 需要它。放進 pokopia.ts 的話 /pokopia 主頁也會一起載入（同一個 chunk），
 * 這正是 cards.json 那次踩過的坑（見 CLAUDE.md）。只讓該路由 import，
 * 讓路由層 code-split 把它切出去。
 */

export const habitats = habitatsData as Habitat[];

const byId = new Map(habitats.map((h) => [h.id, h]));

export function getHabitat(id: string): Habitat | undefined {
  return byId.get(id);
}

/** 一隻寶可夢（同名形態已合併），以及牠會出沒的所有棲息地。 */
export interface PokemonHabitats {
  /** 代表用的卡片資料（欄位最完整的那筆） */
  pokemon: HabitatPokemon;
  /** 這個名字底下的所有上游 slug（含變種形態），deep-link 任一個都解得到 */
  formIds: string[];
  habitats: Habitat[];
}

/**
 * 反查索引：寶可夢 → 牠出沒的棲息地。模組層算一次就好，不需要放進 useMemo。
 *
 * **以「繁中名」而非 slug 分組**：上游把同一隻寶可夢的不同形態拆成不同 slug
 * （`pikachu` 與 `pikachu-pale` 都叫「皮卡丘」），照 slug 分組會在 UI 上出現兩顆
 * 完全無法分辨的按鈕，而使用者問「皮卡丘在哪」要的是合計。各棲息地卡片仍然
 * 各自渲染自己的 sprite，所以外觀差異看得見。
 *
 * 同名卡片的欄位可能不一致（靜態變種那批沒有編號與分類），取最完整的那筆當代表。
 */
const byName = new Map<string, PokemonHabitats>();
for (const habitat of habitats) {
  for (const p of habitat.pokemon) {
    const existing = byName.get(p.name);
    if (!existing) {
      byName.set(p.name, { pokemon: p, formIds: [p.id], habitats: [habitat] });
      continue;
    }
    if (!existing.formIds.includes(p.id)) existing.formIds.push(p.id);
    if (!existing.habitats.includes(habitat)) existing.habitats.push(habitat);
    if ((!existing.pokemon.no && p.no) || (!existing.pokemon.category && p.category)) {
      existing.pokemon = p;
    }
  }
}

/** 任一形態 slug → 該分組的代表 slug，讓舊的／變種的 ?p= 網址仍然解得到。 */
const idToEntry = new Map<string, PokemonHabitats>();
for (const entry of byName.values()) {
  for (const id of entry.formIds) idToEntry.set(id, entry);
}

/** 全部寶可夢，依圖鑑編號排序（沒有編號的變種排在最後）。 */
export const pokemonList: PokemonHabitats[] = [...byName.values()].sort(
  (a, b) =>
    (a.pokemon.no || Number.MAX_SAFE_INTEGER) - (b.pokemon.no || Number.MAX_SAFE_INTEGER) ||
    a.pokemon.id.localeCompare(b.pokemon.id),
);

export function getPokemonHabitats(pokemonId: string): PokemonHabitats | undefined {
  return idToEntry.get(pokemonId);
}

const HABITAT_IMAGE_BASE = "https://pokopiadex.com/images/habitats/";
const SPRITE_BASE = "https://pokopiadex.com/images/pokemon/sprites/";

export function habitatImageUrl(habitat: Habitat): string {
  return HABITAT_IMAGE_BASE + habitat.image;
}

/** sprite 檔名就是圖鑑 slug，不需要另外存一份網址。 */
export function pokemonSpriteUrl(pokemon: HabitatPokemon): string {
  return `${SPRITE_BASE}${pokemon.id}.png`;
}
