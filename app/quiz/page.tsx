"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuizEngine, QuizResultEntry } from "@/components/study/QuizEngine";
import { CountPicker } from "@/components/study/CountPicker";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { buildQuiz } from "@/lib/services/quizService";

function QuizContent() {
  const params = useSearchParams();
  const setId = params.get("set") ?? VOCAB_SETS[0]?.id;
  const { reviewWord } = useStore();
  const [seed, setSeed] = useState(0);
  const [done, setDone] = useState<QuizResultEntry[] | null>(null);
  // null = still choosing. from/to are 1-based word positions within the set.
  const [config, setConfig] = useState<{ from: number; to: number; questions: number } | null>(null);

  const words = VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);

  // Questions are drawn at random (and shuffled) from only the words the
  // student chose, e.g. words 1–35 of the set.
  const questions = useMemo(() => {
    if (words.length === 0 || config === null) return [];
    const chosen = words.slice(config.from - 1, config.to);
    return buildQuiz(chosen, Math.min(config.questions, chosen.length), { selectionMode: "random" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId, seed, words.length, config]);

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

  if (config === null) {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <Link
          href={`/vocabulary/${setId}`}
          className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground"
        >
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <Card className="p-7">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Test</p>
          <h1 className="font-kr text-xl font-extrabold mb-5">
            {VOCAB_SETS.find((s) => s.id === setId)?.title}
          </h1>
          <p className="text-sm text-muted mb-5">
            Qaysi so'zlarni yodlaganingizni tanlang, savollar faqat shulardan tasodifiy chiqadi.
          </p>
          <CountPicker
            total={words.length}
            withRange
            withQuestionCount
            defaultQuestions={10}
            confirmLabel="Testni boshlash"
            onConfirm={({ from, to, questions: q }) => setConfig({ from, to, questions: q })}
          />
        </Card>
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
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setConfig(null);
            }}
            className="text-xs text-muted hover:text-foreground mt-4"
          >
            Sozlamalarni o'zgartirish
          </button>
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
