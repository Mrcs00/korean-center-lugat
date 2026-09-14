"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExamEngine } from "@/components/study/ExamEngine";
import { QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { buildQuiz } from "@/lib/services/quizService";
import { ExamAnswer, ExamAttempt } from "@/lib/types";

export default function ExamRunnerPage() {
  const params = useParams<{ setId: string }>();
  const router = useRouter();
  const { recordExamAttempt, reviewWord } = useStore();
  const [phase, setPhase] = useState<"intro" | "running">("intro");

  const set = VOCAB_SETS.find((s) => s.id === params.setId);
  const words = VOCAB_WORDS.filter((w) => w.setId === params.setId);

  const questions = useMemo(() => {
    // Server-side randomization + answer validation is simulated client-side
    // here; a real backend build would generate/validate this on the server
    // (see section 54/55 of the spec) so answers are never exposed up front.
    return buildQuiz(words, words.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.setId]);

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

  if (phase === "intro") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <Card className="p-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Vocabulary Exam
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">{set.title}</h1>
            <p className="text-muted text-sm mb-6">{words.length} ta savol</p>
            <ul className="text-sm text-left text-muted flex flex-col gap-1.5 mb-8 max-w-xs mx-auto">
              <li>⏱ Har bir savol uchun taxminan 20 soniya</li>
              <li>🔢 Savollar orasida erkin harakatlaning</li>
              <li>📊 Natija va xato so'zlar avtomatik saqlanadi</li>
            </ul>
            <Button size="lg" onClick={() => setPhase("running")}>
              Imtihonni boshlash
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  const handleFinish = (results: QuizResultEntry[]) => {
    const skippedCount = results.filter((r) => r.studentAnswer === "").length;
    const wrongCount = results.filter((r) => !r.isCorrect && r.studentAnswer !== "").length;
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      studentId: "demo-student",
      setId: set.id,
      startedAt: new Date().toISOString(),
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
        <ExamEngine questions={questions} timeLimitSec={questions.length * 20} onFinish={handleFinish} />
      </div>
    </AppShell>
  );
}
