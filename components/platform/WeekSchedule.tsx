"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS_FULL } from "@/lib/platform/labels";
import { formatDate, timeRange } from "@/lib/platform/format";
import { shiftDateKey } from "@/lib/utils/dates";
import type { ScheduledLesson } from "@/lib/platform/schedule";
import type { Group } from "@/lib/platform/types";

// A Monday-to-Sunday week of lessons. `subtitle` adds a line to each lesson.
export function WeekSchedule<G extends Group>({
  weekStart,
  onWeekChange,
  lessons,
  today,
  subtitle,
  onLessonClick,
}: {
  weekStart: string; // the Monday, YYYY-MM-DD
  onWeekChange: (start: string) => void;
  lessons: ScheduledLesson<G>[];
  today: string;
  subtitle?: (l: ScheduledLesson<G>) => string;
  onLessonClick?: (l: ScheduledLesson<G>) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDateKey(weekStart, i));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold">
          {formatDate(weekStart)} – {formatDate(shiftDateKey(weekStart, 6))}
        </p>
        <div className="flex gap-1.5">
          <button onClick={() => onWeekChange(shiftDateKey(weekStart, -7))} aria-label="Oldingi hafta" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-black/[0.04]">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => onWeekChange(today)} className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-black/[0.04]">
            Bugun
          </button>
          <button onClick={() => onWeekChange(shiftDateKey(weekStart, 7))} aria-label="Keyingi hafta" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-black/[0.04]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-7 gap-3">
        {days.map((d, i) => {
          const list = lessons.filter((l) => l.date === d);
          return (
            <div key={d} className={`rounded-2xl border p-3 min-h-[7rem] ${d === today ? "border-brand-dark bg-brand-tint" : "border-border bg-surface"}`}>
              <p className="text-xs font-bold mb-2">
                {WEEKDAYS_FULL[i]} <span className="text-muted font-medium">{d.slice(8)}</span>
              </p>
              <div className="flex flex-col gap-2">
                {list.length === 0 && <p className="text-[11px] text-muted-soft">Dars yo&apos;q</p>}
                {list.map((l) => (
                  <button
                    key={`${l.group.id}${l.date}`}
                    onClick={onLessonClick ? () => onLessonClick(l) : undefined}
                    className={`text-left rounded-xl bg-brand-soft px-2.5 py-2 ${onLessonClick ? "hover:brightness-95" : "cursor-default"}`}
                  >
                    <p className="text-[11px] font-bold">{timeRange(l.start_time, l.end_time) || "—"}</p>
                    <p className="text-xs font-semibold truncate">{l.group.name}</p>
                    {subtitle && <p className="text-[11px] text-muted truncate">{subtitle(l)}</p>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
