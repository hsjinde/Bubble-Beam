import { Link } from "@tanstack/react-router";
import { BOOKMARKS } from "@/data/pokopia/pokopia";

/**
 * 書籤導航列：連到官方與社群的外部資源。用 inline SVG（Lucide 風格）而非 emoji，
 * 符合 no-emoji-icons；外連皆 target="_blank" + rel，並在無障礙標籤註明另開新視窗。
 */

// stroke-based path，統一 1.75 筆畫、24 viewBox
const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  cart: "M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm2 12h13",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-14-2 6-6 2 2-6 6-2Z",
  camera:
    "M4 8a2 2 0 0 1 2-2h1l1.2-2h5.6L17 6h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  chat: "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z",
};

function BookmarkIcon({ name }: { name: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.compass} />
    </svg>
  );
}

export function BookmarkNav() {
  return (
    <nav aria-label="Pokopia 相關資源" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {/* 站內主要入口：建築影片專屬頁（非外連，用 Link＋accent 邊框與外部資源區隔） */}
        <li>
          <Link
            to="/pokopia/videos"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-pokopia-accent bg-pokopia-bg-panel px-4 py-2 text-sm font-medium text-pokopia-ink transition-colors hover:bg-pokopia-highlight [&.active]:bg-pokopia-highlight"
          >
            <span className="text-pokopia-accent">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M10 8.5 16 12l-6 3.5Z" />
              </svg>
            </span>
            建築影片
          </Link>
        </li>
        {BOOKMARKS.map((bookmark) => (
          <li key={bookmark.label}>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-pokopia-tint bg-pokopia-bg-panel px-4 py-2 text-sm font-medium text-pokopia-ink transition-colors hover:border-pokopia-accent hover:bg-pokopia-highlight"
            >
              <span className="text-pokopia-accent">
                <BookmarkIcon name={bookmark.icon} />
              </span>
              {bookmark.label}
              <span className="sr-only">（於新視窗開啟）</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="text-pokopia-ink-soft"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
