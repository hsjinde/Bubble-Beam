import { Link, createFileRoute } from "@tanstack/react-router";
import { VideoBackdrop } from "@/components/VideoBackdrop";
import { Piplup } from "@/components/Piplup";
import { Doodles } from "@/components/Doodles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Piplup! — A Playful Fan Site" },
      {
        name: "description",
        content: "A playful fan site celebrating Piplup, the Penguin Pokémon (#393).",
      },
      { property: "og:title", content: "Piplup! — A Playful Fan Site" },
      {
        property: "og:description",
        content: "A playful fan site celebrating Piplup, the Penguin Pokémon (#393).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 1. Backdrop */}
      <VideoBackdrop />

      {/* 2. Tint overlay */}
      <div
        className="fixed inset-0 z-10"
        style={{ backgroundColor: "rgba(191,227,245,0.25)" }}
      />

      {/* 3. Doodle layer */}
      <div
        id="doodle-layer"
        data-testid="doodle-layer"
        className="fixed inset-0 z-20"
        style={{ pointerEvents: "none" }}
      >
        <h1
          className="absolute top-6 left-8 select-none"
          style={{
            fontFamily:
              "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Segoe Print', cursive",
            color: "#2a6f97",
            fontSize: "3rem",
            fontWeight: 700,
            transform: "rotate(-4deg)",
            textShadow: "2px 2px 0 rgba(255,255,255,0.6)",
            letterSpacing: "0.02em",
          }}
        >
          Piplup!
        </h1>
        <Doodles />
      </div>

      {/* Guide entrance */}
      <Link
        to="/decks"
        className="fixed right-6 top-6 z-40 rounded-full border-2 border-[#2a6f97] bg-white/90 px-4 py-2 font-bold text-[#2a6f97] shadow-lg transition hover:scale-105"
        style={{
          fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
          transform: "rotate(2deg)",
        }}
      >
        牌組攻略 →
      </Link>

      {/* 4. Piplup */}
      <Piplup />
    </div>
  );
}
