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

// ── Teacher grading queue ───────────────────────────────────────────────────

export function isPastDue(hw: Pick<Homework, "due_at">, now: Date = new Date()): boolean {
  return hw.due_at ? new Date(hw.due_at).getTime() <= now.getTime() : false;
}

/** An empty, not-yet-saved submission for a student who never handed anything in. */
export function emptySubmission(homeworkId: string, studentId: string): Submission {
  return {
    id: "",
    homework_id: homeworkId,
    student_id: studentId,
    answer: null,
    attachments: [],
    status: "draft",
    score: null,
    feedback: null,
    mistakes: null,
    attempt: 1,
    submitted_at: null,
    graded_at: null,
  };
}

export interface QueueItem {
  key: string;
  hw: Homework;
  studentId: string;
  sub: Submission; // id === "" means no row exists yet
  handed: boolean; // true = the student pressed "Topshirish"
}

/**
 * Everything the teacher still has to grade:
 *  - handed in (submitted / reviewing), any time;
 *  - not handed in, but the deadline has passed (the student shows the work
 *    in person). Graded and "needs_revision" items are not in the queue.
 */
export function buildGradingQueue(
  homework: Homework[],
  subs: Submission[],
  memberships: { group_id: string; student_id: string }[],
  now: Date = new Date()
): QueueItem[] {
  const subMap = new Map(subs.map((s) => [`${s.homework_id}:${s.student_id}`, s]));
  const out: QueueItem[] = [];
  for (const hw of homework) {
    const past = isPastDue(hw, now);
    const targets = memberships.filter((m) => m.group_id === hw.group_id && (!hw.student_ids || hw.student_ids.includes(m.student_id)));
    for (const m of targets) {
      const sub = subMap.get(`${hw.id}:${m.student_id}`);
      if (sub && (sub.status === "submitted" || sub.status === "reviewing")) {
        out.push({ key: sub.id, hw, studentId: m.student_id, sub, handed: true });
      } else if (past && (!sub || sub.status === "draft")) {
        out.push({ key: `${hw.id}:${m.student_id}`, hw, studentId: m.student_id, sub: sub ?? emptySubmission(hw.id, m.student_id), handed: false });
      }
    }
  }
  const when = (i: QueueItem) => i.sub.submitted_at ?? i.hw.due_at ?? "";
  return out.sort((a, b) => when(a).localeCompare(when(b)));
}
