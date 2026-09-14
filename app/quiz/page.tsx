"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuizEngine, QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { buildQuiz } from "@/lib/services/quizService";
import { rankForQuiz } from "@/lib/services/spacedRepetition";
import { defaultProgress } from "@/lib/services/spacedRepetition";

function QuizContent() {
  const params = useSearchParams();
  const setId = params.get("set") ?? VOCAB_SETS[0]?.id;
  const { progress, reviewWord } = useStore();
  const [seed, setSeed] = useState(0);
  const [done, setDone] = useState<QuizResultEntry[] | null>(null);

  const words = VOCAB_WORDS.filter((w) => w.setId === setId);

  const questions = useMemo(() => {
    if (words.length === 0) return [];
    const progressList = words.map((w) => progress[w.id] ?? defaultProgress("demo-student", w.id));
    const ranked = rankForQuiz(progressList).map((p) => words.find((w) => w.id === p.wordId)!);
    return buildQuiz(ranked, Math.min(10, words.length), { selectionMode: "ranked" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId, seed, words.length]);

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <p className="text-muted">Bu to'plamda so'z topilmadi.</p>
        <Link href="/vocabulary" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
          Lug'atlarga qaytish
        </Link>
      </div>
    );
  }

  if (done) {
    const correct = done.filter((d) => d.isCorrect).length;
    return (
      <div className="max-w-xl mx-auto px-5 py-10 text-center">
        <Card className="p-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Natija</p>
          <p className="text-5xl font-extrabold mb-1">
            {correct}/{done.length}
          </p>
          <p className="text-lg font-bold text-brand-dark mb-6">
            {Math.round((correct / done.length) * 100)}%
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDone(null);
                setSeed((s) => s + 1);
              }}
            >
              <RotateCcw size={16} /> Qayta boshlash
            </Button>
            <Link href={`/vocabulary/${setId}`} className="flex-1">
              <Button className="w-full">Lug'atga qaytish</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-5 py-8">
      <Link
        href={`/vocabulary/${setId}`}
        className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground max-w-xl mx-auto"
      >
        <ArrowLeft size={16} /> Orqaga
      </Link>
      <QuizEngine
        questions={questions}
        onAnswer={(entry) => reviewWord(entry.wordId, entry.isCorrect ? "correct" : "wrong")}
        onFinish={setDone}
      />
    </div>
  );
}

export default function QuizPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <QuizContent />
      </Suspense>
    </AppShell>
  );
}
