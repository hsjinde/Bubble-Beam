import { useEffect, useState } from "react";
import {
  EVENT_TYPE_LABEL,
  activeEvents,
  daysUntil,
  eventsUpdatedAt,
  setsNewestFirst,
} from "@/data/schedule";
import type { GameEvent } from "@/data/schedule";

/**
 * 行事曆：上段是人工維護的活動（進行中／即將開始），下段是自動生成的歷代擴充包時間軸。
 *
 * 「現在」只在掛載後才取得。伺服器端與瀏覽器端各自呼叫 Date.now() 必然得到不同結果，
 * 任何依賴它的算繪（倒數、進行中判定）都會造成 hydration mismatch；所以 SSR 階段
 * 一律不畫時間相關的內容，等 useEffect 之後再補上。歷代時間軸沒有這個問題，
 * 照常在伺服器端算繪，讓搜尋引擎與關閉 JS 的使用者都拿得到。
 */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    // 每分鐘更新一次就夠——顯示粒度只到「天」
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * 以「觀看者所在時區」的日曆日呈現。不要直接切 ISO 字串前 10 碼——那是 UTC 日期，
 * 會和 daysUntil()（用當地午夜計算）差一天，出現「寫著 7/29 結束卻說還有 6 天」。
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function EventCard({ event, now }: { event: GameEvent; now: number }) {
  const days = daysUntil(event.endAt ?? event.startAt, now);
  const isUpcoming = Date.parse(event.startAt) > now;
  return (
    <li className="rounded-xl border border-guide-tint bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-guide-tint px-2.5 py-0.5 text-xs font-bold text-guide-ink-deep">
          {EVENT_TYPE_LABEL[event.type]}
        </span>
        <span className="rounded-full bg-guide-ink px-2.5 py-0.5 text-xs font-bold text-white">
          {isUpcoming
            ? days <= 0
              ? "即將開始"
              : `${days} 天後開始`
            : days <= 0
              ? "今天結束"
              : `還有 ${days} 天`}
        </span>
      </div>
      <h3 className="mt-2 font-bold text-guide-ink">
        {event.title}
        {event.titleTC && (
          <span className="ml-1.5 font-normal text-slate-600">（{event.titleTC}）</span>
        )}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {formatDate(event.startAt)}
        {event.endAt ? ` – ${formatDate(event.endAt)}` : " 發售"}
      </p>
      {event.note && <p className="mt-2 text-sm leading-relaxed text-slate-700">{event.note}</p>}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-guide-ink underline underline-offset-4"
        >
          資料來源
        </a>
      )}
    </li>
  );
}

export function ScheduleBoard() {
  const now = useNow();
  const timeline = setsNewestFirst();
  const { upcoming, ongoing } = now ? activeEvents(now) : { upcoming: [], ongoing: [] };

  return (
    <>
      <section>
        <h2 className="border-l-4 border-guide-accent pl-3 text-xl font-bold text-guide-ink">
          進行中與即將開始
        </h2>

        {/* now === null 代表還在伺服器端／尚未掛載，先留一句佔位，避免版面跳動 */}
        {now === null ? (
          <p className="mt-3 text-sm text-slate-600">載入中…</p>
        ) : upcoming.length + ongoing.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-guide-tint bg-guide-bg-panel p-6 text-sm text-slate-600">
            目前沒有進行中或即將開始的活動。這份清單是人工維護的（最後更新 {eventsUpdatedAt}
            ），可能還沒跟上遊戲內的最新公告。
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[...ongoing, ...upcoming].map((e) => (
              <EventCard key={e.id} event={e} now={now} />
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-slate-600">
          活動清單為人工維護，最後更新 {eventsUpdatedAt}；每筆都附資料來源可查證。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="border-l-4 border-guide-accent pl-3 text-xl font-bold text-guide-ink">
          歷代擴充包
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          共 {timeline.length} 個擴充包，資料來自社群卡片資料庫，隨上游自動更新。
          繁中彈名上游只提供最早那幾個，其餘保留英文原名。
        </p>
        <ol className="mt-4 space-y-2">
          {timeline.map((s) => (
            <li
              key={s.code}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-guide-tint bg-white px-4 py-3"
            >
              <span className="w-20 shrink-0 text-sm font-semibold text-slate-600">
                {s.releaseDate.replace(/-/g, "/")}
              </span>
              <span className="rounded-full bg-guide-tint px-2 py-0.5 text-xs font-bold text-guide-ink-deep">
                {s.code}
              </span>
              <span className="font-semibold text-guide-ink">
                {s.nameEN}
                {s.nameTC && (
                  <span className="ml-1.5 font-normal text-slate-600">（{s.nameTC}）</span>
                )}
              </span>
              {typeof s.count === "number" && (
                <span className="text-sm text-slate-600">{s.count} 張</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
