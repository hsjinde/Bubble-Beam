import { useEffect, useRef, useState } from "react";

type DoodleKind = "bubble" | "sparkle" | "fish" | "note";

interface Doodle {
  id: number;
  kind: DoodleKind;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  drift: "drift-y" | "drift-x";
  color: string;
  rotate: number;
}

const COLORS = ["#2a6f97", "#5fa8d3", "#ffffff"];

// Positions clustered around edges/corners, avoiding center (30-70%, 30-70%)
const EDGE_POSITIONS: Array<{ left: string; top: string }> = [
  { left: "4%", top: "12%" },
  { left: "88%", top: "8%" },
  { left: "12%", top: "78%" },
  { left: "82%", top: "82%" },
  { left: "22%", top: "6%" },
  { left: "68%", top: "10%" },
  { left: "6%", top: "42%" },
  { left: "92%", top: "48%" },
  { left: "18%", top: "90%" },
  { left: "74%", top: "88%" },
  { left: "48%", top: "4%" },
  { left: "50%", top: "92%" },
  { left: "34%", top: "84%" },
  { left: "64%", top: "20%" },
];

const KINDS: DoodleKind[] = ["bubble", "sparkle", "fish", "note"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makeDoodles(): Doodle[] {
  return EDGE_POSITIONS.map((pos, i) => ({
    id: i,
    kind: KINDS[i % KINDS.length],
    left: pos.left,
    top: pos.top,
    size: Math.round(rand(24, 64)),
    duration: rand(8, 20),
    delay: rand(0, 6),
    drift: Math.random() < 0.5 ? "drift-y" : "drift-x",
    color: COLORS[i % COLORS.length],
    rotate: rand(-15, 15),
  }));
}

function DoodleSvg({ kind, color, size }: { kind: DoodleKind; color: string; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none" as const,
    stroke: color,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "bubble") {
    return (
      <svg {...common}>
        <path d="M20 44 Q10 34 16 22 Q24 10 38 14 Q52 18 50 34 Q48 50 32 50 Q22 50 20 44 Z" />
        <path d="M26 22 Q22 26 24 32" strokeWidth={2} opacity={0.7} />
      </svg>
    );
  }
  if (kind === "sparkle") {
    return (
      <svg {...common}>
        <path d="M32 6 Q34 26 54 32 Q34 34 32 58 Q30 34 10 32 Q30 26 32 6 Z" />
      </svg>
    );
  }
  if (kind === "fish") {
    return (
      <svg {...common}>
        <path d="M8 32 Q14 20 30 22 Q46 24 50 32 Q46 40 30 42 Q14 44 8 32 Z" />
        <path d="M50 32 Q56 24 60 22 Q58 32 60 42 Q56 40 50 32 Z" />
        <circle cx="20" cy="30" r="1.6" fill={color} stroke="none" />
      </svg>
    );
  }
  // note
  return (
    <svg {...common}>
      <path d="M24 46 Q24 52 18 52 Q12 52 12 46 Q12 40 18 40 Q22 40 24 42 L24 14 L46 10 L46 40 Q46 46 40 46 Q34 46 34 40 Q34 34 40 34 Q44 34 46 36" />
    </svg>
  );
}

interface Droplet {
  id: number;
  x: number;
  y: number;
}

export function Doodles() {
  const [doodles] = useState<Doodle[]>(() => makeDoodles());
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const dropletIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const dropletsRef = useRef<Droplet[]>([]);

  useEffect(() => {
    dropletsRef.current = droplets;
  }, [droplets]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpawnRef.current < 120) return;
      if (dropletsRef.current.length >= 20) return;
      lastSpawnRef.current = now;
      const id = dropletIdRef.current++;
      const d: Droplet = { id, x: e.clientX, y: e.clientY };
      setDroplets((prev) => [...prev, d]);
      window.setTimeout(() => {
        setDroplets((prev) => prev.filter((x) => x.id !== id));
      }, 850);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <style>{`
        @keyframes doodle-drift-y {
          0%, 100% { transform: translateY(0) rotate(var(--r,0deg)) scale(1); }
          50% { transform: translateY(-14px) rotate(calc(var(--r,0deg) + 6deg)) scale(1.06); }
        }
        @keyframes doodle-drift-x {
          0%, 100% { transform: translateX(0) rotate(var(--r,0deg)) scale(1); }
          50% { transform: translateX(12px) rotate(calc(var(--r,0deg) - 6deg)) scale(0.96); }
        }
        @keyframes cursor-droplet-fall {
          0% { transform: translate(-50%, 0) scale(0.9); opacity: 0.9; }
          100% { transform: translate(-50%, 40px) scale(1); opacity: 0; }
        }
      `}</style>
      {doodles.map((d) => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            ["--r" as string]: `${d.rotate}deg`,
            animation: `doodle-${d.drift} ${d.duration}s ease-in-out ${d.delay}s infinite`,
            willChange: "transform",
            opacity: 0.85,
          }}
        >
          <DoodleSvg kind={d.kind} color={d.color} size={d.size} />
        </div>
      ))}
      {droplets.map((dr) => (
        <div
          key={dr.id}
          className="cursor-droplet fixed"
          style={{
            left: dr.x,
            top: dr.y,
            animation: "cursor-droplet-fall 800ms ease-in forwards",
            willChange: "transform, opacity",
          }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path
              d="M7 2 Q11 8 11 12 Q11 16 7 16 Q3 16 3 12 Q3 8 7 2 Z"
              stroke="#2a6f97"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill="rgba(95,168,211,0.35)"
            />
          </svg>
        </div>
      ))}
    </>
  );
}
