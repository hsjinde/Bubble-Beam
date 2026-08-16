import { Link, createFileRoute } from "@tanstack/react-router";
import { PokopiaLayout } from "@/components/pokopia/PokopiaLayout";
import { CookingGuide } from "@/components/pokopia/CookingGuide";
import { absoluteUrl } from "@/lib/site";

/**
 * /pokopia/cooking：料理食譜與苔卡比獸供奉效果。
 *
 * 資料模組（cooking.ts）刻意只在這條路由的元件樹裡 import，讓路由層 code-split
 * 把它切出去，不拖累 /pokopia 主頁（比照 habitats 那條）。
 */
export const Route = createFileRoute("/pokopia/cooking")({
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/pokopia/cooking") }],
    meta: [
      { title: "Pokopia 料理食譜與供奉效果 — Piplup!" },
      {
        name: "description",
        content:
          "《Pokémon Pokopia》全 34 道料理食譜：素材、料理器具、所需寶可夢特技、招式強化，以及供奉給苔卡比獸的當日效果。含六種口味對照與每種口味最好用的 3 級料理推薦。",
      },
      { property: "og:title", content: "Pokopia 料理食譜與供奉效果 — Piplup!" },
      {
        property: "og:description",
        content: "全 34 道料理的素材與供奉效果，六種口味對照，以及每種口味最好用的 3 級料理。",
      },
    ],
  }),
  component: CookingRoute,
});

function CookingRoute() {
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
        <h1 className="mt-3 text-3xl font-bold text-pokopia-ink sm:text-4xl">料理食譜與供奉效果</h1>
        <p className="mt-2 max-w-2xl text-pokopia-ink-soft">
          煮出來的料理有兩個用途：吃下去強化對應的招式，或是供奉給苔卡比獸換一整天的探索加成。
          這裡收錄本篇與 DLC「冒泡泡海底的城鎮」共 34 道食譜，附六種口味的效果對照，
          以及每種口味最好做的 3 級料理。
        </p>
      </header>

      <div className="mt-8">
        <CookingGuide />
      </div>
    </PokopiaLayout>
  );
}
