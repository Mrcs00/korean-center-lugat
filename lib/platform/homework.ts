import type { Homework, Submission } from "./types";

export type StudentHomeworkStatus = "new" | "draft" | "submitted" | "reviewing" | "needs_revision" | "graded" | "overdue";

/** The status a student sees for a homework item. */
export function studentHomeworkStatus(hw: Pick<Homework, "due_at">, sub: Pick<Submission, "status"> | null | undefined, now: Date = new Date()): StudentHomeworkStatus {
  const overdue = hw.due_at ? new Date(hw.due_at).getTime() < now.getTime() : false;
  if (!sub) return overdue ? "overdue" : "new";
  if (sub.status === "draft") return overdue ? "overdue" : "draft";
  return sub.status;
}

/** Done = handed in (or beyond); needs the student's action otherwise. */
export function needsAction(status: StudentHomeworkStatus): boolean {
  return status === "new" || status === "draft" || status === "needs_revision" || status === "overdue";
}

export function scorePercent(score: number | null, points: number): number | null {
  return score === null || points <= 0 ? null : Math.round((score / points) * 100);
}
