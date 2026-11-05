import { supabase } from "../supabase/client";
import { VOCAB_WORDS } from "../data/seed";
import { fetchAllRows } from "../supabase/fetchAll";

export interface ExamAttemptSummary {
  id: string;
  setId: string;
  correct: number;
  total: number;
  wrong: number;
  skipped: number;
  startedAt: string;
}

export interface WrongAnswerDetail {
  wordId: string;
  koreanWord: string;
  uzbekTranslation: string;
  correctAnswer: string;
  studentAnswer: string | null;
}

export interface RealStudent {
  id: string;
  fullName: string;
  username: string;
  group: string | null;
  groupId: string | null;
  totalMastered: number; // words with VERIFIED mastery (proven in tests/exams)
  masteryPercent: number; // verified words ÷ words of the sets the student actually studies
  selfMastered: number; // words mastered including flashcard self-ratings
  selfMasteryPercent: number;
  lastActiveAt: string | null;
  attentionReason: string | null; // set when the student needs the teacher's attention
  wrongWords: { wordId: string; koreanWord: string; uzbekTranslation: string; timesWrong: number }[];
  lastExamSetId: string | null;
  lastExamScore: string | null;
  avgExamScore: number | null;
  attempts: ExamAttemptSummary[]; // every exam the student took, newest first
}

const wordById = new Map(VOCAB_WORDS.map((w) => [w.id, w]));

// How many words each set has — used so a student's progress is measured
// against the sets they actually study, not against every word on the site.
const wordsPerSet = new Map<string, number>();
VOCAB_WORDS.forEach((w) => wordsPerSet.set(w.setId, (wordsPerSet.get(w.setId) ?? 0) + 1));

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_AFTER_DAYS = 7;
const LOW_EXAM_PERCENT = 50;

interface ProgressRowIn {
  student_id: string;
  word_id: string;
  mastery_level: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  verified_level?: number | null;
}

interface AttemptRowIn {
  id: string;
  student_id: string;
  set_id: string;
  correct_count: number;
  wrong_count: number | null;
  skipped_count: number | null;
  total_questions: number;
  started_at: string;
}

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

// Reads every student's progress (all pages — Supabase caps one request at
// 1000 rows). If docs/logic-upgrade.sql has not been run yet the verified
// column does not exist, so we fall back to the old columns.
async function fetchProgressRows(): Promise<ProgressRowIn[]> {
  const run = (columns: string) =>
    fetchAllRows<ProgressRowIn>(
      (from, to) =>
        supabase
          .from("vocabulary_progress")
          .select(columns)
          .order("student_id")
          .order("word_id")
          .range(from, to) as unknown as Page<ProgressRowIn>
    );
  try {
    return await run("student_id, word_id, mastery_level, wrong_count, last_reviewed_at, verified_level");
  } catch {
    return run("student_id, word_id, mastery_level, wrong_count, last_reviewed_at");
  }
}

/**
 * Fetches every student profile, their group, and their progress, then
 * assembles it all client-side. Requires the logged-in account to have
 * role='teacher' (see docs/teacher-schema.sql) — RLS otherwise only exposes
 * each student their own rows.
 *
 * Numbers shown to the teacher use VERIFIED mastery (proven in tests/exams),
 * not flashcard self-ratings, and are measured against the sets the student
 * actually studies.
 */
export async function fetchRealStudents(): Promise<RealStudent[]> {
  const [{ data: profiles, error: profilesError }, { data: memberships }, allProgress, attempts] = await Promise.all([
    supabase.from("profiles").select("id, full_name, username").eq("role", "student"),
    supabase.from("group_members").select("student_id, group_id, groups(name)"),
    fetchProgressRows(),
    fetchAllRows<AttemptRowIn>(
      (from, to) =>
        supabase
          .from("exam_attempts")
          .select("id, student_id, set_id, correct_count, wrong_count, skipped_count, total_questions, started_at")
          .order("started_at", { ascending: false })
          .order("id")
          .range(from, to) as unknown as Page<AttemptRowIn>
    ),
  ]);

  if (profilesError) throw profilesError;

  const groupByStudent = new Map<string, { id: string; name: string }>();
  (memberships ?? []).forEach((m) => {
    const groupName = (m.groups as unknown as { name: string } | null)?.name;
    if (groupName) groupByStudent.set(m.student_id, { id: m.group_id, name: groupName });
  });

  const progressByStudent = new Map<string, ProgressRowIn[]>();
  allProgress.forEach((row) => {
    const list = progressByStudent.get(row.student_id) ?? [];
    list.push(row);
    progressByStudent.set(row.student_id, list);
  });

  const attemptsByStudent = new Map<string, AttemptRowIn[]>();
  attempts.forEach((a) => {
    const list = attemptsByStudent.get(a.student_id) ?? [];
    list.push(a);
    attemptsByStudent.set(a.student_id, list);
  });

  const now = Date.now();

  return (profiles ?? []).map((p) => {
    const rows = progressByStudent.get(p.id) ?? [];
    const studentAttempts = attemptsByStudent.get(p.id) ?? [];

    const verifiedMastered = rows.filter((r) => (r.verified_level ?? 0) >= 3).length;
    const selfMastered = rows.filter((r) => r.mastery_level >= 3).length;

    // Denominator: all words of the sets this student has started.
    const studiedSets = new Set<string>();
    rows.forEach((r) => {
      const setId = wordById.get(r.word_id)?.setId;
      if (setId) studiedSets.add(setId);
    });
    let studiedWords = 0;
    studiedSets.forEach((setId) => (studiedWords += wordsPerSet.get(setId) ?? 0));
    const percentOf = (n: number) => (studiedWords > 0 ? Math.min(100, Math.round((n / studiedWords) * 100)) : 0);

    const wrongWords = rows
      .filter((r) => r.wrong_count > 0)
      .sort((a, b) => b.wrong_count - a.wrong_count)
      .slice(0, 10)
      .map((r) => {
        const word = wordById.get(r.word_id);
        return {
          wordId: r.word_id,
          koreanWord: word?.koreanWord ?? r.word_id,
          uzbekTranslation: word?.uzbekTranslation ?? "",
          timesWrong: r.wrong_count,
        };
      });

    const lastAttempt = studentAttempts[0];
    const avgExamScore =
      studentAttempts.length > 0
        ? Math.round(
            studentAttempts.reduce((sum, a) => sum + (a.correct_count / Math.max(a.total_questions, 1)) * 100, 0) /
              studentAttempts.length
          )
        : null;

    // Last sign of life: last word reviewed or last exam started.
    let lastActiveMs = 0;
    rows.forEach((r) => {
      if (r.last_reviewed_at) lastActiveMs = Math.max(lastActiveMs, new Date(r.last_reviewed_at).getTime());
    });
    if (lastAttempt) lastActiveMs = Math.max(lastActiveMs, new Date(lastAttempt.started_at).getTime());
    const lastActiveAt = lastActiveMs > 0 ? new Date(lastActiveMs).toISOString() : null;

    // Who needs the teacher: hasn't started, went quiet, or recent exams are weak.
    let attentionReason: string | null = null;
    if (!lastActiveAt) {
      attentionReason = "Hali boshlamagan";
    } else if (now - lastActiveMs > INACTIVE_AFTER_DAYS * DAY_MS) {
      attentionReason = `${Math.floor((now - lastActiveMs) / DAY_MS)} kundan beri kirmagan`;
    } else if (studentAttempts.length > 0) {
      const recent = studentAttempts.slice(0, 3);
      const recentAvg =
        recent.reduce((sum, a) => sum + (a.correct_count / Math.max(a.total_questions, 1)) * 100, 0) / recent.length;
      if (recentAvg < LOW_EXAM_PERCENT) attentionReason = "Oxirgi imtihonlari past";
    }

    return {
      id: p.id,
      fullName: p.full_name,
      username: p.username,
      group: groupByStudent.get(p.id)?.name ?? null,
      groupId: groupByStudent.get(p.id)?.id ?? null,
      totalMastered: verifiedMastered,
      masteryPercent: percentOf(verifiedMastered),
      selfMastered,
      selfMasteryPercent: percentOf(selfMastered),
      lastActiveAt,
      attentionReason,
      wrongWords,
      lastExamSetId: lastAttempt?.set_id ?? null,
      lastExamScore: lastAttempt ? `${lastAttempt.correct_count}/${lastAttempt.total_questions}` : null,
      avgExamScore,
      attempts: studentAttempts.map((a) => ({
        id: a.id,
        setId: a.set_id,
        correct: a.correct_count,
        total: a.total_questions,
        wrong: a.wrong_count ?? 0,
        skipped: a.skipped_count ?? 0,
        startedAt: a.started_at,
      })),
    };
  });
}

export async function fetchRealGroups(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

/**
 * Moves students into one group (or out of every group when groupId is null).
 * The new membership is added first and the old ones are removed afterwards,
 * so a failure never leaves a student without a group by accident.
 *
 * `expectedRemovals` is how many old memberships we expect to delete; if fewer
 * rows were actually removed, the teacher is most likely missing the RLS
 * policies from docs/teacher-members-schema.sql, so we say so.
 */
export async function moveStudentsToGroup(
  studentIds: string[],
  groupId: string | null,
  expectedRemovals = 0
): Promise<void> {
  if (studentIds.length === 0) return;

  if (groupId) {
    const rows = studentIds.map((student_id) => ({ group_id: groupId, student_id }));
    const { error: insertError } = await supabase
      .from("group_members")
      .upsert(rows, { onConflict: "group_id,student_id", ignoreDuplicates: true });
    if (insertError) throw insertError;
  }

  let removal = supabase.from("group_members").delete().in("student_id", studentIds);
  if (groupId) removal = removal.neq("group_id", groupId);
  const { data: removed, error: deleteError } = await removal.select("student_id");
  if (deleteError) throw deleteError;

  if ((removed?.length ?? 0) < expectedRemovals) {
    throw new Error(
      "Eski guruhdan chiqarib bo'lmadi. Supabase'da docs/teacher-members-schema.sql ni ishga tushirganingizni tekshiring."
    );
  }
}

/**
 * Permanently deletes student accounts (login + profile + all progress).
 * Runs the server-side `delete_students` function from
 * docs/teacher-delete-student.sql, which only lets a teacher delete students.
 * Returns how many accounts were actually deleted.
 */
export async function deleteStudents(studentIds: string[]): Promise<number> {
  if (studentIds.length === 0) return 0;
  const { data, error } = await supabase.rpc("delete_students", { student_ids: studentIds });
  if (error) {
    if (error.message.includes("delete_students")) {
      throw new Error(
        "O'chirish funksiyasi topilmadi. Supabase'da docs/teacher-delete-student.sql ni ishga tushiring."
      );
    }
    throw error;
  }
  return Number(data ?? 0);
}

/**
 * The questions a student got wrong in one exam attempt (loaded on demand
 * when the teacher opens that attempt). Teachers may read exam_answers — see
 * docs/teacher-schema.sql.
 */
export async function fetchAttemptWrongAnswers(attemptId: string): Promise<WrongAnswerDetail[]> {
  const { data, error } = await supabase
    .from("exam_answers")
    .select("word_id, question_type, is_correct, student_answer")
    .eq("attempt_id", attemptId);
  if (error) throw error;

  return (data ?? [])
    .filter((a) => !a.is_correct)
    .map((a) => {
      const word = wordById.get(a.word_id);
      // Questions asked for the Uzbek meaning have the Uzbek as the right
      // answer; the others (uz→kr, typing, fill-in) expect the Korean word.
      const wantsUzbek = a.question_type === "kr_to_uz" || a.question_type === "listening";
      return {
        wordId: a.word_id,
        koreanWord: word?.koreanWord ?? a.word_id,
        uzbekTranslation: word?.uzbekTranslation ?? "",
        correctAnswer: (wantsUzbek ? word?.uzbekTranslation : word?.koreanWord) ?? "",
        studentAnswer: a.student_answer ?? null,
      };
    });
}
