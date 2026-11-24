"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { AdminDashboard } from "@/components/platform/staff/Dashboards";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      <AdminDashboard groups={g.groups} loading={g.loading} error={g.error} />
    </AdminShell>
  );
}
