"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { GroupsListView } from "@/components/platform/staff/GroupViews";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      <GroupsListView role="admin" groups={g.groups} loading={g.loading} error={g.error} reload={g.reload} />
    </AdminShell>
  );
}
