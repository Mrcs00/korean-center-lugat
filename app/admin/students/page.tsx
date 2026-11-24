"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { StudentsListView } from "@/components/platform/staff/StudentViews";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      <StudentsListView role="admin" groups={g.groups} />
    </AdminShell>
  );
}
