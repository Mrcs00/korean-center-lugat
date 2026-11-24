"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { BranchesView } from "@/components/platform/staff/AdminViews";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      <BranchesView groups={g.groups} />
    </AdminShell>
  );
}
