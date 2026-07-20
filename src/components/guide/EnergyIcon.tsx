import type { EnergyType } from "@/data/types";

/**
 * 每個能量色都配一個實測 ≥4.5:1 的墨色（WCAG 1.4.3 AA，12px 粗體）。
 *
 * 深底色（超／鬥／惡）用白字就達標；淺底與中明度底色（雷／無／鋼／草／龍／水）
 * 白字最低只有 1.40:1，改用「同色相壓深」的墨色。火系兩種都不過，
 * 底色由 #e53935 微調到 #d01e22（同色相加深）才讓白字達 5.40:1。
 * 改任何一組顏色時請一併重算對比，別只換底色。
 */
const ENERGY: Record<EnergyType, { bg: string; ink: string; label: string; name: string }> = {
  Grass: { bg: "#4caf50", ink: "#003800", label: "草", name: "草屬性" },
  Fire: { bg: "#d01e22", ink: "#ffffff", label: "火", name: "火屬性" },
  Water: { bg: "#1e88e5", ink: "#000e5c", label: "水", name: "水屬性" },
  Lightning: { bg: "#fdd835", ink: "#513200", label: "雷", name: "雷屬性" },
  Psychic: { bg: "#8e24aa", ink: "#ffffff", label: "超", name: "超屬性" },
  Fighting: { bg: "#a1543f", ink: "#ffffff", label: "鬥", name: "鬥屬性" },
  Darkness: { bg: "#37474f", ink: "#ffffff", label: "惡", name: "惡屬性" },
  Metal: { bg: "#90a4ae", ink: "#26353d", label: "鋼", name: "鋼屬性" },
  Dragon: { bg: "#b8860b", ink: "#3a1800", label: "龍", name: "龍屬性" },
  Colorless: { bg: "#bdbdbd", ink: "#383838", label: "無", name: "無色屬性" },
};

export function EnergyIcon({ type }: { type: EnergyType }) {
  const e = ENERGY[type];
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm"
      style={{ backgroundColor: e.bg, color: e.ink }}
      title={e.name}
      role="img"
      aria-label={e.name}
    >
      <span aria-hidden="true">{e.label}</span>
    </span>
  );
}
