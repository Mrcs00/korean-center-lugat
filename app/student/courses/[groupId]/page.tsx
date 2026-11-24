"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Link as LinkIcon, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, Page, PageHeader, Panel, Spinner, Tabs, useLoad } from "@/components/platform/ui";
import { openStoredFile } from "@/components/platform/FileUploader";
import { VocabAssignmentCard } from "@/components/platform/VocabAssignmentCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMyGroups, useMyHomework } from "@/lib/platform/hooks";
import { listAttendance, listLessons, listMaterials } from "@/lib/platform/api";
import { fetchAssignmentsForGroup } from "@/lib/services/assignmentService";
import { lessonDatesInRange } from "@/lib/platform/schedule";
import { ATTENDANCE, GROUP_STATUS, SUBMISSION, WEEKDAYS_FULL } from "@/lib/platform/labels";
import { studentHomeworkStatus } from "@/lib/platform/homework";
import { deadlineHint, formatDate, formatMoney, timeRange } from "@/lib/platform/format";
import { shiftDateKey, tashkentDateKey } from "@/lib/utils/dates";
import { groupPrice } from "@/lib/platform/billingFor";

type Tab = "info" | "lessons" | "homework" | "materials" | "vocab";

export default function StudentCourseDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { groups, loading, error } = useMyGroups();
  const [tab, setTab] = useState<Tab>("info");
  const group = groups.find((g) => g.id === groupId);
  const today = tashkentDateKey();

  const lessons = useLoad(() => listLessons([groupId], shiftDateKey(today, -120), shiftDateKey(today, 30)), [groupId]);
  const att = useLoad(() => (user ? listAttendance({ studentId: user.id, groupIds: [groupId] }) : Promise.resolve([])), [groupId, user?.id]);
  const { homework, submissions } = useMyHomework([groupId]);
  const materials = useLoad(() => listMaterials({ groupId }), [groupId]);
  const courseMaterials = useLoad(() => (group?.course_id ? listMaterials({ courseId: group.course_id }) : Promise.resolve([])), [group?.course_id]);
  const vocab = useLoad(() => fetchAssignmentsForGroup(groupId), [groupId]);

  if (loading) return <AppShell><Page><Spinner /></Page></AppShell>;
  if (!group) {
    return (
      <AppShell>
        <Page>
          {error && <ErrorNote message={error} />}
          <EmptyState title="Kurs topilmadi" action={<Link href="/student/courses" className="text-sm font-semibold text-brand-darker">← Kurslarimga qaytish</Link>} />
        </Page>
      </AppShell>
    );
  }

  const attBy = new Map((att.data ?? []).map((a) => [a.lesson?.lesson_date, a.status]));
  const savedBy = new Map((lessons.data ?? []).map((l) => [l.lesson_date, l]));
  const dates = new Set([...lessonDatesInRange(group, shiftDateKey(today, -90), shiftDateKey(today, 21)), ...(lessons.data ?? []).map((l) => l.lesson_date)]);
  const lessonList = [...dates].sort().reverse();
  const subOf = new Map(submissions.map((s) => [s.homework_id, s]));
  const allMaterials = [...(materials.data ?? []), ...(courseMaterials.data ?? [])];

  return (
    <AppShell>
      <Page>
        <PageHeader
          back={<Link href="/student/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Kurslarim</Link>}
          title={group.course?.name ?? group.name}
          subtitle={`${group.name}${group.teacher ? ` · ${group.teacher.full_name}` : ""}`}
          actions={<Badge tone={GROUP_STATUS[group.status].tone}>{GROUP_STATUS[group.status].label}</Badge>}
        />

        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "info", label: "Ma'lumot" },
            { id: "lessons", label: "Darslar", count: lessonList.length },
            { id: "homework", label: "Vazifalar", count: homework.length },
            { id: "materials", label: "Materiallar", count: allMaterials.length },
            { id: "vocab", label: "Lug'at va imtihon" },
          ]}
        />

        {tab === "info" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Kurs haqida">
              <p className="text-sm text-muted whitespace-pre-line">{group.course?.description || "Tavsif kiritilmagan."}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Info label="Daraja" value={group.level ?? group.course?.level ?? "—"} />
                <Info label="Davomiyligi" value={group.course?.duration_weeks ? `${group.course.duration_weeks} hafta` : "—"} />
                <Info label="Boshlanish" value={formatDate(group.start_date)} />
                <Info label="Tugash" value={formatDate(group.end_date)} />
                <Info label="Oylik to'lov" value={groupPrice(group) ? formatMoney(groupPrice(group)) : "—"} />
              </dl>
            </Panel>
            <Panel title="Guruh va jadval">
              <div className="flex flex-col gap-3 text-sm">
                <p className="flex items-center gap-2"><User size={16} className="text-muted" /> {group.teacher?.full_name ?? "Ustoz belgilanmagan"}</p>
                <p className="flex items-center gap-2"><CalendarDays size={16} className="text-muted" /> {group.lesson_days.map((d) => WEEKDAYS_FULL[d - 1]).join(", ") || "Dars kunlari belgilanmagan"}</p>
                <p className="text-muted">{timeRange(group.start_time, group.end_time) || "Vaqti belgilanmagan"}</p>
              </div>
            </Panel>
          </div>
        )}

        {tab === "lessons" && (
          <Panel>
            {lessonList.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Darslar yo'q" text="Dars kunlari belgilangach shu yerda ko'rinadi." />
            ) : (
              <div className="flex flex-col">
                {lessonList.map((d) => {
                  const l = savedBy.get(d);
                  const st = attBy.get(d);
                  return (
                    <div key={d} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="w-24 shrink-0 text-sm font-bold">{formatDate(d)}</div>
                      <div className="min-w-0 flex-1 text-sm text-muted truncate">{l?.topic ?? (d > today ? "Mavzu hali belgilanmagan" : "—")}</div>
                      {st ? <Badge tone={ATTENDANCE[st].tone}>{ATTENDANCE[st].label}</Badge> : d > today ? <Badge tone="gray">Rejada</Badge> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === "homework" && (
          <div className="flex flex-col gap-2.5">
            {homework.length === 0 && <EmptyState title="Vazifa yo'q" />}
            {homework.map((h) => {
              const st = studentHomeworkStatus(h, subOf.get(h.id));
              return (
                <Link key={h.id} href={`/student/homework/${h.id}`} className="flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 hover:border-border-strong">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{h.title}</p>
                    <p className="text-xs text-muted mt-0.5">{deadlineHint(h.due_at)}</p>
                  </div>
                  <Badge tone={SUBMISSION[st].tone}>{SUBMISSION[st].label}</Badge>
                </Link>
              );
            })}
          </div>
        )}

        {tab === "materials" && (
          <Panel>
            {allMaterials.length === 0 ? (
              <EmptyState icon={FileText} title="Materiallar yo'q" text="Ustoz material qo'shgach shu yerda ko'rinadi." />
            ) : (
              <div className="flex flex-col gap-2">
                {allMaterials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => (m.kind === "link" && m.url ? window.open(m.url, "_blank", "noopener") : m.path ? openStoredFile(m.path) : undefined)}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:border-border-strong"
                  >
                    {m.kind === "link" ? <LinkIcon size={18} className="text-muted" /> : <FileText size={18} className="text-muted" />}
                    <span className="flex-1 min-w-0 text-sm font-semibold truncate">{m.title}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === "vocab" && (
          <div className="flex flex-col gap-4">
            {group.course?.vocab_book && (
              <Link href={`/vocabulary/seoul-hangugo/${group.course.vocab_book}`} className="rounded-2xl bg-brand-soft px-5 py-4 font-semibold flex items-center justify-between">
                <span>{group.course.name} kitobi lug&apos;atlari</span>
                <span className="text-brand-darker">Ochish →</span>
              </Link>
            )}
            {(vocab.data ?? []).length === 0 ? (
              <EmptyState title="Lug'at topshirig'i yo'q" text="Ustoz lug'at topshirig'i yoki kitob imtihonini yuborsa, shu yerda chiqadi." />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {(vocab.data ?? []).map((a) => (
                  <VocabAssignmentCard key={a.id} a={a} />
                ))}
              </div>
            )}
          </div>
        )}
      </Page>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
