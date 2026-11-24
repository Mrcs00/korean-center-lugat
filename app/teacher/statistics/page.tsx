"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { StatisticsView } from "@/components/platform/staff/StatisticsView";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <StatisticsView role="teacher" groups={g.groups} loading={g.loading} />
    </TeacherShell>
  );
}
