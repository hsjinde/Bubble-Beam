import { Link, createFileRoute } from "@tanstack/react-router";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { ScheduleBoard } from "@/components/guide/ScheduleBoard";
import { absoluteUrl } from "@/lib/site";

/**
 * /decks/schedule：擴充包與活動行事曆。
 *
 * 上段活動來自人工維護的 events.json（上游卡片資料庫不收未發售的擴充包，也沒有
 * 遊戲內活動）；下段歷代擴充包時間軸由 sets.json 自動生成。
 */
export const Route = createFileRoute("/decks/schedule")({
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/decks/schedule") }],
    meta: [
      { title: "擴充包與活動行事曆 — Piplup!" },
      {
        name: "description",
        content:
          "Pokémon TCG Pocket 擴充包發售與遊戲內活動行事曆：進行中活動倒數，以及歷代 21 個擴充包的發售時間軸。",
      },
      { property: "og:title", content: "擴充包與活動行事曆 — Piplup!" },
      {
        property: "og:description",
        content: "Pokémon TCG Pocket 新擴充包發售倒數與歷代擴充包時間軸。",
      },
    ],
  }),
  component: ScheduleRoute,
});

function ScheduleRoute() {
  return (
    <GuideLayout>
      <header>
        <Link
          to="/decks"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-guide-ink-deep hover:text-guide-ink"
        >
          ← 回排行榜
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-guide-ink sm:text-3xl">擴充包與活動行事曆</h1>
        <p className="mt-2 max-w-2xl text-guide-ink-muted">
          新擴充包什麼時候發售、現在有哪些活動在跑。牌組名與擴充包名保留英文原文。
        </p>
      </header>

      <div className="mt-8">
        <ScheduleBoard />
      </div>
    </GuideLayout>
  );
}
