"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExamEngine } from "@/components/study/ExamEngine";
import { CountPicker, CountSelection } from "@/components/study/CountPicker";
import { QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { buildQuiz, QuizQuestion } from "@/lib/services/quizService";
import {
  ExamSession,
  clearExamSession,
  examSessionKey,
  loadExamSession,
  saveExamSession,
} from "@/lib/services/examSession";
import { supabase } from "@/lib/supabase/client";
import { ExamAnswer, ExamAttempt } from "@/lib/types";

export default function ExamRunnerPage() {
  const params = useParams<{ setId: string }>();
  const router = useRouter();
  const { recordExamAttempt, reviewWord } = useStore();
  const [phase, setPhase] = useState<"loading" | "intro" | "running">("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [session, setSession] = useState<ExamSession | null>(null); // saved, resumable session
  const [sessionExpired, setSessionExpired] = useState(false);
  const [picking, setPicking] = useState(false); // choosing how many words to be tested on
  const sessionKeyRef = useRef<string | null>(null);
  const sessionRef = useRef<ExamSession | null>(null);
  const finishedRef = useRef(false);

  const set = VOCAB_SETS.find((s) => s.id === params.setId);
  // Exam questions follow the set's own word order (no shuffling).
  const words = VOCAB_WORDS.filter((w) => w.setId === params.setId).sort((a, b) => a.order - b.order);

  // Look for an unfinished exam for this user + set.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const key = examSessionKey(data.session?.user.id ?? null, params.setId);
      sessionKeyRef.current = key;
      const saved = loadExamSession(key);
      setSession(saved);
      setSessionExpired(saved?.endsAt ? saved.endsAt <= Date.now() : false);
      setPhase("intro");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [params.setId]);

  const startNew = ({ from, to }: CountSelection) => {
    const key = sessionKeyRef.current;
    const chosen = words.slice(from - 1, to);
    const qs = buildQuiz(chosen, chosen.length, { selectionMode: "ordered" });
    const now = Date.now();
    const fresh: ExamSession = {
      questions: qs,
      answers: {},
      index: 0,
      startedAt: now,
      endsAt: now + qs.length * 20 * 1000,
      savedAt: now,
    };
    sessionRef.current = fresh;
    if (key) saveExamSession(key, fresh);
    setQuestions(qs);
    setSession(fresh);
    setPhase("running");
  };

  const resume = () => {
    if (!session) return;
    sessionRef.current = session;
    setQuestions(session.questions);
    setPhase("running");
  };

  // Starting over from the intro: ask how many words first, and only drop
  // the old session once the new exam actually starts.
  const startFromPicker = (selection: CountSelection) => {
    if (sessionKeyRef.current) clearExamSession(sessionKeyRef.current);
    setPicking(false);
    startNew(selection);
  };

  const handleProgress = useCallback((answers: Record<number, string>, index: number) => {
    const key = sessionKeyRef.current;
    const current = sessionRef.current;
    if (!key || !current || finishedRef.current) return;
    const next = { ...current, answers, index, savedAt: Date.now() };
    sessionRef.current = next;
    saveExamSession(key, next);
  }, []);

  if (!set || words.length === 0) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-5 py-16 text-center">
          <p className="text-muted">Bu to'plamda savollar mavjud emas.</p>
          <Link href="/exam" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
            Orqaga
          </Link>
        </div>
      </AppShell>
    );
  }

  if (phase === "loading") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-muted">Yuklanmoqda...</div>
      </AppShell>
    );
  }

  if (phase === "intro") {
    const expired = sessionExpired;
    const answeredCount = session ? Object.keys(session.answers).length : 0;
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <Card className="p-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Vocabulary Exam
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">{set.title}</h1>
            <p className="text-muted text-sm mb-6">To'plamda {words.length} ta so'z</p>
            <ul className="text-sm text-left text-muted flex flex-col gap-1.5 mb-8 max-w-xs mx-auto">
              <li>⏱ Har bir savol uchun taxminan 20 soniya</li>
              <li>🔢 Savollar orasida erkin harakatlaning</li>
              <li>📊 Natija va xato so'zlar avtomatik saqlanadi</li>
            </ul>
            {session && !picking ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted mb-1">
                  {expired
                    ? "Oldingi imtihon vaqti tugagan."
                    : `Tugallanmagan imtihon bor: ${answeredCount} / ${session.questions.length} javob berilgan.`}
                </p>
                <Button size="lg" onClick={resume}>
                  {expired ? "Natijani ko'rish" : "Davom ettirish"}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setPicking(true)}>
                  Qaytadan boshlash
                </Button>
              </div>
            ) : (
              <>
                <CountPicker
                  total={words.length}
                  withRange
                  confirmLabel="Imtihonni boshlash"
                  onConfirm={startFromPicker}
                />
                {session && (
                  <button
                    type="button"
                    onClick={() => setPicking(false)}
                    className="text-xs text-muted hover:text-foreground mt-3"
                  >
                    ← Bekor qilish
                  </button>
                )}
              </>
            )}
          </Card>
        </div>
      </AppShell>
    );
  }

  const handleFinish = (results: QuizResultEntry[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sessionKeyRef.current) clearExamSession(sessionKeyRef.current);
    const skippedCount = results.filter((r) => r.studentAnswer === "").length;
    const wrongCount = results.filter((r) => !r.isCorrect && r.studentAnswer !== "").length;
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      studentId: "demo-student",
      setId: set.id,
      startedAt: new Date(session?.startedAt ?? Date.now()).toISOString(),
      submittedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      correctCount: results.filter((r) => r.isCorrect).length,
      wrongCount,
      skippedCount,
    };
    const answers: ExamAnswer[] = results
      .filter((r) => r.studentAnswer !== "")
      .map((r) => ({
        attemptId: attempt.id,
        wordId: r.wordId,
        questionType: r.type as ExamAnswer["questionType"],
        isCorrect: r.isCorrect,
        studentAnswer: r.studentAnswer,
      }));
    results
      .filter((r) => r.studentAnswer !== "")
      .forEach((r) => reviewWord(r.wordId, r.isCorrect ? "correct" : "wrong"));
    recordExamAttempt(attempt, answers);
    router.push(`/result/${attempt.id}`);
  };

  return (
    <AppShell>
      <div className="py-8 px-5">
        <ExamEngine
          questions={questions}
          endsAt={session?.endsAt ?? null}
          initialAnswers={session?.answers}
          initialIndex={session?.index}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />
      </div>
    </AppShell>
  );
}
