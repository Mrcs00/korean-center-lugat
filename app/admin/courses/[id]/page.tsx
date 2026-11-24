"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { CourseDetailView } from "@/components/platform/staff/CoursesView";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell>
      <CourseDetailView id={id} />
    </AdminShell>
  );
}
