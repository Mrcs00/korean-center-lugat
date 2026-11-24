"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { ScheduleView } from "@/components/platform/staff/ScheduleView";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <ScheduleView groups={g.groups} loading={g.loading} error={g.error} />
    </TeacherShell>
  );
}
