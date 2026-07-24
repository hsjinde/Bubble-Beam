import type { ReactNode } from "react";

/**
 * 攻略站的區段標題。
 *
 * 原本各頁自己寫「左側 4px 粗色條 ＋ 左內距」（left border 當強調）。那是最好認的
 * AI 生成介面特徵之一（同一招也常出現在卡片、提示框、警告框上），而且它只裝飾了「標題
 * 那一行」，並沒有真的把版面切開。同時 /decks 的「精選牌組攻略」又漏掉了色條，同一站
 * 出現兩種區段標題。
 *
 * 改成整欄寬的下緣細分隔線：這是排版上真正的區段分隔手法，用的也是 DeckPager 上緣
 * 分隔線的同一個既有 token（guide-tint），不另立新色。
 *
 * 想改樣式就改這裡，不要回頭在個別頁面覆寫，否則又會漂回「每頁長得不一樣」。
 * 標題底下第一塊內容的間距慣例是 mt-4（呼叫端負責），四個區段才會有一致的起手節奏。
 */
export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`border-b border-guide-tint pb-2 text-xl font-bold text-guide-ink ${className}`}>
      {children}
    </h2>
  );
}
