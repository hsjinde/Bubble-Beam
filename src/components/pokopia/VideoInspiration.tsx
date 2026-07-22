import { useState } from "react";
import { VIDEOS } from "@/data/pokopia/pokopia";
import type { VideoInspiration as Video } from "@/data/pokopia/types";

/**
 * 建築靈感影片區：熱門的 Pokopia 建築教學／展示。縮圖 hotlink YouTube，卡片整個
 * 是外連（另開新視窗）。縮圖載入失敗退回暖色底＋播放圖示。
 */
export function VideoInspiration() {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-pokopia-ink">建築靈感影片</h2>
      <p className="mt-1 text-sm text-pokopia-ink-soft">
        精選 YouTube 上熱門的 Pokopia 建築與佈局教學，點擊於新視窗開啟。
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map((video) => (
          <li key={video.id}>
            <VideoCard video={video} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function VideoCard({ video }: { video: Video }) {
  const [failed, setFailed] = useState(false);
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-pokopia-tint bg-pokopia-bg-panel transition-colors hover:border-pokopia-accent"
    >
      <div className="relative aspect-video bg-pokopia-highlight">
        {failed ? (
          <span className="flex h-full w-full items-center justify-center text-pokopia-accent">
            <PlayIcon />
          </span>
        ) : (
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        {/* 播放疊層 */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white transition-transform duration-200 group-hover:scale-110">
            <PlayIcon />
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 font-semibold leading-snug text-pokopia-ink">
          {video.title}
        </span>
        <span className="text-xs text-pokopia-ink-soft">{video.channel}</span>
        <span className="mt-1 text-sm text-pokopia-ink-soft">{video.blurb}</span>
      </div>
    </a>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
