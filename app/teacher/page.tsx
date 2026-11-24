"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherDashboard } from "@/components/platform/staff/Dashboards";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <TeacherDashboard groups={g.groups} loading={g.loading} error={g.error} />
    </TeacherShell>
  );
}
