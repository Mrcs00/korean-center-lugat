"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { StaffProfileView } from "@/components/platform/staff/StaffProfileView";

export default function RoutePage() {
  return (
    <AdminShell>
      <StaffProfileView />
    </AdminShell>
  );
}
