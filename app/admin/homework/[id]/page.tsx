"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { HomeworkReviewView } from "@/components/platform/staff/HomeworkViews";

export default function RoutePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell>
      <HomeworkReviewView role="admin" id={id} />
    </AdminShell>
  );
}
