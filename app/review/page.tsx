"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuizEngine, QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { wordsDueForReview } from "@/lib/services/statsService";
import { buildQuiz, QuizQuestion } from "@/lib/services/quizService";
import { choiceOnly } from "@/lib/utils/examQuestions";

const SESSION_SIZE = 50; // words per review round

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Takrorlash is a test over the words that are due: the ones answered wrong or skipped earlier
// (and learned words whose review time has come). A correct answer marks the word as learned
// again; a wrong one keeps it in the queue.
export default function ReviewPage() {
  const { progress, reviewWord } = useStore();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [done, setDone] = useState<QuizResultEntry[] | null>(null);

  const dueIds = wordsDueForReview(progress);
  const dueWords = useMemo(() => VOCAB_WORDS.filter((w) => dueIds.includes(w.id)), [dueIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Words answered wrong most often come first.
  const startRound = () => {
    const first = [...dueWords]
      .sort((a, b) => (progress[b.id]?.wrongCount ?? 0) - (progress[a.id]?.wrongCount ?? 0))
      .slice(0, SESSION_SIZE);
    // a few extra words only as wrong-answer choices, so short rounds still have 4 options
    const extras = shuffle(VOCAB_WORDS.filter((w) => !first.some((f) => f.id === w.id))).slice(0, 40);
    const pool = [...first, ...extras];
    setDone(null);
    setQuestions(choiceOnly(buildQuiz(pool, first.length, { selectionMode: "ordered" }), pool));
  };

  // ── running ───────────────────────────────────────────────────────
  if (questions && !done) {
    return (
      <AppShell>
        <div className="px-5 py-8">
          <button
            type="button"
            onClick={() => setQuestions(null)}
            className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground max-w-xl mx-auto w-full"
          >
            <ArrowLeft size={16} /> Orqaga
          </button>
          <QuizEngine
            questions={questions}
            onAnswer={(entry) => reviewWord(entry.wordId, entry.isCorrect ? "correct" : "wrong")}
            onFinish={setDone}
          />
        </div>
      </AppShell>
    );
  }

  // ── result ────────────────────────────────────────────────────────
  if (done) {
    const correct = done.filter((d) => d.isCorrect).length;
    const wrong = done.length - correct;
    return (
      <AppShell>
        <div className="animate-page max-w-lg mx-auto px-5 py-12 text-center">
          <Card elevation="md" className="p-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Takrorlash natijasi</p>
            <p className="text-5xl font-extrabold mb-1 tabular-nums">
              {correct}/{done.length}
            </p>
            <p className="text-sm text-muted mb-6">
              {wrong === 0 ? "Hammasini to'g'ri topdingiz! 🎉" : `${wrong} ta so'z takrorlash navbatida qoldi.`}
            </p>
            <div className="flex gap-2">
              {dueWords.length > 0 && (
                <Button variant="secondary" className="flex-1" onClick={startRound}>
                  Yana takrorlash
                </Button>
              )}
              <Link href="/student" className="flex-1">
                <Button className="w-full">Bosh sahifaga</Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // ── start screen ──────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="animate-page max-w-lg mx-auto px-5 py-16 text-center">
        <div className="h-20 w-20 rounded-3xl bg-brand shadow-[var(--shadow-brand)] flex items-center justify-center mx-auto mb-6 text-4xl">
          🔄
        </div>
        {dueWords.length > 0 ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">
              Bugun {dueWords.length} ta so'zni takrorlash kerak.
            </h1>
            <p className="text-sm text-muted mb-8">
              Testlarda xato qilgan yoki o'tkazib yuborgan so'zlaringiz shu yerda chiqadi. To'g'ri topsangiz, so'z yana o'rganilgan hisoblanadi.
            </p>
            <Button size="lg" onClick={startRound}>
              Takrorlashni boshlash
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">🎉 Bugun takrorlash uchun so'z qolmadi!</h1>
            <p className="text-sm text-muted mb-8">Yangi so'zlarni o'rganish uchun lug'atlar bo'limiga o'ting.</p>
            <Link href="/vocabulary">
              <Button size="lg">Lug'atlarga o'tish</Button>
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
