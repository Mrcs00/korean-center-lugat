import { supabase } from "../supabase/client";
import { listMembers } from "./api";
import { fetchAssignmentsForGroup, type RealAssignment } from "../services/assignmentService";
import { setWordsInOrder } from "../utils/examSets";

// Teacher-side results of a vocabulary assignment. Read-only: it only reads
// exam_attempts, which a teacher may already read for their own students (kc_attempts_staff).

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Reads every row, 1000 at a time (Supabase returns at most 1000 per request). */
async function allRows<T>(make: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export type ResultStatus = "none" | "progress" | "done";

export interface StudentResult {
  studentId: string;
  name: string;
  status: ResultStatus;
  pct: number; // best exam score of the student on this assignment
  attempts: number; // finished exam attempts on this set
  bestExamPct: number | null;
  lastAt: string | null;
}

export interface VocabResults {
  rows: StudentResult[];
  doneCount: number;
  startedCount: number;
  averagePct: number;
}

export async function loadVocabResults(a: RealAssignment): Promise<VocabResults> {
  const members = await listMembers(a.groupId);
  const ids = members.map((m) => m.student_id);
  if (ids.length === 0) return { rows: [], doneCount: 0, startedCount: 0, averagePct: 0 };

  const isBookExam = a.kind === "book_exam";

  // finished exam attempts of this set / book exam
  type Attempt = { student_id: string; submitted_at: string | null; total_questions: number; correct_count: number };
  const attempts = await allRows<Attempt>((f, t) =>
    supabase
      .from("exam_attempts")
      .select("student_id, submitted_at, total_questions, correct_count")
      .eq("set_id", a.setId)
      .in("student_id", ids)
      .not("submitted_at", "is", null)
      .range(f, t)
  );

  // How many questions an exam must have to count for this assignment: a set assignment
  // needs an exam over at least its words (a longer exam covers it too); a book exam has no minimum.
  let needed = 0;
  if (!isBookExam) {
    const all = setWordsInOrder(a.setId);
    needed = a.wordFrom && a.wordTo ? a.wordTo - a.wordFrom + 1 : all.length;
  }

  // The score is the student's best exam result (the student takes the test, the system scores it).
  // Flashcard "I know it" marks do not count.
  const rows: StudentResult[] = members.map((m) => {
    const mine = attempts.filter((x) => x.student_id === m.student_id && x.total_questions >= needed);
    const best = mine.length ? Math.max(...mine.map((x) => Math.round((x.correct_count / Math.max(x.total_questions, 1)) * 100))) : null;
    const last = mine.map((x) => x.submitted_at ?? "").sort().pop() || null;
    const pct = best ?? 0;
    const done = mine.length > 0 && pct >= a.minimumMastery;
    const status: ResultStatus = done ? "done" : mine.length > 0 ? "progress" : "none";
    return { studentId: m.student_id, name: m.profile?.full_name ?? "O'quvchi", status, pct, attempts: mine.length, bestExamPct: best, lastAt: last };
  });

  const order: Record<ResultStatus, number> = { none: 0, progress: 1, done: 2 };
  rows.sort((x, y) => order[x.status] - order[y.status] || x.name.localeCompare(y.name));

  return {
    rows,
    doneCount: rows.filter((r) => r.status === "done").length,
    startedCount: rows.filter((r) => r.status !== "none").length,
    averagePct: Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length),
  };
}

export interface StudentVocabItem {
  a: RealAssignment;
  result: StudentResult | null;
}

/** Every vocabulary assignment sent to the student's groups, with this student's own result. */
export async function loadStudentVocab(studentId: string, groupIds: string[]): Promise<StudentVocabItem[]> {
  if (groupIds.length === 0) return [];
  const assignments = (await Promise.all(groupIds.map((id) => fetchAssignmentsForGroup(id)))).flat();
  const items = await Promise.all(
    assignments.map(async (a) => {
      const res = await loadVocabResults(a);
      return { a, result: res.rows.find((r) => r.studentId === studentId) ?? null };
    })
  );
  // newest deadline first, no-deadline last
  return items.sort((x, y) => {
    const dx = x.a.deadline ?? "";
    const dy = y.a.deadline ?? "";
    if (!dx && !dy) return 0;
    if (!dx) return 1;
    if (!dy) return -1;
    return dy.localeCompare(dx);
  });
}
