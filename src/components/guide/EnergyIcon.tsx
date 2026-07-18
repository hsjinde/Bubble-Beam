import type { EnergyType } from "@/data/types";

const ENERGY: Record<EnergyType, { color: string; label: string }> = {
  Grass: { color: "#4caf50", label: "草" },
  Fire: { color: "#e53935", label: "火" },
  Water: { color: "#1e88e5", label: "水" },
  Lightning: { color: "#fdd835", label: "雷" },
  Psychic: { color: "#8e24aa", label: "超" },
  Fighting: { color: "#a1543f", label: "鬥" },
  Darkness: { color: "#37474f", label: "惡" },
  Metal: { color: "#90a4ae", label: "鋼" },
  Dragon: { color: "#b8860b", label: "龍" },
  Colorless: { color: "#bdbdbd", label: "無" },
};

export function EnergyIcon({ type }: { type: EnergyType }) {
  const e = ENERGY[type];
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
      style={{ backgroundColor: e.color }}
      title={type}
    >
      {e.label}
    </span>
  );
}
