// All "which day is it" logic uses Tashkent time (UTC+5, no daylight saving).
const TZ = "Asia/Tashkent";
const keyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" for the given moment, in Tashkent. */
export function tashkentDateKey(date: Date = new Date()): string {
  return keyFormatter.format(date);
}

/** Moves a "YYYY-MM-DD" key by whole calendar days (negative = back). */
export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 1 = Monday … 7 = Sunday for a "YYYY-MM-DD" key. */
export function isoWeekday(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

/** Monday of the week containing the given day. */
export function startOfWeekKey(key: string): string {
  return shiftDateKey(key, 1 - isoWeekday(key));
}

/** "YYYY-MM" of a day key. */
export function monthOfKey(key: string): string {
  return key.slice(0, 7);
}

export function shiftMonth(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(period: string): number {
  const [y, m] = period.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
