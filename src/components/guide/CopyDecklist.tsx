import { useEffect, useRef, useState } from "react";
import type { DeckCard as DeckCardEntry } from "@/data/types";
import { getCard } from "@/data/cards";

type State = "idle" | "copied" | "failed";

/**
 * 把牌表複製成純文字。玩家要照著攻略在遊戲裡組牌時，總得一張一張對回去；
 * 有一份可貼的清單就能丟進記事本或聊天室。
 *
 * 卡名優先用英文（`nameEN`）——Limitless、遊戲內搜尋、其他玩家用的都是英文原名，
 * 繁中譯名只在本站出現，貼給別人反而對不上。
 */
export function CopyDecklist({ cards, deckName }: { cards: DeckCardEntry[]; deckName: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 元件在提示還沒消失前被卸載（例如切到別套牌）時要清掉，否則會對已卸載的元件 setState
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const flash = (next: State) => {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  const text = [
    deckName,
    "",
    ...cards.map((c) => {
      const entry = getCard(c.id);
      return `${c.count}× ${entry?.nameEN ?? c.id} (${c.id})`;
    }),
    "",
    `共 ${cards.reduce((n, c) => n + c.count, 0)} 張`,
  ].join("\n");

  async function copy() {
    try {
      // navigator.clipboard 需要安全語境（https／localhost）；不可用時直接報失敗，
      // 不要退回已棄用的 document.execCommand，那在多數瀏覽器已經無效。
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      flash("failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-guide-tint bg-guide-surface px-4 text-sm font-semibold whitespace-nowrap text-guide-ink transition hover:border-guide-accent hover:bg-guide-bg"
      >
        複製牌表文字
      </button>
      {/* 狀態變化要播報給螢幕報讀者，否則只有看得見的人知道複製成功 */}
      <span
        aria-live="polite"
        className={`text-sm ${state === "failed" ? "text-red-700 dark:text-red-400" : "text-guide-ink"}`}
      >
        {state === "copied" && "已複製到剪貼簿"}
        {state === "failed" && "複製失敗，請手動選取"}
      </span>
    </div>
  );
}
