"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { HomeworkListView } from "@/components/platform/staff/HomeworkViews";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      {g.loading ? <Page><Spinner /></Page> : <HomeworkListView role="admin" groups={g.groups} />}
    </AdminShell>
  );
}
