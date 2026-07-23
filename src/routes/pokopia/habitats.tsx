import { Link, createFileRoute } from "@tanstack/react-router";
import { PokopiaLayout } from "@/components/pokopia/PokopiaLayout";
import { HabitatLookup } from "@/components/pokopia/HabitatLookup";
import { absoluteUrl } from "@/lib/site";

interface HabitatSearch {
  /** 目前選取的寶可夢 slug，用於 deep-link（可分享、可用瀏覽器返回） */
  p?: string;
}

/**
 * /pokopia/habitats：棲息地反查。上游只提供「棲息地 → 出沒寶可夢」，這裡把方向倒過來，
 * 回答玩家實際會問的「我想要 XX，要蓋什麼」。
 *
 * 資料模組（habitats.ts，約 88 KB）刻意只在這條路由的元件樹裡 import，
 * 讓路由層 code-split 把它切出去，不拖累 /pokopia 主頁。
 */
export const Route = createFileRoute("/pokopia/habitats")({
  validateSearch: (search: Record<string, unknown>): HabitatSearch => ({
    p: typeof search.p === "string" ? search.p : undefined,
  }),
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/pokopia/habitats") }],
    meta: [
      { title: "Pokopia 棲息地反查 — Piplup!" },
      {
        name: "description",
        content:
          "《Pokémon Pokopia》棲息地反查：輸入想招來的寶可夢，直接查出該蓋哪些棲息地。收錄全 209 個棲息地與 294 種寶可夢。",
      },
      { property: "og:title", content: "Pokopia 棲息地反查 — Piplup!" },
      {
        property: "og:description",
        content: "輸入想招來的寶可夢，查出該蓋哪些棲息地。全 209 個棲息地一覽。",
      },
    ],
  }),
  component: HabitatsRoute,
});

function HabitatsRoute() {
  const { p } = Route.useSearch();
  const navigate = Route.useNavigate();

  function onSelectPokemon(pokemonId: string | null) {
    navigate({
      search: (prev) => ({ ...prev, p: pokemonId ?? undefined }),
      // 選取不進歷史堆疊，避免每點一隻就多一筆返回紀錄（比照 /pokopia 的 ?b=）
      replace: true,
    });
  }

  return (
    <PokopiaLayout>
      <header>
        <Link
          to="/pokopia"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-pokopia-accent hover:underline"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18 9 12l6-6" />
          </svg>
          返回建築指南
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-pokopia-ink sm:text-4xl">棲息地反查</h1>
        <p className="mt-2 max-w-2xl text-pokopia-ink-soft">
          想招來特定寶可夢，卻不知道要蓋什麼？直接搜寶可夢名字，查出牠會出沒的棲息地。
          棲息地名稱、寶可夢名與分類為上游社群資料庫的官方繁中資料。
        </p>
      </header>

      <div className="mt-8">
        <HabitatLookup selectedPokemonId={p ?? null} onSelectPokemon={onSelectPokemon} />
      </div>
    </PokopiaLayout>
  );
}
