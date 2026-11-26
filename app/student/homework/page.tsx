"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ClipboardList, Paperclip } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, FilterChips, Page, PageHeader, Spinner, useLoad } from "@/components/platform/ui";
import { VocabAssignmentCard } from "@/components/platform/VocabAssignmentCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMyGroups, useMyHomework } from "@/lib/platform/hooks";
import { fetchAssignmentsForGroup } from "@/lib/services/assignmentService";
import { needsAction, studentHomeworkStatus, type StudentHomeworkStatus } from "@/lib/platform/homework";
import { HOMEWORK_TYPES, SUBMISSION } from "@/lib/platform/labels";
import { deadlineHint, formatDateTime } from "@/lib/platform/format";

type Filter = "all" | "todo" | "new" | "submitted" | "graded" | "overdue";

// a coloured edge on each card shows the state at a glance
const EDGE: Record<string, string> = {
  green: "border-l-green",
  amber: "border-l-amber",
  red: "border-l-red",
  blue: "border-l-blue",
  gray: "border-l-border-strong",
  brand: "border-l-brand-dark",
};

export default function StudentHomeworkPage() {
  const { user } = useAuth();
  const { groups, loading: gl } = useMyGroups();
  const gids = groups.map((g) => g.id);
  const { homework, submissions, loading, error } = useMyHomework(gids);
  const [filter, setFilter] = useState<Filter>("all");

  const vocab = useLoad(async () => (await Promise.all(gids.map((id) => fetchAssignmentsForGroup(id).catch(() => [])))).flat(), [gids.join(","), user?.id]);

  const subOf = new Map(submissions.map((s) => [s.homework_id, s]));
  const items = homework.map((h) => ({ h, sub: subOf.get(h.id) ?? null, status: studentHomeworkStatus(h, subOf.get(h.id)) }));

  const matches = (s: StudentHomeworkStatus): boolean => {
    switch (filter) {
      case "all": return true;
      case "todo": return needsAction(s);
      case "new": return s === "new";
      case "submitted": return s === "submitted" || s === "reviewing";
      case "graded": return s === "graded";
      case "overdue": return s === "overdue";
    }
  };
  const visible = items.filter((i) => matches(i.status));
  const count = (f: Filter) => items.filter((i) => (f === "all" ? true : f === "todo" ? needsAction(i.status) : f === "new" ? i.status === "new" : f === "submitted" ? i.status === "submitted" || i.status === "reviewing" : f === "graded" ? i.status === "graded" : i.status === "overdue")).length;

  return (
    <AppShell>
      <Page>
        <PageHeader title="Uy vazifalari" subtitle="Vazifalarni topshiring va baholaringizni ko'ring" />
        {error && <ErrorNote message={error} />}
        {loading || gl ? (
          <Spinner />
        ) : (
          <>
            <div className="mb-5">
              <FilterChips<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "Barchasi", count: count("all") },
                  { id: "todo", label: "Bajarilmagan", count: count("todo") },
                  { id: "new", label: "Yangi", count: count("new") },
                  { id: "submitted", label: "Topshirilgan", count: count("submitted") },
                  { id: "graded", label: "Baholangan", count: count("graded") },
                  { id: "overdue", label: "Muddati o'tgan", count: count("overdue") },
                ]}
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState icon={ClipboardList} title={items.length === 0 ? "Hali vazifa berilmagan" : "Bu bo'limda vazifa yo'q"} />
            ) : (
              <div className="flex flex-col gap-3">
                {visible.map(({ h, sub, status }) => {
                  const group = groups.find((g) => g.id === h.group_id);
                  return (
                    <Link key={h.id} href={`/student/homework/${h.id}`} className={`rounded-2xl bg-surface border border-border border-l-4 ${EDGE[SUBMISSION[status].tone] ?? ""} p-4 sm:p-5 shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-extrabold tracking-tight">{h.title}</p>
                          <p className="text-xs text-muted mt-0.5">{group?.course?.name ?? group?.name} · {HOMEWORK_TYPES[h.type]}</p>
                        </div>
                        <Badge tone={SUBMISSION[status].tone}>{SUBMISSION[status].label}</Badge>
                      </div>
                      {h.description && <p className="text-sm text-muted mt-2 line-clamp-2">{h.description}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Clock size={12} /> {h.due_at ? `${formatDateTime(h.due_at)} (${deadlineHint(h.due_at)})` : "Muddatsiz"}</span>
                        {h.attachments.length > 0 && <span className="flex items-center gap-1"><Paperclip size={12} /> {h.attachments.length} ta fayl</span>}
                        {sub?.status === "graded" && <span className="font-bold text-green">Ball: {sub.score ?? "—"}/{h.points}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {(vocab.data ?? []).length > 0 && (
              <div className="mt-10">
                <h2 className="font-extrabold text-lg tracking-tight mb-3 flex items-center gap-2">Lug&apos;at topshiriqlari <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-[#0f1d33]">{(vocab.data ?? []).length}</span></h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {(vocab.data ?? []).map((a) => (
                    <VocabAssignmentCard key={a.id} a={a} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Page>
    </AppShell>
  );
}
