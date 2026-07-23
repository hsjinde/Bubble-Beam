import { createFileRoute } from "@tanstack/react-router";
import { PokopiaLayout } from "@/components/pokopia/PokopiaLayout";
import { PokopiaPage } from "@/components/pokopia/PokopiaPage";
import { absoluteUrl } from "@/lib/site";

interface PokopiaSearch {
  /** 目前選取的建築 slug，用於 deep-link（可分享、可用瀏覽器返回） */
  b?: string;
}

export const Route = createFileRoute("/pokopia/")({
  validateSearch: (search: Record<string, unknown>): PokopiaSearch => ({
    b: typeof search.b === "string" ? search.b : undefined,
  }),
  head: () => ({
    /*
     * canonical 刻意不帶 ?b=<slug>。那個參數只是換掉頁面裡的建築詳情面板，
     * 主體（全 45 種一覽）完全相同——不收斂的話 45 個近乎重複的網址會各自被索引，
     * 把排名訊號打散。深連結本身仍然可分享、可返回，只是不各自進索引。
     */
    links: [{ rel: "canonical", href: absoluteUrl("/pokopia") }],
    meta: [
      { title: "Pokopia 建築指南 — Piplup!" },
      {
        name: "description",
        content:
          "《Pokémon Pokopia》全 45 種建築物繁中一覽：功能分類、材質系列、搭配靈感與主題選集。",
      },
      { property: "og:title", content: "Pokopia 建築指南 — Piplup!" },
      {
        property: "og:description",
        content: "《Pokémon Pokopia》全 45 種建築物繁中一覽與規劃靈感。",
      },
    ],
  }),
  component: PokopiaRoute,
});

function PokopiaRoute() {
  const { b } = Route.useSearch();
  const navigate = Route.useNavigate();

  function onSelectBuilding(buildingId: string | null) {
    navigate({
      search: (prev) => ({ ...prev, b: buildingId ?? undefined }),
      // 選取不進歷史堆疊，避免每點一次建築就多一筆返回紀錄
      replace: true,
    });
  }

  return (
    <PokopiaLayout>
      <PokopiaPage selectedBuildingId={b ?? null} onSelectBuilding={onSelectBuilding} />
    </PokopiaLayout>
  );
}
