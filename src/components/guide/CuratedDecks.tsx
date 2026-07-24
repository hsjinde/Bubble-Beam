import { useMemo, useState } from "react";
import type { Deck, EnergyType, Tier } from "@/data/types";
import { DeckCard } from "./DeckCard";
import { EnergyIcon } from "./EnergyIcon";

const TIER_ORDER: Tier[] = ["S", "A", "B", "C"];
const DIFFICULTIES: Deck["difficulty"][] = ["易", "中", "難"];

/** 篩選晶片。沿用 MetaRanking 控制列的視覺，避免同一頁出現兩套按鈕語言。 */
function Chip({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition ${
        active
          ? "bg-guide-ink text-guide-on-ink shadow-sm"
          : "border border-guide-tint bg-guide-surface text-guide-ink hover:border-guide-accent"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 策展牌組列表 ＋ 篩選／搜尋。
 *
 * 牌組數量長到 21 套之後，純平鋪的格線已經找不到東西了。`Deck` 本來就有
 * tier／energy／difficulty 三個維度，直接拿來當篩選面向，再加一個文字搜尋。
 *
 * 篩選之間是 AND，同一組內多選是 OR（選了草＋水＝草或水），這是篩選器的慣例。
 */
export function CuratedDecks({ decks }: { decks: Deck[] }) {
  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<Set<Tier>>(new Set());
  const [energies, setEnergies] = useState<Set<EnergyType>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<Deck["difficulty"]>>(new Set());

  // 只列出實際存在的屬性，避免出現永遠 0 結果的晶片
  const availableEnergies = useMemo(() => {
    const seen = new Set<EnergyType>();
    decks.forEach((d) => d.energy.forEach((e) => seen.add(e)));
    return [...seen];
  }, [decks]);

  const toggle = <T,>(set: Set<T>, update: (s: Set<T>) => void, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decks.filter((d) => {
      if (tiers.size && !tiers.has(d.tier)) return false;
      if (difficulties.size && !difficulties.has(d.difficulty)) return false;
      // 屬性是 OR：多屬性牌組只要命中一個就算
      if (energies.size && !d.energy.some((e) => energies.has(e))) return false;
      if (!q) return true;
      // 搜尋範圍含簡介——玩家常記得的是「那套削血的」而不是牌組全名
      return `${d.name} ${d.summary}`.toLowerCase().includes(q);
    });
  }, [decks, query, tiers, energies, difficulties]);

  const active = tiers.size + energies.size + difficulties.size > 0 || query.trim() !== "";

  return (
    <div>
      <div className="mt-4 space-y-3 rounded-xl border border-guide-tint bg-guide-surface/70 p-4">
        {/*
          這頁有兩組長得幾乎一樣的 Tier 篩選（上面排行榜一組、這裡一組）。
          兩者的差異靠三件事說清楚，別為了視覺整齊拿掉任何一件：
          這塊有外框面板、標籤明講範圍（「精選攻略」而非「牌組」）、下面這句話。
        */}
        <p className="text-xs text-guide-ink-muted">
          以下條件只篩這 {decks.length} 套精選攻略，與上方排行榜的篩選各自獨立。
        </p>
        <div>
          <label htmlFor="deck-search" className="text-xs font-semibold text-guide-ink">
            搜尋精選攻略
          </label>
          {/*
            三個對比相關的決定，都是量出來的，不要憑感覺改回去：
            - 邊框用 guide-ink（5.5:1）而非 guide-tint（1.35:1）。輸入框不像按鈕
              有文字標籤可辨識，邊框就是「這裡可以打字」的唯一線索，要滿足
              WCAG 1.4.11 的 3:1。guide-accent 只有 2.62 仍不夠。
            - placeholder 用 slate-500（4.76:1）。slate-400 只有 2.56，
              placeholder 也是文字，要 4.5:1。
            - **不要加 focus:outline-none**。styles.css 有全域 :focus-visible
              焦點環（含 input），關掉等於讓鍵盤使用者看不到焦點在哪。
          */}
          <input
            id="deck-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="牌組名或關鍵字，例如「削血」"
            className="mt-1 block min-h-11 w-full rounded-lg border border-guide-ink bg-guide-surface px-3 text-sm text-guide-ink-body placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="依 Tier 篩選精選攻略"
        >
          <span className="text-xs font-semibold text-guide-ink">Tier</span>
          {TIER_ORDER.map((t) => (
            <Chip key={t} active={tiers.has(t)} onClick={() => toggle(tiers, setTiers, t)}>
              {t}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-guide-ink">屬性</span>
          {availableEnergies.map((e) => (
            <Chip
              key={e}
              active={energies.has(e)}
              onClick={() => toggle(energies, setEnergies, e)}
              label={`篩選 ${e} 屬性`}
            >
              <EnergyIcon type={e} />
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-guide-ink">難度</span>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              active={difficulties.has(d)}
              onClick={() => toggle(difficulties, setDifficulties, d)}
            >
              {d}
            </Chip>
          ))}
          {active && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTiers(new Set());
                setEnergies(new Set());
                setDifficulties(new Set());
              }}
              className="ml-auto min-h-9 rounded-full px-3 text-sm font-semibold text-guide-ink-deep underline hover:text-guide-ink"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {/* 結果數變化要播報，否則螢幕報讀者按了篩選卻不知道發生什麼事 */}
      <p aria-live="polite" className="mt-3 text-sm text-guide-ink-muted">
        顯示 {visible.length} / {decks.length} 套
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-guide-tint bg-guide-surface/60 p-8 text-center text-sm text-guide-ink-muted">
          沒有符合條件的牌組。試著放寬篩選或換個關鍵字。
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
