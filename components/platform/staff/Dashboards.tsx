"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, CalendarDays, ClipboardCheck, GraduationCap, Megaphone, Users, UsersRound, Wallet, School, TrendingUp } from "lucide-react";
import { Avatar, Badge, EmptyState, ErrorNote, Page, PageHeader, Panel, Spinner, StatCard, useLoad } from "@/components/platform/ui";
import { BarChart, LineChart } from "@/components/platform/charts";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSettings } from "@/lib/platform/settings";
import { attendanceRate, listAnnouncements, listAttendance, listHomework, listLessons, listProfiles, listSubmissions, allMemberships, type GroupFull } from "@/lib/platform/api";
import { loadDebtors } from "@/lib/platform/debtors";
import { buildSchedule } from "@/lib/platform/schedule";
import { GROUP_STATUS, MONTHS_UZ, PAYMENT_METHODS } from "@/lib/platform/labels";
import { formatDate, formatMoney, timeRange } from "@/lib/platform/format";
import { monthOfKey, shiftDateKey, shiftMonth, tashkentDateKey } from "@/lib/utils/dates";
import { displayLogin } from "@/lib/utils/usernames";

// ── teacher ─────────────────────────────────────────────────────────────────
export function TeacherDashboard({ groups, loading, error }: { groups: GroupFull[]; loading: boolean; error: string | null }) {
  const { profile } = useAuth();
  const today = tashkentDateKey();
  const ids = groups.map((g) => g.id);
  const key = ids.join(",");
  const lessons = useLoad(() => listLessons(ids, today, shiftDateKey(today, 14)), [key]);
  const hw = useLoad(() => listHomework(ids), [key]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const att = useLoad(() => listAttendance({ groupIds: ids, from: shiftDateKey(today, -30) }), [key]);
  const ann = useLoad(() => listAnnouncements(4), []);
  const students = useLoad(() => listProfiles("student"), []);

  const schedule = buildSchedule(groups, lessons.data ?? [], today, shiftDateKey(today, 14));
  const todays = schedule.filter((s) => s.date === today);
  const upcoming = schedule.filter((s) => s.date > today).slice(0, 4);
  const pending = (subs.data ?? []).filter((s) => s.status === "submitted" || s.status === "reviewing");
  const totalStudents = (students.data ?? []).length;
  const rate = attendanceRate(att.data ?? []);
  // attendance already saved for a group today
  const markedToday = (groupId: string) => (att.data ?? []).filter((r) => r.lesson?.group_id === groupId && r.lesson?.lesson_date === today);

  return (
    <Page wide>
      <PageHeader title={`Salom, ${(profile?.full_name ?? "").split(" ")[0]} 👋`} subtitle={formatDate(today)} />
      {error && <ErrorNote message={error} />}
      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard icon={UsersRound} label="Guruhlarim" value={groups.length} tone="brand" href="/teacher/groups" />
            <StatCard icon={GraduationCap} label="O'quvchilarim" value={totalStudents} tone="blue" href="/teacher/students" />
            <StatCard icon={CalendarDays} label="Bugungi darslar" value={todays.length} tone="green" href="/teacher/attendance" />
            <StatCard icon={ClipboardCheck} label="Tekshirilmagan vazifa" value={pending.length} tone={pending.length ? "amber" : "gray"} href="/teacher/grading" />
            <StatCard icon={CalendarCheck} label="Davomat (30 kun)" value={(att.data ?? []).length ? `${rate}%` : "—"} tone="green" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Panel title="Bugungi darslar" action={<Link href="/teacher/schedule" className="text-xs font-semibold text-brand-darker">Jadval →</Link>}>
                {todays.length === 0 ? (
                  <div>
                    <p className="text-sm text-muted">Bugun dars yo&apos;q.</p>
                    {upcoming[0] && <p className="text-xs text-muted-soft mt-1">Keyingi: {upcoming[0].group.name}, {formatDate(upcoming[0].date)} {timeRange(upcoming[0].start_time, upcoming[0].end_time)}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {todays.map((s) => {
                      const rows = markedToday(s.group.id);
                      const done = rows.length > 0;
                      const came = rows.filter((r) => r.status === "present" || r.status === "late").length;
                      // opens the attendance page with this group and today already selected
                      const href = `/teacher/attendance?group=${s.group.id}&date=${today}`;
                      return (
                        <div key={s.group.id} className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${done ? "bg-green-soft border-border" : "bg-brand-tint border-brand/30"}`}>
                          <div className="min-w-0 flex-1 basis-40"><p className="font-bold truncate">{s.group.name}</p><p className="text-xs text-muted">{timeRange(s.start_time, s.end_time) || "Vaqti belgilanmagan"} · {s.group.memberCount} ta o&apos;quvchi</p></div>
                          {done ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-green">Belgilangan ✓ · {came}/{rows.length} keldi</span>
                              <Link href={href} className="text-xs font-semibold text-brand-darker">Tahrirlash</Link>
                            </div>
                          ) : (
                            <Link href={href} className="h-9 px-4 rounded-xl bg-brand text-[#0f1d33] text-sm font-bold flex items-center">Davomat</Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <Panel title="Tekshirilishi kerak" action={<Link href="/teacher/grading" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
                {pending.length === 0 ? <p className="text-sm text-muted">Hamma topshiriq tekshirilgan. 🎉</p> : (
                  <div className="flex flex-col gap-2">
                    {pending.slice(0, 5).map((s) => (
                      <Link key={s.id} href={`/teacher/homework/${s.homework_id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 hover:border-border-strong">
                        <span className="text-sm font-semibold truncate">{(hw.data ?? []).find((h) => h.id === s.homework_id)?.title}</span>
                        <Badge tone="amber">Kutilmoqda</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="flex flex-col gap-6">
              <Panel title="Guruhlarim">
                {groups.length === 0 ? <EmptyState icon={Users} title="Guruh biriktirilmagan" text="Admin sizni guruhga biriktirsa, shu yerda ko'rinadi." /> : (
                  <div className="flex flex-col gap-2.5">
                    {groups.map((g) => (
                      <Link key={g.id} href={`/teacher/groups/${g.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:border-border-strong">
                        <div className="min-w-0"><p className="font-semibold text-sm truncate">{g.name}</p><p className="text-xs text-muted">{g.memberCount} ta o&apos;quvchi</p></div>
                        <Badge tone={GROUP_STATUS[g.status].tone}>{GROUP_STATUS[g.status].label}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="E'lonlar" action={<Link href="/teacher/announcements" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
                {(ann.data ?? []).length === 0 ? <p className="text-sm text-muted">E&apos;lon yo&apos;q.</p> : (ann.data ?? []).map((a) => (
                  <div key={a.id} className="border-b border-border last:border-0 py-2.5 first:pt-0 last:pb-0">
                    <p className="text-sm font-bold flex items-center gap-1.5"><Megaphone size={13} className="text-brand-darker" /> {a.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{a.body}</p>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── admin ───────────────────────────────────────────────────────────────────
export function AdminDashboard({ groups, loading, error }: { groups: GroupFull[]; loading: boolean; error: string | null }) {
  const { settings } = useSettings();
  const today = tashkentDateKey();
  const students = useLoad(() => listProfiles("student"), []);
  const teachers = useLoad(() => listProfiles("teacher"), []);
  const debt = useLoad(() => loadDebtors(settings.payment_due_day), [settings.payment_due_day]);
  const lessons = useLoad(() => listLessons(groups.map((g) => g.id), today, today), [groups.map((g) => g.id).join(",")]);
  const att = useLoad(() => listAttendance({ from: shiftDateKey(today, -13) }), []);
  const members = useLoad(() => allMemberships(), []);
  void listHomework; void listSubmissions;

  const payments = debt.data?.payments ?? [];
  const paid = payments.filter((p) => p.status === "paid");
  const thisMonth = monthOfKey(today);
  const revenueMonth = paid.filter((p) => p.paid_at.slice(0, 7) === thisMonth).reduce((s, p) => s + Number(p.amount), 0);

  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(thisMonth, i - 5));
  const revenueSeries = months.map((m) => ({ label: MONTHS_UZ[Number(m.slice(5)) - 1].slice(0, 3), value: paid.filter((p) => p.paid_at.slice(0, 7) === m).reduce((s, p) => s + Number(p.amount), 0) }));
  const studentSeries = months.map((m) => ({ label: MONTHS_UZ[Number(m.slice(5)) - 1].slice(0, 3), value: (students.data ?? []).filter((s) => s.created_at.slice(0, 7) === m).length }));
  const groupSeries = [...groups].sort((a, b) => b.memberCount - a.memberCount).slice(0, 8).map((g) => ({ label: g.name.slice(0, 8), value: g.memberCount }));
  const days = Array.from({ length: 14 }, (_, i) => shiftDateKey(today, i - 13));
  const attSeries = days.map((d) => { const rows = (att.data ?? []).filter((a) => a.lesson?.lesson_date === d); return { label: d.slice(8), value: rows.length ? attendanceRate(rows) : 0 }; });

  const todaysLessons = buildSchedule(groups.filter((g) => g.status === "active" || g.status === "new"), lessons.data ?? [], today, today);
  const activeStudents = (students.data ?? []).filter((s) => s.status === "active").length;
  const activeGroups = groups.filter((g) => g.status === "active").length;
  const recentPayments = [...payments].slice(0, 5);
  const newStudents = [...(students.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const noGroup = (students.data ?? []).filter((s) => !(members.data ?? []).some((m) => m.student_id === s.id)).length;

  return (
    <Page wide>
      <PageHeader title="Bosh sahifa" subtitle={`${settings.platform_name} · ${formatDate(today)}`} />
      {(error || students.error || debt.error) && <ErrorNote message={(error ?? students.error ?? debt.error) as string} />}
      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={GraduationCap} label="Jami o'quvchilar" value={(students.data ?? []).length} hint={`${activeStudents} faol${noGroup ? ` · ${noGroup} guruhsiz` : ""}`} tone="brand" href="/admin/students" />
            <StatCard icon={School} label="Ustozlar" value={(teachers.data ?? []).length} tone="blue" href="/admin/teachers" />
            <StatCard icon={UsersRound} label="Guruhlar" value={groups.length} hint={`${activeGroups} faol`} tone="green" href="/admin/groups" />
            <StatCard icon={CalendarDays} label="Bugungi darslar" value={todaysLessons.length} tone="amber" />
            <StatCard icon={Wallet} label="Oylik daromad" value={formatMoney(revenueMonth)} tone="green" href="/admin/payments" />
            <StatCard icon={AlertTriangle} label="Qarzdorlar" value={debt.data?.debtors.length ?? "—"} hint={debt.data ? formatMoney(debt.data.debtors.reduce((s, d) => s + d.debt, 0)) : undefined} tone={debt.data?.debtors.length ? "red" : "gray"} href="/admin/payments" />
            <StatCard icon={CalendarCheck} label="Davomat (14 kun)" value={(att.data ?? []).length ? `${attendanceRate(att.data ?? [])}%` : "—"} tone="green" href="/admin/attendance" />
            <StatCard icon={TrendingUp} label="Shu oy yangi o'quvchi" value={(students.data ?? []).filter((s) => s.created_at.slice(0, 7) === thisMonth).length} tone="blue" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Oylik daromad (6 oy)"><BarChart data={revenueSeries} format={formatMoney} /></Panel>
            <Panel title="Yangi o'quvchilar (6 oy)"><LineChart data={studentSeries} /></Panel>
            <Panel title="Guruhlar bo'yicha o'quvchilar"><BarChart data={groupSeries} color="var(--brand)" /></Panel>
            <Panel title="Davomat, oxirgi 14 kun (%)"><LineChart data={attSeries} format={(n) => `${n}%`} /></Panel>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Panel title="Oxirgi to'lovlar" action={<Link href="/admin/payments" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
              {recentPayments.length === 0 ? <p className="text-sm text-muted">To&apos;lov yo&apos;q.</p> : recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0 text-sm">
                  <span className="truncate">{(students.data ?? []).find((s) => s.id === p.student_id)?.full_name ?? "—"}<span className="block text-xs text-muted">{PAYMENT_METHODS[p.method]} · {formatDate(p.paid_at)}</span></span>
                  <b>{formatMoney(p.amount)}</b>
                </div>
              ))}
            </Panel>
            <Panel title="Qarzdorlar" action={<Link href="/admin/payments" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
              {(debt.data?.debtors ?? []).length === 0 ? <p className="text-sm text-muted">Qarzdor yo&apos;q. 🎉</p> : (debt.data?.debtors ?? []).slice(0, 5).map((d) => (
                <Link key={d.profile.id} href={`/admin/students/${d.profile.id}`} className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0 text-sm">
                  <span className="truncate">{d.profile.full_name}<span className="block text-xs text-muted truncate">{d.groups.join(", ")}</span></span>
                  <b className="text-red">{formatMoney(d.debt)}</b>
                </Link>
              ))}
            </Panel>
            <Panel title="Yangi o'quvchilar" action={<Link href="/admin/students" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
              {newStudents.map((s) => (
                <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <Avatar name={s.full_name} size={34} />
                  <span className="min-w-0 text-sm"><span className="font-semibold block truncate">{s.full_name}</span><span className="text-xs text-muted">{displayLogin(s.username)} · {formatDate(s.created_at)}</span></span>
                </Link>
              ))}
            </Panel>
          </div>

          <Panel title="Bugungi darslar" action={<Link href="/admin/groups" className="text-xs font-semibold text-brand-darker">Guruhlar →</Link>}>
            {todaysLessons.length === 0 ? <p className="text-sm text-muted">Bugun dars yo&apos;q.</p> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todaysLessons.map((s) => (
                  <Link key={s.group.id} href={`/admin/groups/${s.group.id}`} className="rounded-xl bg-brand-tint border border-brand/30 px-4 py-3">
                    <p className="font-bold truncate">{s.group.name}</p>
                    <p className="text-xs text-muted">{timeRange(s.start_time, s.end_time) || "—"}{s.group.teacher ? ` · ${s.group.teacher.full_name}` : ""}</p>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </Page>
  );
}
