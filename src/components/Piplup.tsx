import { useEffect, useRef, useState, useCallback } from "react";

const SPRITE_SOURCES = [
  "/piplup.png",
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/393.png",
];

type State = "chase" | "idle" | "sleep" | "react";

interface Heart {
  id: number;
  x: number;
  y: number;
  dx: number;
}

const IDLE_MS = 5000;
const SLEEP_MS = 15000;

export function Piplup() {
  const imgRef = useRef<HTMLImageElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef(1);
  const arrivedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const reactStartRef = useRef<number | null>(null);
  const prevStateRef = useRef<State>("chase");
  const stateRef = useRef<State>("chase");
  const heartIdRef = useRef(0);

  const [state, setStateRaw] = useState<State>("chase");
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [zzzPos, setZzzPos] = useState({ x: 0, y: 0 });
  const [srcIndex, setSrcIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const setState = useCallback((s: State) => {
    stateRef.current = s;
    setStateRaw(s);
  }, []);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (sleepTimerRef.current !== null) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  const scheduleIdleSleep = useCallback(() => {
    clearTimers();
    idleTimerRef.current = window.setTimeout(() => {
      if (stateRef.current !== "react") setState("idle");
    }, IDLE_MS);
    sleepTimerRef.current = window.setTimeout(() => {
      if (stateRef.current !== "react") setState("sleep");
    }, SLEEP_MS);
  }, [clearTimers, setState]);

  useEffect(() => {
    posRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    targetRef.current = { ...posRef.current };

    // pointermove 同時涵蓋滑鼠與觸控，手機拖曳手指也能讓波加曼跟隨
    const onMove = (e: PointerEvent) => {
      targetRef.current = { x: e.clientX + 24, y: e.clientY + 24 };
      if (stateRef.current !== "react") {
        setState("chase");
      } else {
        // still in react; will return to chase after react finishes
        prevStateRef.current = "chase";
      }
      scheduleIdleSleep();
    };
    window.addEventListener("pointermove", onMove);
    scheduleIdleSleep();

    const tick = (time: number) => {
      const pos = posRef.current;
      const tgt = targetRef.current;
      const s = stateRef.current;

      let renderX = pos.x;
      let renderY = pos.y;
      let rotate = 0;
      let squash = 1;

      if (s === "chase") {
        const dx = tgt.x - pos.x;
        const dy = tgt.y - pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) {
          arrivedRef.current = true;
        } else {
          arrivedRef.current = false;
          pos.x += dx * 0.07;
          pos.y += dy * 0.07;
          if (Math.abs(dx) > 1) {
            facingRef.current = dx < 0 ? -1 : 1;
          }
        }
        const bounce = arrivedRef.current ? 0 : Math.sin(time * 0.018) * 6;
        renderX = pos.x;
        renderY = pos.y + bounce;
      } else if (s === "idle") {
        rotate = Math.sin(time * 0.003) * 4;
        squash = 1 + Math.sin(time * 0.004) * 0.03;
      } else if (s === "sleep") {
        squash = 1 + Math.sin(time * 0.002) * 0.02;
      } else if (s === "react") {
        const start = reactStartRef.current ?? time;
        const t = Math.min(1, (time - start) / 300);
        // up then back down: sin(pi*t) peaks at 0.5
        const up = Math.sin(Math.PI * t) * 40;
        renderY = pos.y - up;
        if (t >= 1) {
          reactStartRef.current = null;
          setState(prevStateRef.current);
          scheduleIdleSleep();
        }
      }

      const el = imgRef.current;
      if (el) {
        const sx = facingRef.current === -1 ? -1 : 1;
        el.style.transform = `translate3d(${renderX - 60}px, ${renderY - 60}px, 0) rotate(${rotate}deg) scale(${sx * squash}, ${squash})`;
      }

      if (s === "sleep" || s === "idle") {
        setZzzPos({ x: pos.x, y: pos.y });
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      clearTimers();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [clearTimers, scheduleIdleSleep, setState]);

  const handleClick = useCallback(() => {
    // remember what to return to (chase by default)
    if (stateRef.current !== "react") {
      prevStateRef.current = "chase";
    }
    reactStartRef.current = null; // will be set in next tick
    // schedule react start on next animation frame using performance.now baseline
    requestAnimationFrame((t) => {
      reactStartRef.current = t;
    });
    setState("react");
    clearTimers();

    // spawn 3 hearts
    const base = heartIdRef.current;
    heartIdRef.current += 3;
    const p = posRef.current;
    const newHearts: Heart[] = [0, 1, 2].map((i) => ({
      id: base + i,
      x: p.x,
      y: p.y,
      dx: (i - 1) * 20 + (Math.random() - 0.5) * 10,
    }));
    setHearts((h) => [...h, ...newHearts]);
    window.setTimeout(() => {
      setHearts((h) => h.filter((x) => !newHearts.find((n) => n.id === x.id)));
    }, 1000);
  }, [clearTimers, setState]);

  return (
    <>
      <style>{`
        @keyframes piplup-heart-float {
          0% { transform: translate(-50%, -50%) translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translate(-50%, -50%) translateY(-10px) scale(1); }
          100% { transform: translate(-50%, -50%) translateY(-80px) scale(1.1); opacity: 0; }
        }
        @keyframes piplup-zzz-float {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1.1); opacity: 0; }
        }
      `}</style>

      {imgFailed ? (
        <svg
          ref={imgRef as unknown as React.RefObject<SVGSVGElement>}
          id="piplup"
          data-piplup-state={state}
          data-piplup-fallback="svg"
          onClick={handleClick}
          width={120}
          height={120}
          viewBox="0 0 120 120"
          className="fixed top-0 left-0 z-30"
          style={{
            userSelect: "none",
            pointerEvents: "auto",
            cursor: "default",
            willChange: "transform",
            transform: "translate3d(-9999px, -9999px, 0)",
          }}
        >
          {/* Body */}
          <ellipse
            cx="60"
            cy="72"
            rx="38"
            ry="42"
            fill="#5fa8d3"
            stroke="#2a6f97"
            strokeWidth="3"
          />
          {/* Face */}
          <ellipse
            cx="60"
            cy="58"
            rx="26"
            ry="24"
            fill="#ffffff"
            stroke="#2a6f97"
            strokeWidth="2.5"
          />
          {/* Eyes */}
          <circle cx="50" cy="54" r="3.5" fill="#1a1a1a" />
          <circle cx="70" cy="54" r="3.5" fill="#1a1a1a" />
          {/* Beak */}
          <path
            d="M54 66 Q60 74 66 66 Q60 70 54 66 Z"
            fill="#f4a12a"
            stroke="#c07a10"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Feet */}
          <ellipse
            cx="46"
            cy="112"
            rx="8"
            ry="4"
            fill="#f4a12a"
            stroke="#c07a10"
            strokeWidth="1.5"
          />
          <ellipse
            cx="74"
            cy="112"
            rx="8"
            ry="4"
            fill="#f4a12a"
            stroke="#c07a10"
            strokeWidth="1.5"
          />
        </svg>
      ) : (
        <img
          ref={imgRef}
          id="piplup"
          data-piplup-state={state}
          src={SPRITE_SOURCES[srcIndex]}
          alt="Piplup"
          draggable={false}
          onClick={handleClick}
          onError={() => {
            if (srcIndex < SPRITE_SOURCES.length - 1) {
              setSrcIndex((i) => i + 1);
            } else {
              setImgFailed(true);
            }
          }}
          width={120}
          className="fixed top-0 left-0 z-30"
          style={{
            width: "120px",
            userSelect: "none",
            pointerEvents: "auto",
            cursor: "default",
            willChange: "transform",
            transform: "translate3d(-9999px, -9999px, 0)",
          }}
        />
      )}

      {state === "sleep" && (
        <div
          className="fixed z-30"
          style={{
            left: zzzPos.x,
            top: zzzPos.y - 80,
            pointerEvents: "none",
            transform: "translate(-50%, 0)",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            style={{
              animation: "piplup-zzz-float 2.4s ease-out infinite",
            }}
          >
            <path
              d="M8 14 Q10 12 22 13 Q14 22 8 30 Q18 29 26 30"
              stroke="#2a6f97"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M28 30 Q30 28 40 29 Q32 36 28 42 Q36 41 44 42"
              stroke="#2a6f97"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}

      {hearts.map((h) => (
        <div
          key={h.id}
          className="fixed z-30"
          style={{
            left: h.x + h.dx,
            top: h.y - 40,
            pointerEvents: "none",
            animation: "piplup-heart-float 1s ease-out forwards",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28">
            <path
              d="M14 24 Q4 16 4 10 Q4 5 9 5 Q12 5 14 9 Q16 5 19 5 Q24 5 24 10 Q24 16 14 24 Z"
              fill="#e85a7a"
              stroke="#b83a5a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
