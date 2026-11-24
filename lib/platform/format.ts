import { MONTHS_UZ } from "./labels";

export function formatMoney(n: number | null | undefined): string {
  const value = Math.round(Number(n ?? 0));
  return `${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
}

export function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS_UZ[m - 1]} ${y}`;
}

/** "2026-11-19" -> "19.11.2026" */
export function formatDate(key: string | null | undefined): string {
  if (!key) return "—";
  const [y, m, d] = key.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

const tashkentTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});

/** ISO timestamp -> "19.11.2026 14:30" (Tashkent) */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = Object.fromEntries(tashkentTime.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

/** "14:30:00" -> "14:30" */
export function formatTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}

export function timeRange(start: string | null, end: string | null): string {
  if (!start) return "";
  return end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
}

export function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function plural(n: number, one: string): string {
  return `${n} ta ${one}`;
}

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Relative day hint for a deadline: "Bugun", "Ertaga", "3 kun qoldi", "2 kun o'tdi" */
export function deadlineHint(dueIso: string | null, now: Date = new Date()): string {
  if (!dueIso) return "Muddatsiz";
  const ms = new Date(dueIso).getTime() - now.getTime();
  const days = Math.ceil(ms / 86400000);
  if (ms < 0) return `${Math.max(1, Math.ceil(-ms / 86400000))} kun o'tdi`;
  if (days <= 1) return "Bugun";
  if (days === 2) return "Ertaga";
  return `${days} kun qoldi`;
}

/** "2026-11-19T14:30" typed in a datetime-local box (Tashkent time) -> ISO timestamp. */
export function tashkentInputToIso(value: string): string | null {
  return value ? new Date(`${value}:00+05:00`).toISOString() : null;
}

/** ISO timestamp -> value for a datetime-local box in Tashkent time. */
export function isoToTashkentInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = Object.fromEntries(tashkentTime.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fileSizeLabel(bytes: number | undefined): string {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
