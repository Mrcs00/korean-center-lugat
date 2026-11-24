"use client";

import { useState } from "react";
import { ErrorNote, Page, PageHeader, Panel, Spinner } from "@/components/platform/ui";
import { WeekSchedule } from "@/components/platform/WeekSchedule";
import { useLessons } from "@/lib/platform/hooks";
import { buildSchedule } from "@/lib/platform/schedule";
import { shiftDateKey, startOfWeekKey, tashkentDateKey } from "@/lib/utils/dates";
import type { GroupFull } from "@/lib/platform/api";

export function ScheduleView({ groups, loading, error }: { groups: GroupFull[]; loading: boolean; error: string | null }) {
  const today = tashkentDateKey();
  const [weekStart, setWeekStart] = useState(startOfWeekKey(today));
  const weekEnd = shiftDateKey(weekStart, 6);
  const { lessons, loading: ll } = useLessons(groups.map((g) => g.id), weekStart, weekEnd);
  const schedule = buildSchedule(groups, lessons, weekStart, weekEnd);

  return (
    <Page wide>
      <PageHeader title="Dars jadvali" subtitle="Haftalik darslar" />
      {error && <ErrorNote message={error} />}
      {loading || ll ? <Spinner /> : (
        <Panel>
          <WeekSchedule weekStart={weekStart} onWeekChange={(d) => setWeekStart(startOfWeekKey(d))} lessons={schedule} today={today} subtitle={(l) => l.lesson?.topic ?? l.group.teacher?.full_name ?? ""} />
        </Panel>
      )}
    </Page>
  );
}
