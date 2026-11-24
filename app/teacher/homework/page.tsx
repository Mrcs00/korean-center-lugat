"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { HomeworkListView } from "@/components/platform/staff/HomeworkViews";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      {g.loading ? <Page><Spinner /></Page> : <HomeworkListView role="teacher" groups={g.groups} />}
    </TeacherShell>
  );
}
