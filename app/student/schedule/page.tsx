"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorNote, Page, PageHeader, Panel, Spinner } from "@/components/platform/ui";
import { WeekSchedule } from "@/components/platform/WeekSchedule";
import { useLessons, useMyGroups } from "@/lib/platform/hooks";
import { buildSchedule } from "@/lib/platform/schedule";
import { shiftDateKey, startOfWeekKey, tashkentDateKey } from "@/lib/utils/dates";

export default function StudentSchedulePage() {
  const today = tashkentDateKey();
  const [weekStart, setWeekStart] = useState(startOfWeekKey(today));
  const { groups, loading, error } = useMyGroups();
  const weekEnd = shiftDateKey(weekStart, 6);
  const { lessons, loading: ll } = useLessons(groups.map((g) => g.id), weekStart, weekEnd);
  const schedule = buildSchedule(groups, lessons, weekStart, weekEnd);

  return (
    <AppShell>
      <Page wide>
        <PageHeader title="Dars jadvali" subtitle="Haftalik darslaringiz" />
        {error && <ErrorNote message={error} />}
        {loading || ll ? (
          <Spinner />
        ) : (
          <Panel>
            <WeekSchedule
              weekStart={weekStart}
              onWeekChange={(d) => setWeekStart(startOfWeekKey(d))}
              lessons={schedule}
              today={today}
              subtitle={(l) => l.lesson?.topic ?? l.group.teacher?.full_name ?? ""}
            />
          </Panel>
        )}
      </Page>
    </AppShell>
  );
}
