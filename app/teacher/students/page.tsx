"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { StudentsListView } from "@/components/platform/staff/StudentViews";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <StudentsListView role="teacher" groups={g.groups} />
    </TeacherShell>
  );
}
