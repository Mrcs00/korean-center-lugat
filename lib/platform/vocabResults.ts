import { supabase } from "../supabase/client";
import { listMembers } from "./api";
import type { RealAssignment } from "../services/assignmentService";
import { setWordsInOrder } from "../utils/examSets";

// Teacher-side results of a vocabulary assignment. Read-only: it only reads
// exam_attempts and vocabulary_progress, which a teacher may already read for
// their own students (kc_attempts_staff / kc_progress_staff).

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

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export type ResultStatus = "none" | "progress" | "done";

export interface StudentResult {
  studentId: string;
  name: string;
  status: ResultStatus;
  pct: number; // set: % of words mastered; book exam: best score
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

  // word mastery (only for set assignments; same rule as the student card: level >= 3)
  const mastered = new Map<string, number>();
  let wordCount = 0;
  if (!isBookExam) {
    const all = setWordsInOrder(a.setId);
    const words = a.wordFrom && a.wordTo ? all.slice(a.wordFrom - 1, a.wordTo) : all;
    wordCount = words.length;
    const wordIds = words.map((w) => w.id);
    type Prog = { student_id: string; word_id: string; mastery_level: number };
    const parts = await Promise.all(
      chunk(wordIds, 100).map((part) =>
        allRows<Prog>((f, t) =>
          supabase.from("vocabulary_progress").select("student_id, word_id, mastery_level").in("student_id", ids).in("word_id", part).range(f, t)
        )
      )
    );
    for (const row of parts.flat()) {
      if (row.mastery_level >= 3) mastered.set(row.student_id, (mastered.get(row.student_id) ?? 0) + 1);
    }
  }

  const rows: StudentResult[] = members.map((m) => {
    const mine = attempts.filter((x) => x.student_id === m.student_id);
    const best = mine.length ? Math.max(...mine.map((x) => Math.round((x.correct_count / Math.max(x.total_questions, 1)) * 100))) : null;
    const last = mine.map((x) => x.submitted_at ?? "").sort().pop() || null;
    const pct = isBookExam ? best ?? 0 : wordCount ? Math.round(((mastered.get(m.student_id) ?? 0) / wordCount) * 100) : 0;
    const done = pct >= a.minimumMastery && (!isBookExam || mine.length > 0);
    const status: ResultStatus = done ? "done" : pct > 0 || mine.length > 0 ? "progress" : "none";
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
