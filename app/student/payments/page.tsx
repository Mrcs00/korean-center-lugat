"use client";

import { Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, Page, PageHeader, Panel, Spinner, StatCard } from "@/components/platform/ui";
import { useSettings } from "@/lib/platform/settings";
import { useMyGroups, useMyPayments } from "@/lib/platform/hooks";
import { billingForMembership, groupPrice } from "@/lib/platform/billingFor";
import { PAYMENT_METHODS } from "@/lib/platform/labels";
import { formatDate, formatMoney, formatPeriod } from "@/lib/platform/format";
import type { PeriodStatus } from "@/lib/platform/billing";

const PERIOD: Record<PeriodStatus, { label: string; tone: "green" | "amber" | "red" | "blue" | "gray" }> = {
  paid: { label: "To'langan", tone: "green" },
  partial: { label: "Qisman", tone: "amber" },
  pending: { label: "Kutilmoqda", tone: "blue" },
  debt: { label: "Qarzdor", tone: "red" },
  upcoming: { label: "Kelgusi", tone: "gray" },
};

export default function StudentPaymentsPage() {
  const { settings } = useSettings();
  const { groups, loading: gl, error } = useMyGroups();
  const { payments, loading: pl, error: pe } = useMyPayments();

  const billings = groups.map((g) => ({ g, b: billingForMembership({ group: g, joinedAt: g.joined_at, payments, onlyGroup: groups.length === 1, dueDay: settings.payment_due_day }) }));
  const debt = billings.reduce((s, x) => s + x.b.debt, 0);
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const nextDue = billings.map((x) => x.b.nextDue).filter(Boolean).sort()[0] ?? null;
  const status = debt > 0 ? "debt" : billings.some((x) => x.b.status === "pending") ? "pending" : "paid";

  return (
    <AppShell>
      <Page>
        <PageHeader title="To'lovlar" subtitle="To'lov holati va tarixi" />
        {(error || pe) && <ErrorNote message={(error ?? pe) as string} />}
        {gl || pl ? (
          <Spinner />
        ) : groups.length === 0 && payments.length === 0 ? (
          <EmptyState icon={Wallet} title="To'lov ma'lumoti yo'q" text="Guruhga qo'shilgach to'lov holatingiz shu yerda ko'rinadi." />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Wallet} label="Holat" value={status === "paid" ? "To'langan" : status === "debt" ? "Qarzdor" : "Kutilmoqda"} tone={status === "paid" ? "green" : status === "debt" ? "red" : "amber"} />
              <StatCard icon={Wallet} label="Jami to'langan" value={formatMoney(totalPaid)} tone="green" />
              <StatCard icon={Wallet} label="Qarzdorlik" value={formatMoney(debt)} tone={debt > 0 ? "red" : "gray"} />
              <StatCard icon={Wallet} label="Keyingi to'lov sanasi" value={nextDue ? formatDate(nextDue) : "—"} tone="blue" />
            </div>

            {billings.map(({ g, b }) => (
              <Panel key={g.id} title={`${g.course?.name ?? g.name} · oyiga ${groupPrice(g) ? formatMoney(groupPrice(g)) : "narx belgilanmagan"}`}>
                {b.periods.length === 0 ? (
                  <p className="text-sm text-muted">Hisob-kitob hali boshlanmagan.</p>
                ) : (
                  <div className="flex flex-col">
                    {[...b.periods].reverse().map((p) => (
                      <div key={p.period} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                        <span className="w-32 shrink-0 font-semibold text-sm">{formatPeriod(p.period)}</span>
                        <span className="flex-1 text-sm text-muted">
                          {formatMoney(p.paid)} / {formatMoney(p.owed)}
                        </span>
                        <Badge tone={PERIOD[p.status].tone}>{PERIOD[p.status].label}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            ))}

            <Panel title="To'lovlar tarixi">
              {payments.length === 0 ? (
                <p className="text-sm text-muted">Hali to&apos;lov kiritilmagan.</p>
              ) : (
                <div className="flex flex-col">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="w-24 shrink-0 text-sm font-bold">{formatDate(p.paid_at)}</span>
                      <span className="flex-1 min-w-0 text-sm text-muted truncate">
                        {PAYMENT_METHODS[p.method]} · {formatPeriod(p.period)}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                      <span className="font-bold text-sm">{formatMoney(p.amount)}</span>
                      <Badge tone={p.status === "paid" ? "green" : "amber"}>{p.status === "paid" ? "To'langan" : "Kutilmoqda"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </Page>
    </AppShell>
  );
}
