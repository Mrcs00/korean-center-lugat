import { computeBilling, type Billing } from "./billing";
import type { GroupFull } from "./api";
import type { Payment } from "./types";
import { tashkentDateKey } from "../utils/dates";

/** Monthly price of a group: its own price, else its course price, else 0. */
export function groupPrice(g: Pick<GroupFull, "monthly_price" | "course">): number {
  return Number(g.monthly_price ?? g.course?.monthly_price ?? 0);
}

/**
 * Billing of one student in one group.
 * `payments` are all of that student's payments; payments with no group are
 * counted towards the group only if the student has just that one group.
 */
export function billingForMembership(opts: {
  group: GroupFull;
  joinedAt: string; // timestamptz of joining
  payments: Payment[];
  onlyGroup: boolean;
  dueDay: number;
  today?: string;
}): Billing {
  const { group, joinedAt, payments, onlyGroup, dueDay } = opts;
  const today = opts.today ?? tashkentDateKey();
  const joined = joinedAt.slice(0, 10);
  const start = group.start_date && group.start_date > joined ? group.start_date : joined;
  return computeBilling({
    monthlyPrice: groupPrice(group),
    startKey: start,
    todayKey: today,
    dueDay,
    payments: payments.filter((p) => p.group_id === group.id || (p.group_id === null && onlyGroup)),
  });
}
