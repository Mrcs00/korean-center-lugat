"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { AnnouncementsView } from "@/components/platform/staff/AnnouncementsView";
import { Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const g = useStaffGroups();
  return (
    <AdminShell>
      {g.loading ? <Page><Spinner /></Page> : <AnnouncementsView role="admin" groups={g.groups} />}
    </AdminShell>
  );
}
