"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DailyActivity,
  ExamAnswer,
  ExamAttempt,
  Profile,
  SelfRating,
  VocabularyProgress,
} from "../types";
import { applyReview, defaultProgress } from "../services/spacedRepetition";
import { computeStreak } from "../services/statsService";
import { VOCAB_WORDS } from "../data/seed";
import { supabase } from "../supabase/client";

const STORAGE_KEY = "topik-trainer-state-v1"; // local/offline-demo fallback only
const DEMO_STUDENT_ID = "demo-student";

interface PersistedState {
  profile: Profile;
  progress: Record<string, VocabularyProgress>; // wordId -> progress
  examAttempts: ExamAttempt[];
  examAnswers: ExamAnswer[];
  dailyActivity: Record<string, DailyActivity>; // date -> activity
  dailyGoal: number; // student-configurable daily word goal
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): PersistedState {
  return {
    profile: {
      id: DEMO_STUDENT_ID,
      fullName: "Ali Valiyev",
      email: "ali@example.com",
      role: "student",
      level: 3,
      xp: 420,
      streak: 0,
      createdAt: new Date().toISOString(),
    },
    progress: {},
    examAttempts: [],
    examAnswers: [],
    dailyActivity: {},
    dailyGoal: 20,
  };
}

interface StoreApi {
  profile: Profile;
  progress: Record<string, VocabularyProgress>;
  examAttempts: ExamAttempt[];
  examAnswers: ExamAnswer[];
  dailyActivity: Record<string, DailyActivity>;
  dailyGoal: number;
  isLoggedIn: boolean;
  getProgress: (wordId: string) => VocabularyProgress;
  reviewWord: (wordId: string, outcome: SelfRating | "correct" | "wrong") => void;
  addXp: (amount: number) => void;
  recordExamAttempt: (attempt: ExamAttempt, answers: ExamAnswer[]) => void;
  setDailyGoal: (goal: number) => void;
  syncAuthProfile: (info: { fullName: string; email?: string }) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

// ── Supabase row <-> app type mapping ───────────────────────────────────
interface ProgressRow {
  word_id: string;
  mastery_level: number;
  correct_count: number;
  wrong_count: number;
  times_seen: number;
  confidence: number;
  last_reviewed_at: string | null;
  next_review_at: string;
}
function progressFromRow(uid: string, row: ProgressRow): VocabularyProgress {
  return {
    studentId: uid,
    wordId: row.word_id,
    masteryLevel: row.mastery_level as VocabularyProgress["masteryLevel"],
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    timesSeen: row.times_seen,
    confidence: row.confidence,
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
  };
}

interface AttemptRow {
  id: string;
  set_id: string;
  started_at: string;
  submitted_at: string | null;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
}
function attemptFromRow(uid: string, row: AttemptRow): ExamAttempt {
  return {
    id: row.id,
    studentId: uid,
    setId: row.set_id,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    totalQuestions: row.total_questions,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    skippedCount: row.skipped_count,
  };
}

interface AnswerRow {
  attempt_id: string;
  word_id: string;
  question_type: string;
  is_correct: boolean;
  student_answer: string | null;
}
function answerFromRow(row: AnswerRow): ExamAnswer {
  return {
    attemptId: row.attempt_id,
    wordId: row.word_id,
    questionType: row.question_type as ExamAnswer["questionType"],
    isCorrect: row.is_correct,
    studentAnswer: row.student_answer ?? "",
  };
}

interface ActivityRow {
  date: string;
  new_words: number;
  reviewed_words: number;
  xp_earned: number;
}
function activityFromRow(row: ActivityRow): DailyActivity {
  return { date: row.date, newWords: row.new_words, reviewedWords: row.reviewed_words, xpEarned: row.xp_earned };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const loadedUserRef = useRef<string | null>(null);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...defaultState(), ...JSON.parse(raw) });
        return;
      }
    } catch {
      // ignore corrupt state
    }
    setState(defaultState());
  }, []);

  const loadFromSupabase = useCallback(async (uid: string) => {
    loadedUserRef.current = uid;

    const [{ data: profileRow }, { data: progressRows }, { data: attemptRows }, { data: answerRows }, { data: activityRows }] =
      await Promise.all([
        supabase.from("profiles").select("full_name, xp, level, daily_goal").eq("id", uid).single(),
        supabase.from("vocabulary_progress").select("*").eq("student_id", uid),
        supabase.from("exam_attempts").select("*").eq("student_id", uid).order("started_at", { ascending: false }),
        supabase.from("exam_answers").select("*").eq("student_id", uid),
        supabase.from("daily_activity").select("*").eq("student_id", uid),
      ]);

    const progress: Record<string, VocabularyProgress> = {};
    (progressRows ?? []).forEach((r) => {
      progress[r.word_id] = progressFromRow(uid, r as ProgressRow);
    });

    const dailyActivity: Record<string, DailyActivity> = {};
    (activityRows ?? []).forEach((r) => {
      dailyActivity[r.date] = activityFromRow(r as ActivityRow);
    });

    setState({
      profile: {
        id: uid,
        fullName: profileRow?.full_name ?? "O'quvchi",
        email: "",
        role: "student",
        level: profileRow?.level ?? 1,
        xp: profileRow?.xp ?? 0,
        streak: 0, // recomputed below from dailyActivity
        createdAt: new Date().toISOString(),
      },
      progress,
      examAttempts: (attemptRows ?? []).map((r) => attemptFromRow(uid, r as AttemptRow)),
      examAnswers: (answerRows ?? []).map((r) => answerFromRow(r as AnswerRow)),
      dailyActivity,
      dailyGoal: profileRow?.daily_goal ?? 20,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (uid) {
        await loadFromSupabase(uid);
      } else {
        loadFromLocalStorage();
      }
      if (!cancelled) setHydrated(true);
    }
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        if (loadedUserRef.current !== uid) loadFromSupabase(uid);
      } else {
        loadedUserRef.current = null;
        loadFromLocalStorage();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage only in offline/demo mode — logged-in users'
  // canonical data lives in Supabase (written per-action below).
  useEffect(() => {
    if (!hydrated || userId) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated, userId]);

  const getProgress = useCallback(
    (wordId: string): VocabularyProgress => {
      return state.progress[wordId] ?? defaultProgress(userId ?? DEMO_STUDENT_ID, wordId);
    },
    [state.progress, userId]
  );

  const addXp = useCallback(
    (amount: number) => {
      setState((prev) => {
        const newXp = prev.profile.xp + amount;
        if (userId) {
          supabase
            .from("profiles")
            .update({ xp: newXp })
            .eq("id", userId)
            .then(({ error }) => {
              if (error) console.error("xp sync failed", error);
            });
        }
        return { ...prev, profile: { ...prev.profile, xp: newXp } };
      });
    },
    [userId]
  );

  const bumpDailyActivity = useCallback(
    (patch: Partial<DailyActivity>) => {
      const date = todayIso();
      setState((prev) => {
        const existing = prev.dailyActivity[date] ?? { date, newWords: 0, reviewedWords: 0, xpEarned: 0 };
        const updated: DailyActivity = {
          date,
          newWords: existing.newWords + (patch.newWords ?? 0),
          reviewedWords: existing.reviewedWords + (patch.reviewedWords ?? 0),
          xpEarned: existing.xpEarned + (patch.xpEarned ?? 0),
        };
        if (userId) {
          supabase
            .from("daily_activity")
            .upsert({
              student_id: userId,
              date,
              new_words: updated.newWords,
              reviewed_words: updated.reviewedWords,
              xp_earned: updated.xpEarned,
            })
            .then(({ error }) => {
              if (error) console.error("daily activity sync failed", error);
            });
        }
        return { ...prev, dailyActivity: { ...prev.dailyActivity, [date]: updated } };
      });
    },
    [userId]
  );

  const reviewWord = useCallback(
    (wordId: string, outcome: SelfRating | "correct" | "wrong") => {
      const sid = userId ?? DEMO_STUDENT_ID;
      const current = state.progress[wordId] ?? defaultProgress(sid, wordId);
      const isNew = current.timesSeen === 0;

      setState((prev) => {
        const prevWord = prev.progress[wordId] ?? defaultProgress(sid, wordId);
        const updated = applyReview(prevWord, outcome);
        if (userId) {
          supabase
            .from("vocabulary_progress")
            .upsert({
              student_id: userId,
              word_id: wordId,
              mastery_level: updated.masteryLevel,
              correct_count: updated.correctCount,
              wrong_count: updated.wrongCount,
              times_seen: updated.timesSeen,
              confidence: updated.confidence,
              last_reviewed_at: updated.lastReviewedAt,
              next_review_at: updated.nextReviewAt,
            })
            .then(({ error }) => {
              if (error) console.error("progress sync failed", error);
            });
        }
        return { ...prev, progress: { ...prev.progress, [wordId]: updated } };
      });

      const gain = outcome === "known" || outcome === "correct" ? 10 : 2;
      addXp(gain);
      bumpDailyActivity({ newWords: isNew ? 1 : 0, reviewedWords: 1, xpEarned: gain });
    },
    [state.progress, userId, addXp, bumpDailyActivity]
  );

  const recordExamAttempt = useCallback(
    (attempt: ExamAttempt, answers: ExamAnswer[]) => {
      setState((prev) => ({
        ...prev,
        examAttempts: [attempt, ...prev.examAttempts],
        examAnswers: [...answers, ...prev.examAnswers],
      }));
      addXp(100);
      bumpDailyActivity({});

      if (userId) {
        supabase
          .from("exam_attempts")
          .insert({
            id: attempt.id,
            student_id: userId,
            set_id: attempt.setId,
            started_at: attempt.startedAt,
            submitted_at: attempt.submittedAt,
            total_questions: attempt.totalQuestions,
            correct_count: attempt.correctCount,
            wrong_count: attempt.wrongCount,
            skipped_count: attempt.skippedCount,
          })
          .then(({ error }) => {
            if (error) console.error("exam attempt sync failed", error);
          });

        if (answers.length > 0) {
          supabase
            .from("exam_answers")
            .insert(
              answers.map((a) => ({
                attempt_id: attempt.id,
                student_id: userId,
                word_id: a.wordId,
                question_type: a.questionType,
                is_correct: a.isCorrect,
                student_answer: a.studentAnswer,
              }))
            )
            .then(({ error }) => {
              if (error) console.error("exam answers sync failed", error);
            });
        }
      }
    },
    [userId, addXp, bumpDailyActivity]
  );

  const setDailyGoal = useCallback(
    (goal: number) => {
      const clamped = Math.max(5, Math.min(200, Math.round(goal)));
      setState((prev) => ({ ...prev, dailyGoal: clamped }));
      if (userId) {
        supabase
          .from("profiles")
          .update({ daily_goal: clamped })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error("daily goal sync failed", error);
          });
      }
    },
    [userId]
  );

  const syncAuthProfile = useCallback((info: { fullName: string; email?: string }) => {
    // Instant local update right after login/register, before the fuller
    // Supabase fetch (triggered by the auth state change) resolves.
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, fullName: info.fullName, email: info.email ?? prev.profile.email },
    }));
  }, []);

  const reset = useCallback(async () => {
    if (userId) {
      await Promise.all([
        supabase.from("vocabulary_progress").delete().eq("student_id", userId),
        supabase.from("exam_attempts").delete().eq("student_id", userId), // exam_answers cascade
        supabase.from("daily_activity").delete().eq("student_id", userId),
        supabase.from("profiles").update({ xp: 0, level: 1 }).eq("id", userId),
      ]);
      setState((prev) => ({
        ...prev,
        progress: {},
        examAttempts: [],
        examAnswers: [],
        dailyActivity: {},
        profile: { ...prev.profile, xp: 0, level: 1 },
      }));
    } else {
      setState(defaultState());
    }
  }, [userId]);

  const computedProfile: Profile = useMemo(
    () => ({ ...state.profile, streak: computeStreak(state.dailyActivity) }),
    [state.profile, state.dailyActivity]
  );

  const value = useMemo<StoreApi>(
    () => ({
      profile: computedProfile,
      progress: state.progress,
      examAttempts: state.examAttempts,
      examAnswers: state.examAnswers,
      dailyActivity: state.dailyActivity,
      dailyGoal: state.dailyGoal,
      isLoggedIn: userId !== null,
      getProgress,
      reviewWord,
      addXp,
      recordExamAttempt,
      setDailyGoal,
      syncAuthProfile,
      reset,
    }),
    [
      computedProfile,
      state.progress,
      state.examAttempts,
      state.examAnswers,
      state.dailyActivity,
      state.dailyGoal,
      userId,
      getProgress,
      reviewWord,
      addXp,
      recordExamAttempt,
      setDailyGoal,
      syncAuthProfile,
      reset,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within ProgressProvider");
  return ctx;
}

export function allWordIds(): string[] {
  return VOCAB_WORDS.map((w) => w.id);
}
