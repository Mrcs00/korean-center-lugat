"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, Page, PageHeader, Panel, Spinner, StatCard } from "@/components/platform/ui";
import { MonthCalendar, type DayMark } from "@/components/platform/MonthCalendar";
import { useMyAttendance, useMyGroups } from "@/lib/platform/hooks";
import { attendanceRate } from "@/lib/platform/api";
import { ATTENDANCE } from "@/lib/platform/labels";
import { formatDate } from "@/lib/platform/format";
import { monthOfKey, tashkentDateKey } from "@/lib/utils/dates";
import type { AttendanceStatus } from "@/lib/platform/types";

export default function StudentAttendancePage() {
  const today = tashkentDateKey();
  const { rows, loading, error } = useMyAttendance();
  const { groups } = useMyGroups();
  const [period, setPeriod] = useState(monthOfKey(today));

  const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length;
  const rate = attendanceRate(rows);

  const marks: Record<string, DayMark> = {};
  rows.forEach((r) => {
    if (r.lesson) marks[r.lesson.lesson_date] = { tone: ATTENDANCE[r.status].tone as DayMark["tone"], title: ATTENDANCE[r.status].label };
  });

  const history = [...rows].sort((a, b) => (b.lesson?.lesson_date ?? "").localeCompare(a.lesson?.lesson_date ?? ""));

  return (
    <AppShell>
      <Page>
        <PageHeader title="Davomat" subtitle="Darslarga qatnashishingiz" />
        {error && <ErrorNote message={error} />}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="Davomat hali belgilanmagan" text="Ustoz dars oxirida davomat belgilagach, shu yerda ko'rinadi." />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={CalendarCheck} label="Davomat" value={`${rate}%`} tone="brand" />
              <StatCard icon={CalendarCheck} label="Jami dars" value={rows.length} tone="blue" />
              <StatCard icon={CalendarCheck} label="Qatnashgan" value={count("present")} tone="green" />
              <StatCard icon={CalendarCheck} label="Kechikkan" value={count("late")} tone="amber" />
              <StatCard icon={CalendarCheck} label="Kelmagan" value={count("absent")} tone="red" />
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              <Panel title="Oy kalendari" className="lg:col-span-2">
                <MonthCalendar period={period} onPeriodChange={setPeriod} marks={marks} today={today} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {(Object.keys(ATTENDANCE) as AttendanceStatus[]).map((s) => (
                    <Badge key={s} tone={ATTENDANCE[s].tone}>{ATTENDANCE[s].label}</Badge>
                  ))}
                </div>
              </Panel>

              <Panel title="Tarix" className="lg:col-span-3">
                <div className="flex flex-col">
                  {history.slice(0, 40).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <span className="w-24 shrink-0 text-sm font-bold">{formatDate(r.lesson?.lesson_date)}</span>
                      <span className="flex-1 min-w-0 text-sm text-muted truncate">
                        {groups.find((g) => g.id === r.lesson?.group_id)?.name ?? ""}
                        {r.lesson?.topic ? ` · ${r.lesson.topic}` : ""}
                      </span>
                      <Badge tone={ATTENDANCE[r.status].tone}>{ATTENDANCE[r.status].label}</Badge>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </Page>
    </AppShell>
  );
}
