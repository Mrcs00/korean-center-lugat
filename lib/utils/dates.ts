// All "which day is it" logic uses Tashkent time (UTC+5, no daylight saving).
// Using the UTC date instead moved midnight to 05:00 local time, which broke
// streaks and the daily goal for anyone studying early in the morning.

const TZ = "Asia/Tashkent";
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for the given moment, in Tashkent. */
export function tashkentDateKey(date: Date = new Date()): string {
  return formatter.format(date);
}

/** Moves a "YYYY-MM-DD" key by whole calendar days (negative = back). */
export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
