"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { AttendanceView } from "@/components/platform/staff/AttendanceView";
import { Page, PageHeader, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      <Page wide>
        <PageHeader title="Davomat" subtitle="Dars davomatini belgilang" />
        {g.loading ? <Spinner /> : <AttendanceView groups={g.groups} />}
      </Page>
    </TeacherShell>
  );
}
