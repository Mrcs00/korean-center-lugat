"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { CoursesView } from "@/components/platform/staff/CoursesView";

export default function RoutePage() {
  return (
    <AdminShell>
      <CoursesView />
    </AdminShell>
  );
}
