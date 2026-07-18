# TCG Pocket 牌組攻略站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有波加曼互動頁專案上擴充 Pokémon TCG Pocket 牌組攻略站：`/decks` tier 分組列表 + `/decks/$deckId` 真實卡圖牌表與繁中攻略。

**Architecture:** 本地 repo（`D:\piplup-website`，TanStack Start 檔案式路由）直接實作與驗證。策展牌組為靜態資料模組；卡片名稱/卡圖 URL 來自一次性腳本產生的 `src/data/cards.json`（TCGdex）；卡圖 runtime 走 TCGdex CDN。攻略頁共用 `GuideLayout`，首頁波加曼頁不受影響。最後（經使用者確認）同步到 Lovable 專案。

**Tech Stack:** TanStack Start + React 19 + Tailwind v4（沿用現有）、TCGdex API（`https://api.tcgdex.net/v2/en/...`）、Node 24（跑抓卡腳本，寫成 `.mjs` 免 TS 執行器）

## Global Constraints

- 驗證方式一律為瀏覽器實測（`npm run dev` → `http://localhost:8080`），無測試框架——spec 明定。
- 站點介面與攻略內容用繁體中文；卡名英文（TCGdex 無 TCG Pocket 繁中，`zh-tw` 回 404）。
- 配色沿用波加曼頁：底 `#bfe3f5`、主色 `#2a6f97`、輔色 `#5fa8d3`。
- 攻略頁不出現跟隨滑鼠的波加曼；首頁（`/`）不套 `GuideLayout`、行為不得改變。
- 卡圖 URL 格式：`https://assets.tcgdex.net/en/tcgp/{set}/{找齊三位數編號}/high.webp`（例 `A1/036`）；`cards.json` 內存完整 URL。
- runtime 不打 TCGdex API（名稱走本地索引；卡圖由瀏覽器向 CDN 載圖）。
- `src/routeTree.gen.ts` 由 dev server 自動重生，不得手改。
- Tier 排序固定 S → A → B → C。
- 新元件放 `src/components/guide/`，資料放 `src/data/`。
- Commit 訊息結尾加 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

## File Structure

| 檔案 | 職責 |
|------|------|
| `scripts/fetch-cards.mjs` | 一次性：抓牌組涵蓋 set 的完整卡池 → `src/data/cards.json` |
| `src/data/cards.json` | 卡片索引（產物，進版控） |
| `src/data/types.ts` | `Deck`/`DeckCard`/`Matchup`/`EnergyType`/`CardEntry` 型別 |
| `src/data/cards.ts` | `getCard(id)` 查詢 |
| `src/data/decks.ts` | 5 套策展牌組 + `listDecks()`/`getDeck(id)` |
| `src/components/guide/TierBadge.tsx` | tier 徽章 |
| `src/components/guide/EnergyIcon.tsx` | 能量屬性小圖示 |
| `src/components/guide/CardImage.tsx` | 卡圖（含 fallback 占位卡背） |
| `src/components/guide/GuideLayout.tsx` | 攻略區殼：導覽列＋可捲動內容 |
| `src/components/guide/DeckCard.tsx` | 列表頁牌組卡 |
| `src/components/guide/Decklist.tsx` | 詳情頁牌表網格 |
| `src/routes/decks/index.tsx` | `/decks` 列表 route |
| `src/routes/decks/$deckId.tsx` | `/decks/:deckId` 詳情 route |
| `src/routes/index.tsx`（修改） | 首頁加攻略站入口按鈕 |

---

### Task 1: 研究當前環境牌組並取得使用者確認

**Files:**
- Create: `docs/superpowers/plans/deck-research.md`（研究記錄：5 套牌組名、牌表、卡 id、涵蓋 set）

**Interfaces:**
- Produces: 確認過的 5 套牌組完整牌表（每張卡的 TCGdex id 如 `A4-039` 與張數）、涵蓋的 set id 清單（給 Task 2 的腳本）

- [x] **Step 1: 抓 Limitless 當前 meta 前五 archetype**（B3b Standard；前五與 URL 已記錄）

用 WebFetch 抓 `https://play.limitlesstcg.com/decks?game=pocket`，記下前 5 名 archetype 名稱與 meta share/勝率（僅作為 tier 評定參考，不放站上）。

- [x] **Step 2: 逐套抓標準牌表**（archetype 頁只有賽績，改抓各套第一名選手實際牌表；五套皆 20 張）

對每個 archetype，WebFetch 其 Limitless 牌組頁（列表頁點入的連結，如 `https://play.limitlesstcg.com/decks/<slug>?game=pocket`），記錄 20 張牌表：卡名 + set 代號 + 編號（Limitless 顯示格式如「Miraidon ex A4 39」→ TCGdex id `A4-039`，編號補零成三位）。

- [x] **Step 3: 對 TCGdex 抽查驗證 id**（發現 TCGdex 缺 B3/B3a/B3b/PROMO-B → 改用 flibustier 資料庫＋pokemon-tcg-exchange 卡圖；47 張不重複卡逐張驗證全過，資料源變更已寫入 spec 修訂）

每套牌抽 2 張卡，WebFetch `https://api.tcgdex.net/v2/en/cards/{id}`（如 `A4-039`）確認卡名吻合。若編號對不上（TCGdex 與 Limitless 編號差異），改抓該 set 全卡 `https://api.tcgdex.net/v2/en/sets/{set}` 用卡名比對出正確 id，並在研究記錄註明。

- [x] **Step 4: 寫 `deck-research.md` 並向使用者確認名單**（使用者確認：資料源變更＋五套名單都 OK）

記錄 5 套牌組（名稱、tier 初評、20 張牌表含 id、涵蓋 set 清單）。用 AskUserQuestion 向使用者確認這 5 套（可換）。**未確認不進 Task 2。**

- [x] **Step 5: Commit**

---

### Task 2: 抓卡腳本與 cards.json

**Files:**
- Create: `scripts/fetch-cards.mjs`
- Create: `src/data/cards.json`（腳本產物）

**Interfaces:**
- Consumes: Task 1 的 set id 清單（填入 `SETS` 常數）
- Produces: `cards.json`，格式 `{ "A1-036": { "id": "A1-036", "nameEN": "Charizard ex", "imageUrl": "https://assets.tcgdex.net/en/tcgp/A1/036/high.webp" }, ... }`（以 id 為 key 的物件，便於 O(1) 查）

- [x] **Step 1: 寫 `scripts/fetch-cards.mjs`**（依 Task 1 確認的資料源變更改用 flibustier：資料 `dist/cards/{SET}.json`、卡圖 pokemon-tcg-exchange `cards-by-set/{SET}/{number}.webp`、id 不補零）

```js
// One-shot: fetch full card pools for the sets our curated decks use,
// and write a local id-keyed index so the app never hits the API at runtime.
import { writeFile } from "node:fs/promises";

const SETS = ["A1"]; // ← 換成 Task 1 確認的 set id 清單
const OUT = new URL("../src/data/cards.json", import.meta.url);

const index = {};
for (const set of SETS) {
  const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${set}`);
  if (!res.ok) throw new Error(`fetch ${set} failed: ${res.status}`);
  const data = await res.json();
  for (const card of data.cards) {
    // card.id like "A1-036"; card.image like "https://assets.tcgdex.net/en/tcgp/A1/036"
    if (!card.image) continue;
    index[card.id] = {
      id: card.id,
      nameEN: card.name,
      imageUrl: `${card.image}/high.webp`,
    };
  }
  console.log(`${set}: ${data.cards.length} cards`);
}
await writeFile(OUT, JSON.stringify(index, null, 2));
console.log(`wrote ${Object.keys(index).length} cards`);
```

- [x] **Step 2: 執行腳本**（15 sets 共 2,494 張，wrote 成功）

- [x] **Step 3: 抽查產物**（10 張跨牌組關鍵卡全部存在、imageUrl 格式正確）

用 Grep/Read 抽查 `cards.json`：Task 1 牌表中每套牌抽 1 張卡 id，確認存在且 `imageUrl` 以 `/high.webp` 結尾。任一缺漏→回 Task 1 Step 3 的比對法修正 id。

- [x] **Step 4: Commit**

---

### Task 3: 型別與資料模組（cards + decks）

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/cards.ts`
- Create: `src/data/decks.ts`

**Interfaces:**
- Consumes: `cards.json`（Task 2）、Task 1 確認的牌表
- Produces: `getCard(id: string): CardEntry | undefined`；`listDecks(): Deck[]`（S→A→B→C 排序）；`getDeck(id: string): Deck | undefined`；型別 `Deck`/`DeckCard`/`Matchup`/`EnergyType`/`Tier`/`CardEntry`

- [x] **Step 1: 寫 `src/data/types.ts`**

```ts
export type Tier = "S" | "A" | "B" | "C";

export type EnergyType =
  | "Grass" | "Fire" | "Water" | "Lightning" | "Psychic"
  | "Fighting" | "Darkness" | "Metal" | "Dragon" | "Colorless";

export interface CardEntry {
  id: string;      // "A1-036"
  nameEN: string;  // "Charizard ex"
  nameTC?: string; // 人工繁中對照（可選）
  imageUrl: string;
}

export interface DeckCard {
  id: string;   // TCGdex card id
  count: number;
}

export interface Matchup {
  vs: string;   // 對手牌組名
  note: string; // 繁中思路
}

export interface Deck {
  id: string;          // slug, e.g. "miraidon-magnezone"
  name: string;        // 繁中牌組名
  tier: Tier;
  energy: EnergyType[];
  cards: DeckCard[];
  summary: string;     // 一句話簡介
  strategy: string;    // 繁中攻略；段落以空行分隔，"- " 開頭為列點
  matchups?: Matchup[];
  difficulty: "易" | "中" | "難";
}
```

- [x] **Step 2: 寫 `src/data/cards.ts`**

```ts
import type { CardEntry } from "./types";
import rawIndex from "./cards.json";

const index = rawIndex as Record<string, CardEntry>;

export function getCard(id: string): CardEntry | undefined {
  return index[id];
}
```

- [x] **Step 3: 寫 `src/data/decks.ts`（5 套策展牌組）**（五套完整繁中攻略＋對戰思路，攻略內容以「打法模式」層級撰寫、不引述不確定的單卡效果細節）

結構如下；`cards`／tier／名稱用 Task 1 確認的研究結果，`summary`/`strategy`/`matchups` 以繁中撰寫（每套 strategy 至少 3 段：核心思路、展開順序、注意事項；matchups 至少 2 筆）。範例骨架（第一套，其餘四套同型）：

```ts
import type { Deck, Tier } from "./types";

const decks: Deck[] = [
  {
    id: "miraidon-magnezone",
    name: "未來三首惡＋自爆磁怪",
    tier: "S",
    energy: ["Lightning"],
    difficulty: "中",
    summary: "以 Miraidon ex 快速供能、Magnezone 重砲收尾的電系速攻牌組。",
    cards: [
      { id: "A4-039", count: 2 }, // ← Task 1 研究結果，逐張填入共 20 張
      // ...
    ],
    strategy: [
      "核心思路：……（實作時撰寫，禁留空）",
      "展開順序：……",
      "注意事項：……",
    ].join("\n\n"),
    matchups: [
      { vs: "……", note: "……" },
      { vs: "……", note: "……" },
    ],
  },
  // ...其餘 4 套
];

const TIER_ORDER: Record<Tier, number> = { S: 0, A: 1, B: 2, C: 3 };

export function listDecks(): Deck[] {
  return [...decks].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

export function getDeck(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}
```

（範例中的「……（實作時撰寫）」是指實作此步驟時必須寫出完整繁中內容，成品檔案不得留任何省略號。）

- [x] **Step 4: 驗證資料完整性（快速腳本）**（missing: none、五套皆 total 20）

Run: `node --input-type=module -e "const cards=(await import('./src/data/cards.json',{with:{type:'json'}})).default; const src=(await import('node:fs')).readFileSync('src/data/decks.ts','utf8'); const ids=[...src.matchAll(/id: \"([A-Za-z0-9]+-\\d+)\"/g)].map(m=>m[1]); const missing=ids.filter(id=>!cards[id]); console.log('deck card refs:',ids.length,'missing:',missing);"`
Expected: `missing: []`。每套牌 `cards` 張數總和應為 20（TCG Pocket 牌組 20 張）——目視每套加總確認。

- [x] **Step 5: Commit**

---

### Task 4: 基礎元件（TierBadge / EnergyIcon / CardImage）

**Files:**
- Create: `src/components/guide/TierBadge.tsx`
- Create: `src/components/guide/EnergyIcon.tsx`
- Create: `src/components/guide/CardImage.tsx`

**Interfaces:**
- Consumes: `getCard` 與型別（Task 3）
- Produces: `<TierBadge tier={Tier} />`、`<EnergyIcon type={EnergyType} />`、`<CardImage cardId={string} className?={string} />`

- [x] **Step 1: 寫 `TierBadge.tsx`**

```tsx
import type { Tier } from "@/data/types";

const TIER_STYLES: Record<Tier, string> = {
  S: "bg-amber-400 text-amber-950",
  A: "bg-sky-500 text-white",
  B: "bg-emerald-500 text-white",
  C: "bg-slate-400 text-white",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shadow ${TIER_STYLES[tier]}`}
      title={`Tier ${tier}`}
    >
      {tier}
    </span>
  );
}
```

- [x] **Step 2: 寫 `EnergyIcon.tsx`**

```tsx
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
```

- [x] **Step 3: 寫 `CardImage.tsx`（含兩層 fallback：索引缺卡、圖載入失敗）**

```tsx
import { useState } from "react";
import { getCard } from "@/data/cards";

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-[63/88] w-full items-center justify-center rounded-lg border-2 border-[#5fa8d3] bg-gradient-to-br from-[#bfe3f5] to-[#5fa8d3] p-1 text-center text-xs font-semibold text-[#2a6f97]">
      {label}
    </div>
  );
}

export function CardImage({ cardId, className = "" }: { cardId: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const card = getCard(cardId);
  if (!card) return <Placeholder label={cardId} />;
  if (failed) return <Placeholder label={card.nameTC ?? card.nameEN} />;
  return (
    <img
      src={card.imageUrl}
      alt={card.nameTC ?? card.nameEN}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`aspect-[63/88] w-full rounded-lg shadow ${className}`}
    />
  );
}
```

- [x] **Step 4: Commit**

---

### Task 5: GuideLayout 與 `/decks` 列表頁

**Files:**
- Create: `src/components/guide/GuideLayout.tsx`
- Create: `src/components/guide/DeckCard.tsx`
- Create: `src/routes/decks/index.tsx`

**Interfaces:**
- Consumes: `listDecks()`、`TierBadge`、`EnergyIcon`、`CardImage`
- Produces: route `/decks`；`<GuideLayout>{children}</GuideLayout>`（Task 6 詳情頁沿用）

- [x] **Step 1: 寫 `GuideLayout.tsx`**（頁尾出處改註明 flibustier 資料庫）

```tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function GuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef7fc]">
      <header className="sticky top-0 z-40 border-b border-[#bfe3f5] bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-[#2a6f97]">
            Piplup!
          </Link>
          <Link
            to="/decks"
            className="font-semibold text-[#2a6f97]/80 hover:text-[#2a6f97] [&.active]:text-[#2a6f97] [&.active]:underline"
          >
            牌組攻略
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-[#2a6f97]/60">
        非官方粉絲攻略站。卡牌資料與卡圖來自 TCGdex；Pokémon 相關權利屬於其權利人。
      </footer>
    </div>
  );
}
```

- [x] **Step 2: 寫 `DeckCard.tsx`（列表用牌組卡，主卡圖 = 牌表第一張）**

```tsx
import { Link } from "@tanstack/react-router";
import type { Deck } from "@/data/types";
import { CardImage } from "./CardImage";
import { EnergyIcon } from "./EnergyIcon";
import { TierBadge } from "./TierBadge";

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Link
      to="/decks/$deckId"
      params={{ deckId: deck.id }}
      className="block rounded-xl border border-[#bfe3f5] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0">
          <CardImage cardId={deck.cards[0].id} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TierBadge tier={deck.tier} />
            <h3 className="truncate text-lg font-bold text-[#2a6f97]">{deck.name}</h3>
          </div>
          <div className="mt-1 flex gap-1">
            {deck.energy.map((e) => (
              <EnergyIcon key={e} type={e} />
            ))}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{deck.summary}</p>
        </div>
      </div>
    </Link>
  );
}
```

- [x] **Step 3: 寫 `src/routes/decks/index.tsx`（tier 分組列表）**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { listDecks } from "@/data/decks";
import type { Deck, Tier } from "@/data/types";
import { DeckCard } from "@/components/guide/DeckCard";
import { GuideLayout } from "@/components/guide/GuideLayout";

export const Route = createFileRoute("/decks/")({
  head: () => ({
    meta: [
      { title: "牌組攻略 — Piplup! TCG Pocket" },
      { name: "description", content: "Pokémon TCG Pocket 熱門牌組整理與繁中攻略。" },
    ],
  }),
  component: DecksPage,
});

const TIERS: Tier[] = ["S", "A", "B", "C"];

function DecksPage() {
  const decks = listDecks();
  const byTier = new Map<Tier, Deck[]>();
  for (const d of decks) byTier.set(d.tier, [...(byTier.get(d.tier) ?? []), d]);

  return (
    <GuideLayout>
      <h1 className="text-3xl font-bold text-[#2a6f97]">TCG Pocket 牌組攻略</h1>
      <p className="mt-2 text-slate-600">
        人工整理的當前熱門牌組。點進牌組看完整牌表與打法。
      </p>
      {TIERS.filter((t) => byTier.has(t)).map((tier) => (
        <section key={tier} className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-[#2a6f97]">Tier {tier}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {byTier.get(tier)!.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      ))}
    </GuideLayout>
  );
}
```

- [x] **Step 4: 瀏覽器驗證列表頁**（Tier S×2 + Tier A×3 正確分組、5 張主卡圖全載入、console 無錯誤、截圖確認）

dev server（`.claude/launch.json` 的 `piplup-dev`，port 8080）→ 開 `http://localhost:8080/decks`：tier 區塊依 S→A→B→C 出現、每卡有主卡圖／tier 徽章／能量圖示／簡介、hover 有浮起效果。console 無紅字。截圖。

- [x] **Step 5: Commit**

---

### Task 6: `/decks/$deckId` 詳情頁

**Files:**
- Create: `src/components/guide/Decklist.tsx`
- Create: `src/routes/decks/$deckId.tsx`

**Interfaces:**
- Consumes: `getDeck(id)`、`GuideLayout`、`Decklist`、`CardImage`、`TierBadge`、`EnergyIcon`
- Produces: route `/decks/:deckId`（含 not-found 狀態）

- [ ] **Step 1: 寫 `Decklist.tsx`（卡圖網格＋張數角標）**

```tsx
import type { DeckCard as DeckCardEntry } from "@/data/types";
import { getCard } from "@/data/cards";
import { CardImage } from "./CardImage";

export function Decklist({ cards }: { cards: DeckCardEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {cards.map((c) => {
        const entry = getCard(c.id);
        return (
          <figure key={c.id} className="relative">
            <CardImage cardId={c.id} />
            <span className="absolute -right-1 -top-1 rounded-full bg-[#2a6f97] px-2 py-0.5 text-xs font-bold text-white shadow">
              ×{c.count}
            </span>
            <figcaption className="mt-1 truncate text-center text-xs text-slate-600">
              {entry ? (entry.nameTC ?? entry.nameEN) : c.id}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 寫 `src/routes/decks/$deckId.tsx`（含攻略段落渲染與 not-found）**

```tsx
import { Link, createFileRoute } from "@tanstack/react-router";
import { getDeck } from "@/data/decks";
import { Decklist } from "@/components/guide/Decklist";
import { EnergyIcon } from "@/components/guide/EnergyIcon";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { TierBadge } from "@/components/guide/TierBadge";

export const Route = createFileRoute("/decks/$deckId")({
  head: ({ params }) => {
    const deck = getDeck(params.deckId);
    return {
      meta: [{ title: deck ? `${deck.name} — 牌組攻略` : "找不到牌組" }],
    };
  },
  component: DeckDetailPage,
});

/** 段落以空行分隔；"- " 開頭的連續行渲染為列點清單。 */
function Strategy({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((block, i) =>
        block.trimStart().startsWith("- ") ? (
          <ul key={i} className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
            {block.split("\n").map((line, j) => (
              <li key={j}>{line.replace(/^- /, "")}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mt-3 leading-relaxed text-slate-700">
            {block}
          </p>
        ),
      )}
    </>
  );
}

function DeckDetailPage() {
  const { deckId } = Route.useParams();
  const deck = getDeck(deckId);

  if (!deck) {
    return (
      <GuideLayout>
        <h1 className="text-2xl font-bold text-[#2a6f97]">找不到這套牌</h1>
        <p className="mt-2 text-slate-600">它可能已被移除或網址打錯了。</p>
        <Link to="/decks" className="mt-4 inline-block font-semibold text-[#2a6f97] underline">
          ← 回牌組列表
        </Link>
      </GuideLayout>
    );
  }

  return (
    <GuideLayout>
      <Link to="/decks" className="text-sm font-semibold text-[#2a6f97]/70 hover:text-[#2a6f97]">
        ← 回牌組列表
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <TierBadge tier={deck.tier} />
        <h1 className="text-3xl font-bold text-[#2a6f97]">{deck.name}</h1>
        <span className="flex gap-1">
          {deck.energy.map((e) => (
            <EnergyIcon key={e} type={e} />
          ))}
        </span>
        <span className="rounded-full bg-[#bfe3f5] px-3 py-0.5 text-sm font-semibold text-[#2a6f97]">
          難度：{deck.difficulty}
        </span>
      </div>
      <p className="mt-3 text-slate-600">{deck.summary}</p>

      <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">牌表（20 張）</h2>
      <div className="mt-4">
        <Decklist cards={deck.cards} />
      </div>

      <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">打法攻略</h2>
      <Strategy text={deck.strategy} />

      {deck.matchups && deck.matchups.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold text-[#2a6f97]">對戰思路</h2>
          <div className="mt-3 space-y-3">
            {deck.matchups.map((m) => (
              <div key={m.vs} className="rounded-lg border border-[#bfe3f5] bg-white p-4">
                <div className="font-bold text-[#2a6f97]">vs {m.vs}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{m.note}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </GuideLayout>
  );
}
```

- [ ] **Step 3: 瀏覽器驗證詳情頁**

（1）從 `/decks` 點入每套牌 → 標頭（tier／能量／難度）、20 張卡圖牌表與張數角標、攻略段落、對戰思路都正確；（2）開 `http://localhost:8080/decks/no-such-deck` → 顯示「找不到這套牌」＋返回連結；（3）用 `javascript_tool` 把一張卡圖 src 改成壞網址 → 占位卡背出現。console 無紅字。截圖詳情頁。

- [ ] **Step 4: Commit**

```bash
git add src/components/guide/Decklist.tsx src/routes/decks/\$deckId.tsx src/routeTree.gen.ts
git commit -m "feat: add deck detail page with decklist and strategy"
```

---

### Task 7: 首頁入口 + 全站驗證

**Files:**
- Modify: `src/routes/index.tsx`（波加曼頁加攻略站入口）

**Interfaces:**
- Consumes: route `/decks`（Task 5）
- Produces: 首頁右上角入口按鈕（z-40、pointer-events auto，不影響互動層）

- [ ] **Step 1: 首頁加入口按鈕**

在 `src/routes/index.tsx` 的 doodle-layer `</div>` 之後、`<Piplup />` 之前插入（doodle-layer 是 pointer-events-none，所以按鈕獨立放 z-40）：

```tsx
      {/* Guide entrance */}
      <Link
        to="/decks"
        className="fixed right-6 top-6 z-40 rounded-full border-2 border-[#2a6f97] bg-white/90 px-4 py-2 font-bold text-[#2a6f97] shadow-lg transition hover:scale-105"
        style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive", transform: "rotate(2deg)" }}
      >
        牌組攻略 →
      </Link>
```

並在檔頭加 `import { Link } from "@tanstack/react-router";`。

- [ ] **Step 2: 全站瀏覽器驗證**

（1）`/` 波加曼追逐／點擊／塗鴉全部照舊，右上角出現手繪風入口按鈕、可點；（2）按鈕 → `/decks` → 點牌組 → 詳情 → 導覽列回首頁，整圈導覽互通；（3）`resize_window` 到 mobile（375×812）：列表單欄、牌表 3 欄、無橫向捲軸；回 desktop 正常。截圖手機版牌表。

- [ ] **Step 3: 更新本計畫勾選並 Commit**

```bash
git add src/routes/index.tsx src/routeTree.gen.ts docs/superpowers/plans/2026-07-19-tcg-pocket-deck-guide.md
git commit -m "feat: add guide entrance on Piplup home page"
```

---

### Task 8: 同步到 Lovable（需使用者確認）

**Files:**
- Lovable 專案（project_id `979b3029-36fa-43ee-a9fa-719bf67f8c4e`）：新增與本地相同的檔案

**Interfaces:**
- Consumes: Tasks 2–7 完成的本地檔案
- Produces: Lovable 線上預覽與本地行為一致

- [ ] **Step 1: 向使用者確認要不要同步**

說明：同步會用 Lovable credits（逐檔 send_message）。使用者不同步就停在本地版，勾選註記後結束。

- [ ] **Step 2: 逐檔同步**

用 `send_message` 請 Lovable 建立與本地完全相同內容的檔案（`src/data/*`、`src/components/guide/*`、`src/routes/decks/*`、`src/routes/index.tsx` 的入口修改）。訊息中直接附上完整檔案內容並要求逐字寫入，不讓 Lovable 自由發揮。`cards.json` 也一併寫入。

- [ ] **Step 3: 線上預覽驗證**

開 Lovable preview URL 跑 Task 7 Step 2 的驗證清單；有差異就修到一致。

- [ ] **Step 4: 勾選完成**

計畫全部勾選；部署仍依前案（使用者說要才 deploy）。
