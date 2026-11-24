"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { GroupDetailView } from "@/components/platform/staff/GroupViews";
import { EmptyState, Page, Spinner } from "@/components/platform/ui";
import { useStaffGroups } from "@/lib/platform/staff";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  const g = useStaffGroups();
  const group = g.groups.find((x) => x.id === id);
  return (
    <AdminShell>
      {g.loading ? <Page><Spinner /></Page> : !group ? <Page><EmptyState title="Guruh topilmadi" text="Guruh mavjud emas yoki sizga biriktirilmagan." /></Page> : <GroupDetailView role="admin" group={group} allGroups={g.groups} reloadGroups={g.reload} />}
    </AdminShell>
  );
}
