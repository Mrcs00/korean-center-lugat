"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { AnnouncementsView } from "@/components/platform/staff/AnnouncementsView";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <TeacherShell>
      {g.loading ? <Page><Spinner /></Page> : <AnnouncementsView role="teacher" groups={g.groups} />}
    </TeacherShell>
  );
}
