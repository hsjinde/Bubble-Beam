import { createFileRoute, Link } from "@tanstack/react-router";
import { VIDEOS } from "@/data/pokopia/pokopia";
import { PokopiaLayout } from "@/components/pokopia/PokopiaLayout";
import { VideoInspiration } from "@/components/pokopia/VideoInspiration";

/**
 * /pokopia/videos：建築影片專屬頁。影片從主頁 /pokopia 搬來獨立成頁，完整 22 支、
 * 7 個建築類型分區。入口在 BookmarkNav（站內連結）。頁首提供 h1 與返回連結，
 * 分區標題由 VideoInspiration 以 h2 呈現，維持 h1→h2 的階層。
 */
export const Route = createFileRoute("/pokopia/videos")({
  head: () => ({
    meta: [
      { title: "Pokopia 建築影片 — Piplup!" },
      {
        name: "description",
        content:
          "《Pokémon Pokopia》建築靈感影片：精選日系精緻建築主播與英文速建教學，依城市、住宅、商店、地標等建築類型分區。",
      },
      { property: "og:title", content: "Pokopia 建築影片 — Piplup!" },
      {
        property: "og:description",
        content: "《Pokémon Pokopia》建築靈感影片，依城市、住宅、商店、地標等類型分區。",
      },
    ],
  }),
  component: VideosRoute,
});

function VideosRoute() {
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
        <h1 className="mt-3 text-3xl font-bold text-pokopia-ink sm:text-4xl">Pokopia 建築影片</h1>
        <p className="mt-2 max-w-2xl text-pokopia-ink-soft">
          精選日系精緻建築主播與英文速建教學，共 {VIDEOS.length}{" "}
          支，依建築類型分區。點擊卡片於新視窗開啟 YouTube。
        </p>
      </header>
      <VideoInspiration />
    </PokopiaLayout>
  );
}
