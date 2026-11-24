import { allMemberships, listGroups, listPayments, listProfiles } from "./api";
import { billingForMembership } from "./billingFor";
import type { Payment, Profile } from "./types";

export interface Debtor {
  profile: Profile;
  debt: number;
  groups: string[];
  lastPaid: string | null;
}

/** Students who owe money, with how much (admin: needs to read every payment). */
export async function loadDebtors(dueDay: number): Promise<{ debtors: Debtor[]; payments: Payment[] }> {
  const [groups, members, payments, students] = await Promise.all([listGroups(), allMemberships(), listPayments(), listProfiles("student")]);
  const debtors: Debtor[] = [];
  for (const student of students) {
    if (student.status !== "active") continue;
    const mine = members.filter((m) => m.student_id === student.id);
    const myPayments = payments.filter((p) => p.student_id === student.id);
    let debt = 0;
    const names: string[] = [];
    for (const m of mine) {
      const group = groups.find((g) => g.id === m.group_id);
      if (!group || group.status === "cancelled") continue;
      const b = billingForMembership({ group, joinedAt: m.joined_at, payments: myPayments, onlyGroup: mine.length === 1, dueDay });
      if (b.debt > 0) {
        debt += b.debt;
        names.push(group.name);
      }
    }
    if (debt > 0) debtors.push({ profile: student, debt, groups: names, lastPaid: myPayments.filter((p) => p.status === "paid")[0]?.paid_at ?? null });
  }
  return { debtors: debtors.sort((a, b) => b.debt - a.debt), payments };
}
