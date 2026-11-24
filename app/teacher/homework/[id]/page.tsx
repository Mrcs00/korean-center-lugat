"use client";

import { useParams } from "next/navigation";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { HomeworkReviewView } from "@/components/platform/staff/HomeworkViews";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <TeacherShell>
      <HomeworkReviewView role="teacher" id={id} />
    </TeacherShell>
  );
}
