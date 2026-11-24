"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { StatisticsView } from "@/components/platform/staff/StatisticsView";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      <StatisticsView role="admin" groups={g.groups} loading={g.loading} />
    </AdminShell>
  );
}
