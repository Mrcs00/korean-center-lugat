import { isoWeekday, shiftDateKey, startOfWeekKey } from "../utils/dates";
import type { Group, Lesson } from "./types";

export interface ScheduledLesson<G extends Group = Group> {
  group: G;
  date: string; // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  lesson: Lesson | null; // the saved lesson (topic / status), if any
}

/** Every lesson date of a group inside [from, to] (inclusive), from its weekday schedule. */
export function lessonDatesInRange(group: Group, from: string, to: string): string[] {
  if (group.status === "cancelled" || group.lesson_days.length === 0) return [];
  const dates: string[] = [];
  for (let d = from; d <= to; d = shiftDateKey(d, 1)) {
    if (!group.lesson_days.includes(isoWeekday(d))) continue;
    if (group.start_date && d < group.start_date) continue;
    if (group.end_date && d > group.end_date) continue;
    dates.push(d);
  }
  return dates;
}

/** Scheduled lessons of several groups in a date range, merged with the saved lesson rows. */
export function buildSchedule<G extends Group>(groups: G[], lessons: Lesson[], from: string, to: string): ScheduledLesson<G>[] {
  const byKey = new Map(lessons.map((l) => [`${l.group_id}|${l.lesson_date}`, l]));
  const out: ScheduledLesson<G>[] = [];
  for (const group of groups) {
    const planned = new Set(lessonDatesInRange(group, from, to));
    // a saved lesson on an unusual day (extra lesson) is shown too
    lessons.filter((l) => l.group_id === group.id && l.lesson_date >= from && l.lesson_date <= to).forEach((l) => planned.add(l.lesson_date));
    for (const date of planned) {
      const lesson = byKey.get(`${group.id}|${date}`) ?? null;
      if (lesson?.status === "cancelled") continue;
      out.push({
        group,
        date,
        start_time: lesson?.start_time ?? group.start_time,
        end_time: lesson?.end_time ?? group.end_time,
        lesson,
      });
    }
  }
  return out.sort((a, b) => (a.date + (a.start_time ?? "")).localeCompare(b.date + (b.start_time ?? "")));
}

export function weekRange(todayKey: string): { from: string; to: string } {
  const from = startOfWeekKey(todayKey);
  return { from, to: shiftDateKey(from, 6) };
}
