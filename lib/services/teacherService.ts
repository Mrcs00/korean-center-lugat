import { supabase } from "../supabase/client";
import { VOCAB_WORDS } from "../data/seed";
import { masteredCount as computeMasteredCount } from "./statsService";
import { VocabularyProgress } from "../types";

export interface RealStudent {
  id: string;
  fullName: string;
  username: string;
  group: string | null;
  groupId: string | null;
  totalMastered: number;
  masteryPercent: number;
  wrongWords: { wordId: string; koreanWord: string; uzbekTranslation: string; timesWrong: number }[];
  lastExamSetId: string | null;
  lastExamScore: string | null;
  avgExamScore: number | null;
}

const wordById = new Map(VOCAB_WORDS.map((w) => [w.id, w]));

/**
 * Fetches every student profile, their group, and their progress in a
 * handful of queries, then assembles it all client-side. Requires the
 * logged-in account to have role='teacher' (see docs/teacher-schema.sql) —
 * RLS otherwise only exposes each student their own rows.
 */
export async function fetchRealStudents(): Promise<RealStudent[]> {
  const [{ data: profiles, error: profilesError }, { data: memberships }, { data: allProgress }, { data: attempts }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, username").eq("role", "student"),
      supabase.from("group_members").select("student_id, group_id, groups(name)"),
      supabase.from("vocabulary_progress").select("student_id, word_id, mastery_level, wrong_count"),
      supabase
        .from("exam_attempts")
        .select("student_id, set_id, correct_count, total_questions, started_at")
        .order("started_at", { ascending: false }),
    ]);

  if (profilesError) throw profilesError;

  const groupByStudent = new Map<string, { id: string; name: string }>();
  (memberships ?? []).forEach((m) => {
    const groupName = (m.groups as unknown as { name: string } | null)?.name;
    if (groupName) groupByStudent.set(m.student_id, { id: m.group_id, name: groupName });
  });

  const progressByStudent = new Map<string, VocabularyProgress[]>();
  (allProgress ?? []).forEach((row) => {
    const list = progressByStudent.get(row.student_id) ?? [];
    list.push({
      studentId: row.student_id,
      wordId: row.word_id,
      masteryLevel: row.mastery_level,
      correctCount: 0,
      wrongCount: row.wrong_count,
      timesSeen: 1,
      confidence: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date().toISOString(),
    } as VocabularyProgress);
    progressByStudent.set(row.student_id, list);
  });

  const attemptsByStudent = new Map<string, typeof attempts>();
  (attempts ?? []).forEach((a) => {
    const list = attemptsByStudent.get(a.student_id) ?? [];
    list.push(a);
    attemptsByStudent.set(a.student_id, list as typeof attempts);
  });

  return (profiles ?? []).map((p) => {
    const progressList = progressByStudent.get(p.id) ?? [];
    const progressMap: Record<string, VocabularyProgress> = {};
    progressList.forEach((pr) => (progressMap[pr.wordId] = pr));
    const totalMastered = computeMasteredCount(progressMap);
    const masteryPercent =
      VOCAB_WORDS.length > 0 ? Math.round((totalMastered / VOCAB_WORDS.length) * 100) : 0;

    const wrongWords = progressList
      .filter((pr) => pr.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 10)
      .map((pr) => {
        const word = wordById.get(pr.wordId);
        return {
          wordId: pr.wordId,
          koreanWord: word?.koreanWord ?? pr.wordId,
          uzbekTranslation: word?.uzbekTranslation ?? "",
          timesWrong: pr.wrongCount,
        };
      });

    const studentAttempts = attemptsByStudent.get(p.id) ?? [];
    const lastAttempt = studentAttempts[0];
    const avgExamScore =
      studentAttempts.length > 0
        ? Math.round(
            studentAttempts.reduce((sum, a) => sum + (a!.correct_count / a!.total_questions) * 100, 0) /
              studentAttempts.length
          )
        : null;

    return {
      id: p.id,
      fullName: p.full_name,
      username: p.username,
      group: groupByStudent.get(p.id)?.name ?? null,
      groupId: groupByStudent.get(p.id)?.id ?? null,
      totalMastered,
      masteryPercent,
      wrongWords,
      lastExamSetId: lastAttempt?.set_id ?? null,
      lastExamScore: lastAttempt ? `${lastAttempt.correct_count}/${lastAttempt.total_questions}` : null,
      avgExamScore,
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
