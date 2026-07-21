import { Link } from "@tanstack/react-router";

/**
 * 首頁左下角的 /decks 入口：一張半透明便條紙，頂端貼一條膠帶。
 * 傾斜用 Tailwind class 而非 inline style——inline transform 會蓋掉 hover 的轉正與浮起。
 */
export function GuideEntry() {
  return (
    <Link
      to="/decks"
      className="group fixed bottom-8 left-4 z-40 flex w-[10.5rem] -rotate-3 flex-col gap-1 rounded-[0.35rem] bg-white/55 px-4 py-3.5 shadow-[0_10px_26px_rgba(42,111,151,0.28)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:bg-white/70 sm:bottom-10 sm:left-8 sm:w-[14rem] sm:px-5 sm:py-5"
      style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
    >
      {/* 膠帶 */}
      <span
        className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] rounded-[2px] bg-guide-tint/70 sm:h-5 sm:w-20"
        style={{ boxShadow: "0 1px 3px rgba(42,111,151,0.2)" }}
      />
      <span className="text-lg font-bold text-guide-ink sm:text-2xl">牌組攻略</span>
      <span
        className="h-px w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(95,168,211,0.6) 0 6px, transparent 6px 12px)",
        }}
      />
      <span className="text-[0.7rem] leading-snug text-guide-ink/75 sm:text-sm">
        Top 20 即時排行
        <br />
        繁中牌組攻略
      </span>
      <span className="self-end text-sm text-guide-accent transition-transform duration-300 group-hover:translate-x-1 sm:text-base">
        →
      </span>
    </Link>
  );
}
