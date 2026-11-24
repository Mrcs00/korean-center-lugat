"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { GroupsListView } from "@/components/platform/staff/GroupViews";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <GroupsListView role="teacher" groups={g.groups} loading={g.loading} error={g.error} reload={g.reload} />
    </TeacherShell>
  );
}
