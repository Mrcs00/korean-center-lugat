"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { TeacherDetailView } from "@/components/platform/staff/AdminViews";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  const g = useStaffGroups();
  return (
    <AdminShell>
      {g.loading ? <Page><Spinner /></Page> : <TeacherDetailView id={id} groups={g.groups} reloadGroups={g.reload} />}
    </AdminShell>
  );
}
