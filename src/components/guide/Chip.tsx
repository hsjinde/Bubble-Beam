import type { ReactNode } from "react";

/**
 * 攻略站的篩選晶片。排行榜與精選攻略兩區共用同一顆——它們原本各寫一份，
 * 結果不只樣式要對兩次，連「選取」的語意都漂掉了（一邊單選一邊多選）。
 *
 * min-h-9（36px）比全站 44px 的觸控底線矮：這是次要的密集控制列，一排最多九顆，
 * 撐到 44px 會把篩選區推得比結果還高。WCAG 2.2 AA 的目標尺寸下限是 24px，仍然過關。
 */
export function Chip({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition ${
        active
          ? "bg-guide-ink text-guide-on-ink shadow-sm"
          : "border border-guide-tint bg-guide-surface text-guide-ink hover:border-guide-accent"
      }`}
    >
      {children}
    </button>
  );
}
