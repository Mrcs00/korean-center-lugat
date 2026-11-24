import { monthOfKey, shiftMonth } from "../utils/dates";
import type { Payment } from "./types";

export type PeriodStatus = "paid" | "partial" | "pending" | "debt" | "upcoming";

export interface BillingPeriod {
  period: string; // YYYY-MM
  owed: number;
  paid: number;
  status: PeriodStatus;
}

export interface Billing {
  periods: BillingPeriod[];
  totalOwed: number;
  totalPaid: number;
  debt: number; // overdue amount
  status: "paid" | "pending" | "debt";
  nextDue: string | null; // YYYY-MM-DD of the first unpaid period's due date
}

/**
 * How much a student owes for a group.
 *
 * Each month from the month they joined (or the group started) up to the
 * current month costs `monthlyPrice`. A month is "debt" once its due day has
 * passed without being fully paid; before that it is just "pending".
 * Only payments with status "paid" count.
 */
export function computeBilling(input: {
  monthlyPrice: number;
  startKey: string; // first day billing starts (joined date / group start), YYYY-MM-DD
  todayKey: string;
  dueDay: number; // day of the month payments are due
  payments: Pick<Payment, "amount" | "period" | "status">[];
}): Billing {
  const { monthlyPrice, startKey, todayKey, dueDay, payments } = input;
  const currentPeriod = monthOfKey(todayKey);
  const firstPeriod = monthOfKey(startKey) > currentPeriod ? currentPeriod : monthOfKey(startKey);

  const paidByPeriod = new Map<string, number>();
  payments.filter((p) => p.status === "paid").forEach((p) => paidByPeriod.set(p.period, (paidByPeriod.get(p.period) ?? 0) + Number(p.amount)));

  const periods: BillingPeriod[] = [];
  for (let period = firstPeriod; period <= currentPeriod; period = shiftMonth(period, 1)) {
    const paid = paidByPeriod.get(period) ?? 0;
    const dueKey = `${period}-${String(Math.min(dueDay, 28)).padStart(2, "0")}`;
    let status: PeriodStatus;
    if (monthlyPrice <= 0 || paid >= monthlyPrice) status = "paid";
    else if (todayKey > dueKey) status = "debt";
    else status = paid > 0 ? "partial" : "pending";
    periods.push({ period, owed: monthlyPrice, paid, status });
  }

  // money paid for months outside the range (advance payments) still counts as paid
  const totalPaid = Array.from(paidByPeriod.values()).reduce((a, b) => a + b, 0);
  const debt = periods.filter((p) => p.status === "debt").reduce((s, p) => s + Math.max(0, p.owed - p.paid), 0);
  const unpaid = periods.find((p) => p.status !== "paid");
  const nextDue = unpaid ? `${unpaid.period}-${String(Math.min(dueDay, 28)).padStart(2, "0")}` : null;

  return {
    periods,
    totalOwed: periods.reduce((s, p) => s + p.owed, 0),
    totalPaid,
    debt,
    status: debt > 0 ? "debt" : periods.some((p) => p.status !== "paid") ? "pending" : "paid",
    nextDue,
  };
}
