"use client";

import Link from "next/link";
import { BookOpen, CalendarCheck, CalendarDays, ClipboardList, Clock, Flame, Languages, Megaphone, Repeat, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PasswordBanner } from "@/components/layout/PasswordBanner";
import { Badge, EmptyState, ErrorNote, Page, Panel, Spinner, StatCard, useLoad } from "@/components/platform/ui";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSettings } from "@/lib/platform/settings";
import { useStore } from "@/lib/store/progressStore";
import { attendanceRate, listAnnouncements } from "@/lib/platform/api";
import { useLessons, useMyAttendance, useMyGroups, useMyHomework, useMyPayments } from "@/lib/platform/hooks";
import { buildSchedule } from "@/lib/platform/schedule";
import { billingForMembership } from "@/lib/platform/billingFor";
import { needsAction, studentHomeworkStatus } from "@/lib/platform/homework";
import { SUBMISSION, GROUP_STATUS } from "@/lib/platform/labels";
import { deadlineHint, formatDate, formatMoney, timeRange } from "@/lib/platform/format";
import { shiftDateKey, tashkentDateKey } from "@/lib/utils/dates";
import { bookWords } from "@/lib/utils/examSets";
import { masteredCount, wordsDueForReview } from "@/lib/services/statsService";

export default function StudentHome() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const store = useStore();
  const today = tashkentDateKey();

  const g = useMyGroups();
  const gids = g.groups.map((x) => x.id);
  const lessons = useLessons(gids, today, shiftDateKey(today, 21));
  const hw = useMyHomework(gids);
  const att = useMyAttendance();
  const pay = useMyPayments();
  const ann = useLoad(() => listAnnouncements(4), []);

  const loading = g.loading || hw.loading || att.loading || pay.loading;
  const error = g.error ?? hw.error ?? att.error ?? pay.error;

  const schedule = buildSchedule(g.groups, lessons.lessons, today, shiftDateKey(today, 21));
  const nextLesson = schedule[0];
  const todays = schedule.filter((s) => s.date === today);

  const subOf = new Map(hw.submissions.map((s) => [s.homework_id, s]));
  const items = hw.homework.map((h) => ({ h, status: studentHomeworkStatus(h, subOf.get(h.id)) }));
  const todo = items.filter((i) => needsAction(i.status)).sort((a, b) => (a.h.due_at ?? "9").localeCompare(b.h.due_at ?? "9"));
  const doneCount = items.filter((i) => !needsAction(i.status)).length;

  const rate = attendanceRate(att.rows);

  const billings = g.groups.map((gr) => billingForMembership({ group: gr, joinedAt: gr.joined_at, payments: pay.payments, onlyGroup: g.groups.length === 1, dueDay: settings.payment_due_day }));
  const debt = billings.reduce((s, b) => s + b.debt, 0);
  const payStatus = debt > 0 ? "debt" : billings.some((b) => b.status === "pending") ? "pending" : "paid";

  const mastered = masteredCount(store.progress);
  const dueWords = wordsDueForReview(store.progress).length;

  const graded = hw.submissions.filter((s) => s.status === "graded" && s.graded_at).sort((a, b) => (b.graded_at ?? "").localeCompare(a.graded_at ?? "")).slice(0, 3);

  return (
    <AppShell>
      <Page>
        <PasswordBanner />
        {/* hero: the text on the yellow is always navy */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 sm:p-8 mb-6 shadow-[var(--shadow-md)] text-[#0f1d33]">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/25" />
          <div className="absolute right-16 -bottom-14 h-36 w-36 rounded-full bg-white/15" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">{formatDate(today)}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Xush kelibsiz, {(profile?.full_name ?? "").split(" ")[0]} 👋</h1>
              {!loading && (
                <p className="text-sm font-semibold opacity-80 mt-1.5">
                  {todo.length > 0 ? `${todo.length} ta vazifa sizni kutmoqda` : "Hamma vazifa bajarilgan"}
                  {todays.length > 0 ? ` · bugun ${todays.length} ta dars bor` : ""}
                </p>
              )}
            </div>
            <span className="flex items-center gap-1.5 bg-white/70 px-4 py-2.5 rounded-2xl text-sm font-extrabold shadow-[var(--shadow-xs)]">
              <Flame size={17} className="text-amber" /> {store.profile.streak} kun
            </span>
          </div>
        </div>

        {error && <ErrorNote message={error} />}
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-6">
            {/* quick numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={BookOpen} label="Kurslarim" value={g.groups.length} tone="brand" href="/student/courses" />
              <StatCard icon={CalendarCheck} label="Davomat" value={att.rows.length ? `${rate}%` : "—"} tone="green" href="/student/attendance" />
              <StatCard icon={ClipboardList} label="Vazifalar" value={`${doneCount}/${items.length}`} hint={todo.length ? `${todo.length} ta bajarilmagan` : "Hammasi bajarilgan"} tone="blue" href="/student/homework" />
              <StatCard icon={Languages} label="O'zlashtirilgan so'z" value={mastered} hint={dueWords ? `${dueWords} ta takrorlash kerak` : undefined} tone="amber" href="/vocabulary" />
              <StatCard icon={Wallet} label="To'lov holati" value={payStatus === "paid" ? "To'langan" : payStatus === "debt" ? "Qarzdor" : "Kutilmoqda"} hint={debt > 0 ? formatMoney(debt) : undefined} tone={payStatus === "paid" ? "green" : payStatus === "debt" ? "red" : "amber"} href="/student/payments" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* today's lesson */}
                <Panel title="Bugungi dars" action={<Link href="/student/schedule" className="text-xs font-semibold text-brand-darker">Jadval →</Link>}>
                  {g.groups.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="Hali guruhga qo'shilmagansiz" text="Markaz sizni guruhga qo'shgach, darslar shu yerda ko'rinadi." />
                  ) : todays.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {todays.map((s) => (
                        <LessonRow key={s.group.id} s={s} />
                      ))}
                    </div>
                  ) : nextLesson ? (
                    <div>
                      <p className="text-sm text-muted mb-3">Bugun dars yo&apos;q. Keyingi dars:</p>
                      <LessonRow s={nextLesson} withDate />
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Yaqin kunlarda dars jadvalda ko&apos;rinmayapti.</p>
                  )}
                </Panel>

                {/* homework to do */}
                <Panel title="Bajarilishi kerak vazifalar" action={<Link href="/student/homework" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
                  {todo.length === 0 ? (
                    <p className="text-sm text-muted py-2">Hamma vazifa bajarilgan. Barakalla! 🎉</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {todo.slice(0, 4).map(({ h, status }) => (
                        <Link key={h.id} href={`/student/homework/${h.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-sm)] transition-all">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{h.title}</p>
                            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                              <Clock size={12} /> {deadlineHint(h.due_at)}
                            </p>
                          </div>
                          <Badge tone={SUBMISSION[status].tone}>{SUBMISSION[status].label}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* my courses */}
                <Panel title="Mening kurslarim" action={<Link href="/student/courses" className="text-xs font-semibold text-brand-darker">Hammasi →</Link>}>
                  {g.groups.length === 0 ? (
                    <p className="text-sm text-muted">Kurs yo&apos;q.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {g.groups.map((gr) => {
                        const words = gr.course?.vocab_book ? bookWords(gr.course.vocab_book) : [];
                        const learned = words.filter((w) => (store.progress[w.id]?.masteryLevel ?? 0) >= 3).length;
                        const pct = words.length ? Math.round((learned / words.length) * 100) : null;
                        return (
                          <Link key={gr.id} href={`/student/courses/${gr.id}`} className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold truncate">{gr.course?.name ?? gr.name}</p>
                                <p className="text-xs text-muted truncate">{gr.name}{gr.teacher ? ` · ${gr.teacher.full_name}` : ""}</p>
                              </div>
                              <Badge tone={GROUP_STATUS[gr.status].tone}>{GROUP_STATUS[gr.status].label}</Badge>
                            </div>
                            {pct !== null && (
                              <div className="mt-3">
                                <div className="flex justify-between text-[11px] text-muted mb-1">
                                  <span>Lug&apos;at</span>
                                  <span className="font-bold">{pct}%</span>
                                </div>
                                <ProgressBar value={pct} max={100} />
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="flex flex-col gap-6">
                <Panel title="Lug'at mashqi">
                  <div className="flex flex-col gap-2">
                    <Link href="/review" className="flex items-center gap-3 rounded-xl bg-brand text-[#0f1d33] px-4 py-3.5 font-bold text-sm shadow-[var(--shadow-brand)] hover:bg-brand-dark transition-colors">
                      <Repeat size={18} />
                      <span className="flex-1">Takrorlash</span>
                      <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-extrabold">{dueWords} ta</span>
                    </Link>
                    <Link href="/vocabulary" className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 font-semibold text-sm hover:border-border-strong transition-colors">
                      <Languages size={18} className="text-muted" /> Lug&apos;atlar
                    </Link>
                  </div>
                </Panel>

                <Panel title="E'lonlar">
                  {(ann.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted">Yangi e&apos;lon yo&apos;q.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(ann.data ?? []).map((a) => (
                        <div key={a.id} className="rounded-xl bg-brand-tint border border-brand/20 px-3.5 py-3">
                          <p className="text-sm font-bold flex items-center gap-1.5">
                            <Megaphone size={14} className="text-brand-darker shrink-0" /> {a.title}
                          </p>
                          <p className="text-xs text-muted mt-1 line-clamp-3">{a.body}</p>
                          <p className="text-[11px] text-muted-soft mt-1">{formatDate(a.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                {graded.length > 0 && (
                  <Panel title="So'nggi baholar">
                    <div className="flex flex-col gap-2.5">
                      {graded.map((s) => {
                        const h = hw.homework.find((x) => x.id === s.homework_id);
                        return (
                          <Link key={s.id} href={`/student/homework/${s.homework_id}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate">{h?.title ?? "Vazifa"}</span>
                            <span className="font-bold text-green shrink-0">
                              {s.score ?? "—"}/{h?.points ?? 100}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </Panel>
                )}
              </div>
            </div>
          </div>
        )}
      </Page>
    </AppShell>
  );
}

function LessonRow({ s, withDate }: { s: ReturnType<typeof buildSchedule>[number]; withDate?: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-brand-tint border border-brand/30 px-4 py-3">
      <div className="h-11 w-11 rounded-xl bg-brand flex items-center justify-center shrink-0">
        <CalendarDays size={20} className="text-[#0f1d33]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate">{s.group.name}</p>
        <p className="text-xs text-muted">
          {withDate ? `${formatDate(s.date)} · ` : ""}
          {timeRange(s.start_time, s.end_time) || "Vaqti belgilanmagan"}
          {s.lesson?.topic ? ` · ${s.lesson.topic}` : ""}
        </p>
      </div>
    </div>
  );
}
