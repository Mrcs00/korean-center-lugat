"use client";

import { useParams } from "next/navigation";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { StudentProfileView } from "@/components/platform/staff/StudentViews";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <TeacherShell>
      <StudentProfileView role="teacher" id={id} />
    </TeacherShell>
  );
}
