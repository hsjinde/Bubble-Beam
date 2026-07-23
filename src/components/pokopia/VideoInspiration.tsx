import { useState } from "react";
import { VIDEOS } from "@/data/pokopia/pokopia";
import type { VideoGroup, VideoInspiration as Video } from "@/data/pokopia/types";

/** 分區的顯示順序與文案：以建築內容類型分 7 區，讓玩家依想蓋的東西找靈感。 */
const GROUPS: { key: VideoGroup; title: string; desc: string }[] = [
  {
    key: "city",
    title: "城市・街景",
    desc: "大都會、街區與島嶼導覽，宏觀佈局的靈感。",
  },
  {
    key: "house",
    title: "住宅・別墅",
    desc: "從新手家園到海邊別墅，各種蓋房子的點子。",
  },
  {
    key: "shop",
    title: "商店・餐飲",
    desc: "速食店、冰淇淋店、咖啡廳等機能小店的做法。",
  },
  {
    key: "landmark",
    title: "主題・地標・遊樂",
    desc: "神殿、觀星屋、水上樂園等吸睛的主題設施。",
  },
  {
    key: "automation",
    title: "機關・自動化",
    desc: "自動化設施、電路機關與收納機能基地。",
  },
  {
    key: "nature",
    title: "自然造景",
    desc: "露營地、療癒棲地與蔓草叢生的自然風小鎮。",
  },
  {
    key: "tips",
    title: "設計技巧・綜合",
    desc: "通用排版技巧與多合一的靈感展示。",
  },
];

/**
 * 建築靈感影片：Pokopia 建築教學／展示，按建築內容類型分 7 區（見 GROUPS）。
 * 用於 /pokopia/videos 頁；頁首（h1 與說明）由 route 提供，這裡各分區以 h2 呈現，
 * 維持 h1→h2 階層。縮圖 hotlink YouTube，卡片整個是外連（另開新視窗）；
 * 縮圖載入失敗退回暖色底＋播放圖示。
 */
export function VideoInspiration() {
  return (
    <div className="mt-8 space-y-10">
      {GROUPS.map((group) => {
        const videos = VIDEOS.filter((v) => v.group === group.key);
        if (videos.length === 0) return null;
        return (
          <section key={group.key}>
            <h2 className="text-xl font-bold text-pokopia-ink">{group.title}</h2>
            <p className="mt-1 text-sm text-pokopia-ink-soft">{group.desc}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
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
