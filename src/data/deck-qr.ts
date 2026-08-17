import type { EnergyType } from "./types";
import raw from "./deck-qr.json" with { type: "json" };

export interface DeckQr {
  /** 遊戲掃描的 base64 代碼；圖檔裡裝的就是這串（留著方便排錯）。 */
  code: string;
  /** public/deck-qr/ 底下的檔名。 */
  file: string;
  /** 這張代碼會一併設定的能量。 */
  energy: EnergyType[];
}

const index = raw as Record<string, DeckQr>;

/**
 * 取排行榜牌組的匯入用 2 次元代碼，鍵是 Limitless 的英文牌組名。
 *
 * 回 undefined 代表那副牌還沒有能量設定（見 src/data/deck-energy.json）——
 * 每週換血後新上榜的牌組會有一小段空窗期，呼叫端要能接受「這一列沒有 QR」。
 */
export function getDeckQr(limitlessName: string): DeckQr | undefined {
  return index[limitlessName];
}
