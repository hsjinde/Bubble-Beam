import type { Deck } from "./types";
import { getCard } from "./cards";

/**
 * 推導牌組的「門面卡」——列表縮圖與 OG 分享圖用。
 *
 * **不要用 `deck.cards[0]`**：牌表是照進化線排的，第一張通常是進化前的小卡，
 * 所以「Mega火焰雞ex 甲賀忍蛙」的縮圖會變成一隻火稚雞。
 *
 * 規則：Mega 優先 → 帶 ex → 退回第一張。Mega 一定是牌組的門面，所以排最前面；
 * 21 套策展牌組實測 20 套推導正確，剩下那套（牌表同時有 Mega Absol ex 與
 * Mega Sableye ex，而 Absol 排在前面）用 `deck.heroCardId` 明確覆寫。
 */
export function getHeroCardId(deck: Deck): string {
  if (deck.heroCardId) return deck.heroCardId;
  const nameOf = (id: string) => getCard(id)?.nameEN ?? "";
  return (
    deck.cards.find((c) => nameOf(c.id).startsWith("Mega"))?.id ??
    deck.cards.find((c) => / ex$/.test(nameOf(c.id)))?.id ??
    deck.cards[0].id
  );
}
