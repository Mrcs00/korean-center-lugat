"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { StudentProfileView } from "@/components/platform/staff/StudentViews";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell>
      <StudentProfileView role="admin" id={id} />
    </AdminShell>
  );
}
