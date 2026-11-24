"use client";

import { useState } from "react";
import { ErrorNote, FilterChips, Page, PageHeader, Panel, Spinner, StatCard, Field, Input, useLoad } from "@/components/platform/ui";
import { BarChart, Donut, LineChart } from "@/components/platform/charts";
import { attendanceRate, listAttendance, listHomework, listPayments, listProfiles, listSubmissions, type GroupFull } from "@/lib/platform/api";
import { ATTENDANCE, MONTHS_UZ, PAYMENT_METHODS } from "@/lib/platform/labels";
import { formatMoney, percent } from "@/lib/platform/format";
import { shiftDateKey, startOfWeekKey, tashkentDateKey } from "@/lib/utils/dates";
import { CalendarCheck, ClipboardList, GraduationCap, Wallet } from "lucide-react";
import type { AttendanceStatus } from "@/lib/platform/types";
import type { StaffRole } from "@/lib/platform/staff";

type Range = "today" | "week" | "month" | "year" | "custom";
const TONE_COLOR: Record<string, string> = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)", blue: "var(--blue)" };

export function StatisticsView({ role, groups, loading }: { role: StaffRole; groups: GroupFull[]; loading: boolean }) {
  const today = tashkentDateKey();
  const [range, setRange] = useState<Range>("month");
  const [custom, setCustom] = useState({ from: shiftDateKey(today, -30), to: today });

  const { from, to } = ((): { from: string; to: string } => {
    if (range === "today") return { from: today, to: today };
    if (range === "week") return { from: startOfWeekKey(today), to: today };
    if (range === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
    if (range === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
    return custom;
  })();

  const ids = groups.map((g) => g.id);
  const key = `${ids.join(",")}|${from}|${to}`;
  const att = useLoad(() => listAttendance({ groupIds: ids, from, to }), [key]);
  const hw = useLoad(() => listHomework(ids), [ids.join(",")]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const students = useLoad(() => (role === "admin" ? listProfiles("student") : Promise.resolve([])), [role]);
  const payments = useLoad(() => (role === "admin" ? listPayments() : Promise.resolve([])), [role]);

  const rows = att.data ?? [];
  const byStatus = (Object.keys(ATTENDANCE) as AttendanceStatus[]).map((s) => ({ label: ATTENDANCE[s].label, value: rows.filter((r) => r.status === s).length, color: TONE_COLOR[ATTENDANCE[s].tone] }));
  const byGroup = groups.map((g) => { const r = rows.filter((x) => x.lesson?.group_id === g.id); return { label: g.name.slice(0, 9), value: r.length ? attendanceRate(r) : 0 }; });

  const inRange = (iso: string | null) => (iso ? iso.slice(0, 10) >= from && iso.slice(0, 10) <= to : false);
  const hwInRange = (hw.data ?? []).filter((h) => (h.due_at ? inRange(h.due_at) : inRange(h.created_at)));
  const subList = (subs.data ?? []).filter((s) => hwInRange.some((h) => h.id === s.homework_id) && s.status !== "draft");
  const graded = subList.filter((s) => s.status === "graded" && s.score !== null);
  const avgScore = graded.length ? Math.round(graded.reduce((a, s) => a + ((s.score ?? 0) / (hwInRange.find((h) => h.id === s.homework_id)?.points || 100)) * 100, 0) / graded.length) : null;
  const hwByGroup = groups.map((g) => { const hs = hwInRange.filter((h) => h.group_id === g.id); const s = subList.filter((x) => hs.some((h) => h.id === x.homework_id)); return { label: g.name.slice(0, 9), value: hs.length ? Math.min(100, percent(s.length, hs.length * Math.max(1, g.memberCount))) : 0 }; });

  const paid = (payments.data ?? []).filter((p) => p.status === "paid" && inRange(p.paid_at));
  const revenue = paid.reduce((s, p) => s + Number(p.amount), 0);
  const methods = (Object.keys(PAYMENT_METHODS) as (keyof typeof PAYMENT_METHODS)[]).map((m, i) => ({ label: PAYMENT_METHODS[m], value: paid.filter((p) => p.method === m).length, color: ["var(--green)", "var(--blue)", "var(--amber)", "var(--brand-darker)", "var(--muted-soft)"][i] })).filter((m) => m.value > 0);
  const monthly = Array.from({ length: 12 }, (_, i) => { const m = `${today.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`; return { label: MONTHS_UZ[i].slice(0, 3), value: (payments.data ?? []).filter((p) => p.status === "paid" && p.paid_at.slice(0, 7) === m).reduce((s, p) => s + Number(p.amount), 0) }; });
  const newStudents = (students.data ?? []).filter((s) => inRange(s.created_at)).length;

  const busy = loading || att.loading || hw.loading;

  return (
    <Page wide>
      <PageHeader title="Statistika" subtitle={`${from} — ${to}`} />
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <FilterChips<Range> value={range} onChange={setRange} options={[{ id: "today", label: "Bugun" }, { id: "week", label: "Hafta" }, { id: "month", label: "Oy" }, { id: "year", label: "Yil" }, { id: "custom", label: "Sana oralig'i" }]} />
        {range === "custom" && (
          <>
            <Field label="Dan"><Input type="date" value={custom.from} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))} /></Field>
            <Field label="Gacha"><Input type="date" value={custom.to} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))} /></Field>
          </>
        )}
      </div>
      {(att.error || hw.error) && <ErrorNote message={(att.error ?? hw.error) as string} />}
      {busy ? <Spinner /> : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={CalendarCheck} label="O'rtacha davomat" value={rows.length ? `${attendanceRate(rows)}%` : "—"} tone="green" />
            <StatCard icon={ClipboardList} label="Topshirilgan vazifalar" value={subList.length} tone="blue" />
            <StatCard icon={ClipboardList} label="Vazifa o'rtacha bali" value={avgScore === null ? "—" : `${avgScore}%`} tone="amber" />
            {role === "admin" ? <StatCard icon={Wallet} label="Daromad" value={formatMoney(revenue)} tone="green" /> : <StatCard icon={GraduationCap} label="Belgilangan darslar" value={new Set(rows.map((r) => r.lesson_id)).size} tone="brand" />}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Davomat tarkibi">{rows.length === 0 ? <p className="text-sm text-muted">Bu davrda davomat belgilanmagan.</p> : <Donut data={byStatus} />}</Panel>
            <Panel title="Guruhlar bo'yicha davomat (%)">{groups.length === 0 ? <p className="text-sm text-muted">Guruh yo&apos;q.</p> : <BarChart data={byGroup} format={(n) => `${n}%`} />}</Panel>
            <Panel title="Vazifa topshirish (%)">{groups.length === 0 ? <p className="text-sm text-muted">Guruh yo&apos;q.</p> : <BarChart data={hwByGroup} color="var(--blue)" format={(n) => `${n}%`} />}</Panel>
            {role === "admin" && <Panel title="Yangi o'quvchilar">
              <p className="text-3xl font-extrabold">{newStudents}</p><p className="text-xs text-muted">shu davrda ro&apos;yxatdan o&apos;tgan</p>
            </Panel>}
            {role === "admin" && <Panel title={`Daromad, ${today.slice(0, 4)} yil (oylar)`} ><LineChart data={monthly} format={formatMoney} /></Panel>}
            {role === "admin" && <Panel title="To'lov usullari">{methods.length === 0 ? <p className="text-sm text-muted">Bu davrda to&apos;lov yo&apos;q.</p> : <Donut data={methods} />}</Panel>}
          </div>
        </div>
      )}
    </Page>
  );
}
