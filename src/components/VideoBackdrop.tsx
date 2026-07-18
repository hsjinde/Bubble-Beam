import { useEffect, useRef, useState } from "react";
import { VIDEO_IDS } from "@/config/videos";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";
let apiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = API_SRC;
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

type Mode = "youtube" | "local" | "fallback" | "pending";

export function VideoBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeWrapRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const indexRef = useRef(0);
  const erroredIdsRef = useRef<Set<string>>(new Set());

  const [mode, setMode] = useState<Mode>("pending");
  const [localList, setLocalList] = useState<string[]>([]);
  const [localIndex, setLocalIndex] = useState(0);

  // Detect mode via manifest fetch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/videos/manifest.json");
        if (!cancelled && res.ok) {
          const data = await res.json();
          const vids = Array.isArray(data?.videos) ? data.videos.filter((v: any) => typeof v === "string") : [];
          if (vids.length > 0) {
            setLocalList(vids);
            setMode("local");
            return;
          }
        }
      } catch {
        // ignore
      }
      if (!cancelled) setMode("youtube");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cover-crop resizing (applies to both iframe wrap and video element).
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = 16 / 9;
      let width = w;
      let height = w / ratio;
      if (height < h) {
        height = h;
        width = h * ratio;
      }
      const el = iframeWrapRef.current;
      if (el) {
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.left = `${(w - width) / 2}px`;
        el.style.top = `${(h - height) / 2}px`;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mode]);

  // YouTube player init.
  useEffect(() => {
    if (mode !== "youtube") return;
    let cancelled = false;

    const advance = () => {
      const total = VIDEO_IDS.length;
      for (let i = 0; i < total; i++) {
        indexRef.current = (indexRef.current + 1) % total;
        const id = VIDEO_IDS[indexRef.current];
        if (!erroredIdsRef.current.has(id)) {
          playerRef.current?.loadVideoById(id);
          return;
        }
      }
      // all errored
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      setMode("fallback");
    };

    loadYouTubeAPI().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: VIDEO_IDS[0],
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              advance();
            }
          },
          onError: () => {
            const currentId = VIDEO_IDS[indexRef.current];
            erroredIdsRef.current.add(currentId);
            if (erroredIdsRef.current.size >= VIDEO_IDS.length) {
              try {
                playerRef.current?.destroy();
              } catch {
                // ignore
              }
              setMode("fallback");
              return;
            }
            advance();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [mode]);

  const dataMode: Mode = mode === "pending" ? "youtube" : mode;

  return (
    <div
      id="video-backdrop"
      data-testid="video-mode"
      data-video-mode={dataMode}
      className="fixed inset-0 z-0 overflow-hidden"
      style={{
        backgroundColor: "#bfe3f5",
        backgroundImage: `
          radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
          radial-gradient(rgba(42,111,151,0.08) 1px, transparent 1px),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px),
          repeating-linear-gradient(-45deg, rgba(42,111,151,0.03) 0 2px, transparent 2px 6px)
        `,
        backgroundSize: "14px 14px, 22px 22px, 100% 100%, 100% 100%",
        backgroundPosition: "0 0, 7px 11px, 0 0, 0 0",
      }}
    >
      {mode === "youtube" && (
        <div
          ref={iframeWrapRef}
          className="absolute"
          style={{ pointerEvents: "none" }}
        >
          <div ref={hostRef} style={{ width: "100%", height: "100%" }} />
        </div>
      )}
      {mode === "local" && localList.length > 0 && (
        <video
          ref={videoElRef}
          key={localList[localIndex]}
          src={`/videos/${localList[localIndex]}`}
          muted
          autoPlay
          playsInline
          onEnded={() => setLocalIndex((i) => (i + 1) % localList.length)}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", pointerEvents: "none" }}
        />
      )}
    </div>
  );
}
