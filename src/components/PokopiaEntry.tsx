import { Link } from "@tanstack/react-router";

/**
 * 首頁左下角的 /pokopia 入口：GuideEntry 的暖色雙生，堆在牌組攻略便條紙上方，
 * 反向傾斜營造「兩張便利貼並貼」的手感。傾斜用 class（inline transform 會蓋掉 hover）。
 */
export function PokopiaEntry() {
  return (
    <Link
      to="/pokopia"
      aria-label="前往 Pokémon Pokopia 建築指南"
      className="group fixed bottom-[9.5rem] left-4 z-40 flex w-[10.5rem] rotate-2 flex-col gap-1 rounded-[0.35rem] bg-[#fffdf9]/80 px-4 py-3.5 shadow-[0_10px_26px_rgba(74,55,40,0.26)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:rotate-0 hover:bg-[#fffdf9]/95 sm:bottom-[13rem] sm:left-8 sm:w-[14rem] sm:px-5 sm:py-5"
      style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
    >
      {/* 膠帶 */}
      <span
        className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 -translate-y-1/2 rotate-[4deg] rounded-[2px] bg-[#e8b4a8]/80 sm:h-5 sm:w-20"
        style={{ boxShadow: "0 1px 3px rgba(74,55,40,0.2)" }}
      />
      <span className="text-lg font-bold text-[#4a3728] sm:text-2xl">Pokopia 建築</span>
      <span
        className="h-px w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(163,95,31,0.55) 0 6px, transparent 6px 12px)",
        }}
      />
      <span className="text-[0.7rem] leading-snug text-[#6f5844] sm:text-sm">
        45 種建築一覽
        <br />
        搭配靈感與主題選集
      </span>
      <span className="self-end text-sm text-[#6f5844] transition-transform duration-300 group-hover:translate-x-1 sm:text-base">
        →
      </span>
    </Link>
  );
}
