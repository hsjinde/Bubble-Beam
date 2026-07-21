import { createFileRoute } from "@tanstack/react-router";
import { VideoBackdrop } from "@/components/VideoBackdrop";
import { Doodles } from "@/components/Doodles";
import { GuideEntry } from "@/components/GuideEntry";

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
    <main className="fixed inset-0 overflow-hidden" aria-label="波加曼粉絲遊樂場首頁">
      {/* 1. Backdrop */}
      <VideoBackdrop />

      {/* 2. Tint overlay */}
      <div
        className="fixed inset-0 z-10"
        style={{ backgroundColor: "color-mix(in srgb, var(--guide-tint) 25%, transparent)" }}
      />

      {/* 3. Doodle layer */}
      <div
        id="doodle-layer"
        data-testid="doodle-layer"
        className="fixed inset-0 z-20"
        style={{ pointerEvents: "none" }}
      >
        <h1
          className="absolute top-5 left-5 select-none sm:top-6 sm:left-8"
          style={{
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Segoe Print', cursive",
            color: "var(--guide-ink)",
            fontSize: "clamp(1.9rem, 8vw, 3rem)",
            fontWeight: 700,
            transform: "rotate(-4deg)",
            textShadow:
              "0 0 16px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.95), 2px 2px 0 rgba(255,255,255,0.7)",
            letterSpacing: "0.02em",
          }}
        >
          Piplup!
        </h1>
        <Doodles />
      </div>

      {/* Guide entrance */}
      <GuideEntry />
    </main>
  );
}
