"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { VocabAssignmentsView } from "@/components/platform/staff/VocabAssignmentsView";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      {g.loading ? <Page><Spinner /></Page> : <VocabAssignmentsView groups={g.groups} />}
    </TeacherShell>
  );
}
