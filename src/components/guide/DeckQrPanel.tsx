import { getDeckQr } from "@/data/deck-qr";
import { EnergyIcon } from "./EnergyIcon";

/**
 * 牌組匯入用的 2 次元代碼。
 *
 * 圖是建置期就產好的靜態檔（scripts/generate-deck-qr.mjs → public/deck-qr/*.png），
 * 前端不帶任何 QR 函式庫；而且這個面板只在該列展開時才 render，未展開的列連圖都不會去要。
 *
 * 為什麼是 PNG 不是 inline SVG：遊戲可以從**相簿圖片**讀取代碼，而手機玩家跟遊戲在同一台
 * 裝置上、沒辦法掃自己的螢幕——他們一定得先長按存圖。存得下來的必須是點陣圖。
 *
 * 圖片本身自帶白底與留白（QR 的靜區），所以深色模式**不要**替它換底色或加 filter，
 * 反白的 QR 有些讀取器吃不到。
 */
export function DeckQrPanel({ deckName }: { deckName: string }) {
  const qr = getDeckQr(deckName);
  // 每週換血後新上榜的牌組還沒有能量設定，那幾列就沒有 QR（見 src/data/deck-energy.json）。
  // 這裡刻意留一行說明而不是直接消失：不然維護缺口只會出現在腳本的終端機輸出裡，沒人會再看。
  if (!qr) {
    return (
      <p className="mt-4 text-xs text-guide-ink-muted">
        這副牌還沒有匯入用 2 次元代碼（能量設定待補）。
      </p>
    );
  }

  return (
    <section className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-guide-tint bg-guide-bg-panel p-4 sm:flex-row sm:items-start">
      <img
        src={`/deck-qr/${qr.file}`}
        alt={`${deckName} 的牌組匯入用 2 次元代碼`}
        width={512}
        height={512}
        loading="lazy"
        className="h-40 w-40 shrink-0 rounded-lg border border-guide-tint sm:h-44 sm:w-44"
      />
      <div className="space-y-2 text-xs text-guide-ink-muted">
        <h4 className="text-sm font-bold text-guide-ink">掃碼把這副牌匯入遊戲</h4>
        <p>
          遊戲內選「我的牌組 → 新建牌組 → 讀取代碼」，直接掃描這張圖；
          用手機看本站時，長按存圖後改從相簿讀取。
        </p>
        <p className="flex flex-wrap items-center gap-1.5">
          <span>代碼會一併設定能量：</span>
          {qr.energy.map((energy) => (
            <EnergyIcon key={energy} type={energy} />
          ))}
        </p>
        <p>牌表中的卡片你要全部都已擁有，遊戲才建得起來；稀有度由遊戲自動挑選。</p>
      </div>
    </section>
  );
}
