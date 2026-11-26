"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, Page, PageHeader, Spinner } from "@/components/platform/ui";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useMyGroups } from "@/lib/platform/hooks";
import { useStore } from "@/lib/store/progressStore";
import { GROUP_STATUS, WEEKDAYS_SHORT } from "@/lib/platform/labels";
import { timeRange } from "@/lib/platform/format";
import { bookWords } from "@/lib/utils/examSets";

export default function StudentCoursesPage() {
  const { groups, loading, error } = useMyGroups();
  const { progress } = useStore();

  return (
    <AppShell>
      <Page>
        <PageHeader title="Mening kurslarim" subtitle="Siz o'qiyotgan guruhlar va kurslar" />
        {error && <ErrorNote message={error} />}
        {loading ? (
          <Spinner />
        ) : groups.length === 0 ? (
          <EmptyState icon={BookOpen} title="Hali guruhga qo'shilmagansiz" text="Markaz sizni guruhga qo'shgach, kurslaringiz shu yerda ko'rinadi." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => {
              const words = g.course?.vocab_book ? bookWords(g.course.vocab_book) : [];
              const learned = words.filter((w) => (progress[w.id]?.masteryLevel ?? 0) >= 3).length;
              const pct = words.length ? Math.round((learned / words.length) * 100) : null;
              return (
                <Link key={g.id} href={`/student/courses/${g.id}`} className="group rounded-2xl bg-surface border border-border overflow-hidden shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200">
                  <div className="h-28 bg-gradient-to-br from-brand to-brand-dark relative">
                    {g.course?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.course.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="absolute left-4 bottom-3">
                      <Badge tone={GROUP_STATUS[g.status].tone}>{GROUP_STATUS[g.status].label}</Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-extrabold text-lg leading-tight tracking-tight">{g.course?.name ?? g.name}</p>
                    <p className="text-sm text-muted">{g.name}</p>
                    <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted">
                      {g.teacher && (
                        <span className="flex items-center gap-1.5">
                          <User size={13} /> {g.teacher.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} /> {g.lesson_days.map((d) => WEEKDAYS_SHORT[d - 1]).join(", ") || "Jadval yo'q"} {timeRange(g.start_time, g.end_time)}
                      </span>
                    </div>
                    {pct !== null && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-muted mb-1">
                          <span>Lug&apos;at o&apos;zlashtirish</span>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <ProgressBar value={pct} max={100} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Page>
    </AppShell>
  );
}
