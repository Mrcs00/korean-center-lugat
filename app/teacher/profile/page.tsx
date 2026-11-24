"use client";

import { TeacherShell } from "@/components/layout/TeacherShell";
import { StaffProfileView } from "@/components/platform/staff/StaffProfileView";

export default function RoutePage() {
  return (
    <TeacherShell>
      <StaffProfileView />
    </TeacherShell>
  );
}
