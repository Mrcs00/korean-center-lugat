"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS_UZ, WEEKDAYS_SHORT } from "@/lib/platform/labels";
import { daysInMonth, isoWeekday, shiftMonth } from "@/lib/utils/dates";

export interface DayMark {
  tone: "green" | "amber" | "red" | "blue" | "gray";
  title?: string;
}

const TONE: Record<DayMark["tone"], string> = {
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  red: "bg-red-soft text-red",
  blue: "bg-blue-soft text-blue",
  gray: "bg-black/[0.06] text-muted",
};

// A month grid (Monday first). `marks` colours the days that have something.
export function MonthCalendar({
  period,
  onPeriodChange,
  marks,
  today,
}: {
  period: string; // YYYY-MM
  onPeriodChange: (p: string) => void;
  marks: Record<string, DayMark>; // YYYY-MM-DD -> mark
  today: string;
}) {
  const [y, m] = period.split("-").map(Number);
  const offset = isoWeekday(`${period}-01`) - 1;
  const total = daysInMonth(period);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold">
          {MONTHS_UZ[m - 1]} {y}
        </p>
        <div className="flex gap-1.5">
          <button onClick={() => onPeriodChange(shiftMonth(period, -1))} aria-label="Oldingi oy" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-black/[0.04]">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => onPeriodChange(shiftMonth(period, 1))} aria-label="Keyingi oy" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-black/[0.04]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-muted-soft pb-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const key = `${period}-${String(day).padStart(2, "0")}`;
          const mark = marks[key];
          return (
            <div
              key={key}
              title={mark?.title}
              className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold ${mark ? TONE[mark.tone] : "text-muted"} ${key === today ? "ring-2 ring-brand-dark" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
