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
import { fetchAllRows } from "../supabase/fetchAll";
import { enqueueAttempt, enqueueProgress, startSync } from "../services/syncQueue";
import { tashkentDateKey } from "../utils/dates";

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

// "Today" is the Tashkent calendar day (see lib/utils/dates.ts).
function todayIso(): string {
  return tashkentDateKey();
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
  /** true if the student's saved progress could not be loaded (nothing is written until it can) */
  loadError: boolean;
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
  // present once docs/logic-upgrade.sql has been run
  verified_level?: number | null;
  verified_next_at?: string | null;
  verified_correct_at?: string | null;
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
    verifiedLevel: (row.verified_level ?? 0) as VocabularyProgress["masteryLevel"],
    verifiedNextAt: row.verified_next_at ?? new Date().toISOString(),
    verifiedCorrectAt: row.verified_correct_at ?? null,
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
  const [loadError, setLoadError] = useState(false);
  // Synchronous mirrors of the state: reviewWord is often called many times in
  // one go (finishing an exam), so each call must see the previous call's result.
  const progressRef = useRef<Record<string, VocabularyProgress>>({});
  const stateRef = useRef<PersistedState>(state);
  const metaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Retry a few times; if the progress still cannot be read we must NOT let
    // the student continue, otherwise their blank screen would be saved over
    // their real progress.
    const attemptLoad = async () => {
      const [profileRes, progressRows, attemptRows, answerRows, activityRes] = await Promise.all([
        supabase.from("profiles").select("full_name, xp, level, daily_goal").eq("id", uid).single(),
        fetchAllRows<ProgressRow>((from, to) =>
          supabase.from("vocabulary_progress").select("*").eq("student_id", uid).order("word_id").range(from, to)
        ),
        fetchAllRows<AttemptRow>((from, to) =>
          supabase.from("exam_attempts").select("*").eq("student_id", uid).order("started_at", { ascending: false }).order("id").range(from, to)
        ),
        fetchAllRows<AnswerRow>((from, to) =>
          supabase.from("exam_answers").select("*").eq("student_id", uid).order("attempt_id").order("word_id").range(from, to)
        ),
        supabase.from("daily_activity").select("*").eq("student_id", uid),
      ]);
      return { profileRow: profileRes.data, progressRows, attemptRows, answerRows, activityRows: activityRes.data };
    };

    let loaded: Awaited<ReturnType<typeof attemptLoad>> | null = null;
    for (let i = 0; i < 3 && !loaded; i++) {
      try {
        loaded = await attemptLoad();
      } catch (err) {
        console.error("loading progress failed", err);
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
    if (!loaded) {
      setLoadError(true);
      return;
    }
    setLoadError(false);

    const { profileRow, progressRows, attemptRows, answerRows, activityRows } = loaded;

    const progress: Record<string, VocabularyProgress> = {};
    progressRows.forEach((r) => {
      progress[r.word_id] = progressFromRow(uid, r);
    });
    progressRef.current = progress;

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
      examAttempts: attemptRows.map((r) => attemptFromRow(uid, r)),
      examAnswers: answerRows.map((r) => answerFromRow(r)),
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

  useEffect(() => {
    progressRef.current = state.progress;
    stateRef.current = state;
  }, [state]);

  // Send anything left over from earlier visits, and keep retrying in the
  // background (connection back, tab hidden) while a student is signed in.
  useEffect(() => {
    if (!userId) return;
    return startSync(userId);
  }, [userId]);

  // XP and today's activity are saved together, shortly after the last change
  // (one request instead of one per answered word, and always the newest value).
  const flushMeta = useCallback(async () => {
    if (!userId || loadError) return;
    const s = stateRef.current;
    const date = todayIso();
    const today = s.dailyActivity[date];
    const results = await Promise.all([
      supabase.from("profiles").update({ xp: s.profile.xp }).eq("id", userId),
      today
        ? supabase.from("daily_activity").upsert({
            student_id: userId,
            date,
            new_words: today.newWords,
            reviewed_words: today.reviewedWords,
            xp_earned: today.xpEarned,
          })
        : Promise.resolve({ error: null }),
    ]);
    results.forEach(({ error }) => {
      if (error) console.error("xp/activity sync failed", error);
    });
  }, [userId, loadError]);

  const scheduleMetaSync = useCallback(() => {
    if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
    metaTimerRef.current = setTimeout(() => void flushMeta(), 1500);
  }, [flushMeta]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") void flushMeta();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [flushMeta]);

  const getProgress = useCallback(
    (wordId: string): VocabularyProgress => {
      return state.progress[wordId] ?? defaultProgress(userId ?? DEMO_STUDENT_ID, wordId);
    },
    [state.progress, userId]
  );

  const addXp = useCallback(
    (amount: number) => {
      setState((prev) => ({ ...prev, profile: { ...prev.profile, xp: prev.profile.xp + amount } }));
      scheduleMetaSync();
    },
    [scheduleMetaSync]
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
        return { ...prev, dailyActivity: { ...prev.dailyActivity, [date]: updated } };
      });
      scheduleMetaSync();
    },
    [scheduleMetaSync]
  );

  const reviewWord = useCallback(
    (wordId: string, outcome: SelfRating | "correct" | "wrong") => {
      if (userId && loadError) return; // never save over progress we could not load
      const sid = userId ?? DEMO_STUDENT_ID;
      const prevWord = progressRef.current[wordId] ?? defaultProgress(sid, wordId);
      const isNew = prevWord.timesSeen === 0;
      const updated = applyReview(prevWord, outcome);

      progressRef.current = { ...progressRef.current, [wordId]: updated };
      setState((prev) => ({ ...prev, progress: { ...prev.progress, [wordId]: updated } }));

      if (userId) {
        enqueueProgress(userId, {
          student_id: userId,
          word_id: wordId,
          mastery_level: updated.masteryLevel,
          correct_count: updated.correctCount,
          wrong_count: updated.wrongCount,
          times_seen: updated.timesSeen,
          confidence: updated.confidence,
          last_reviewed_at: updated.lastReviewedAt,
          next_review_at: updated.nextReviewAt,
          verified_level: updated.verifiedLevel,
          verified_next_at: updated.verifiedNextAt,
          verified_correct_at: updated.verifiedCorrectAt,
        });
      }

      const gain = outcome === "known" || outcome === "correct" ? 10 : 2;
      addXp(gain);
      bumpDailyActivity({ newWords: isNew ? 1 : 0, reviewedWords: 1, xpEarned: gain });
    },
    [userId, loadError, addXp, bumpDailyActivity]
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
        enqueueAttempt(userId, {
          attemptSaved: false,
          attempt: {
            id: attempt.id,
            set_id: attempt.setId,
            started_at: attempt.startedAt,
            submitted_at: attempt.submittedAt,
            total_questions: attempt.totalQuestions,
            correct_count: attempt.correctCount,
            wrong_count: attempt.wrongCount,
            skipped_count: attempt.skippedCount,
          },
          answers: answers.map((a) => ({
            word_id: a.wordId,
            question_type: a.questionType,
            is_correct: a.isCorrect,
            student_answer: a.studentAnswer,
          })),
        });
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
      try {
        window.localStorage.removeItem(`progress-queue-v1:${userId}`);
        window.localStorage.removeItem(`attempt-queue-v1:${userId}`);
      } catch {
        // ignore
      }
      progressRef.current = {};
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
      loadError,
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
      loadError,
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
