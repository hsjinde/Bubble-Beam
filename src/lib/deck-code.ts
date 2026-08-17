/**
 * Pokémon TCG Pocket 牌組匯入用「2 次元代碼」的編碼器。
 *
 * 遊戲在 2026-07-29 的更新加入了牌組 QR 分享：QR 裡裝的就是下面這段 base64 二進位，
 * 沒有簽章、沒有 checksum、沒有加密，所以能離線算出來。
 *
 * ── base64 之前的位元組佈局 ───────────────────────────────────────────────
 *   [ 訓練家卡段 ][ 寶可夢卡段 ][ 能量段 ]
 *
 *   每個卡段：1 byte 張數 N，接著 N × 3 bytes ＝ (deckBuilderNr × 10) 的 big-endian 24 bit。
 *            重複的卡就列多次；空的卡段是單獨一個 0x00。
 *   能量段：  1 byte 種類數（0–3），接著每種一個 id。
 *
 *   寶可夢與訓練家在遊戲裡是兩套各自從 1 開始的編號，所以訓練家一律 +1,000,000 來區分，
 *   並且排在第一段。`deckBuilderNr` 由上游素材檔名推出，見 scripts/fetch-cards.mjs。
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 格式來源：https://github.com/Nirostar/ptcgp-deck-qr（MIT License, © 2026 Nirostar）。
 * 這裡是照該專案的 `createDeckCode` 移植的最小實作——刻意不裝 `ptcgp-deckcode` 套件，
 * 因為它的 `loadDatabase()` 會在執行期打網路抓上游卡片資料庫，跟本站「資料在建置期烤進
 * src/data」的架構相衝。
 */
import type { EnergyType } from "@/data/types";

/**
 * 能量屬性 → 代碼裡的 id。
 *
 * 只有八種基本能量有 id：`EnergyType` 另外那兩個（Dragon／Colorless）在遊戲的能量選擇裡
 * 根本不存在——龍系牌組實際上是設定牠招式要的那幾種基本能量。所以這裡刻意不收，
 * 呼叫端遇到就得當「還不知道要設哪種能量」處理，不能硬塞一個 id 進去。
 */
export const ENERGY_CODE_ID = {
  Grass: 1,
  Fire: 2,
  Water: 3,
  Lightning: 4,
  Psychic: 5,
  Fighting: 6,
  Darkness: 7,
  Metal: 8,
} as const satisfies Partial<Record<EnergyType, number>>;

/** 能取得代碼 id 的八種能量。 */
export type CodableEnergy = keyof typeof ENERGY_CODE_ID;

/** 這個能量屬性能不能寫進代碼（Dragon／Colorless 不能）。 */
export function isCodableEnergy(energy: string): energy is CodableEnergy {
  return energy in ENERGY_CODE_ID;
}

/** 代碼裡訓練家卡的命名空間偏移。 */
export const TRAINER_OFFSET = 1_000_000;

/** 這個編號是不是訓練家卡（＝排在第一段）。 */
export function isTrainerNr(nr: number): boolean {
  return nr >= 100_000;
}

/** 一副牌最多能設定的能量種類數。 */
export const MAX_ENERGY_TYPES = 3;

/**
 * 把一副牌編成遊戲掃得動的 base64 代碼。
 *
 * @param deckBuilderNrs 每張卡一個編號，同一張卡有幾份就重複幾次。
 * @param energies       牌組要設定的能量，最多三種。
 */
export function createDeckCode(
  deckBuilderNrs: Iterable<number>,
  energies: readonly CodableEnergy[] = [],
): string {
  const nrs = [...deckBuilderNrs];
  if (nrs.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error("deckBuilderNrs 必須都是正整數");
  }
  if (energies.length > MAX_ENERGY_TYPES) {
    throw new Error(`最多 ${MAX_ENERGY_TYPES} 種能量，收到 ${energies.length} 種`);
  }

  // 升冪排序：掃描端不在意順序，但排序過的輸出才是穩定的——同一副牌永遠得到同一段代碼，
  // 生成檔才不會因為卡片順序變動而產生假 diff。
  const trainers = nrs.filter(isTrainerNr).sort((a, b) => a - b);
  const pokemon = nrs.filter((n) => !isTrainerNr(n)).sort((a, b) => a - b);

  const bytes: number[] = [];
  for (const group of [trainers, pokemon]) {
    bytes.push(group.length & 0xff);
    for (const nr of group) {
      const v = nr * 10;
      bytes.push((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
    }
  }
  bytes.push(energies.length & 0xff, ...energies.map((e) => ENERGY_CODE_ID[e]));

  return bytesToBase64(bytes);
}

// Buffer 只有 Node 有（腳本走這條），瀏覽器退回 btoa。
function bytesToBase64(bytes: number[]): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  return btoa(String.fromCharCode(...bytes));
}
