"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Shuffle, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuizEngine, QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { buildQuiz } from "@/lib/services/quizService";
import { rankForQuiz, defaultProgress } from "@/lib/services/spacedRepetition";

const TEST_LENGTH = 50;

function RandomTestContent() {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode"); // "weak" | "set" | null
  const setId = params.get("set");
  const { progress, reviewWord } = useStore();
  const [seed, setSeed] = useState(0);
  const [done, setDone] = useState<QuizResultEntry[] | null>(null);

  const setWords = setId ? VOCAB_WORDS.filter((w) => w.setId === setId) : [];
  const chosenSet = setId ? VOCAB_SETS.find((s) => s.id === setId) : null;

  const questions = useMemo(() => {
    if (mode === "weak") {
      const progressList = VOCAB_WORDS.map((w) => progress[w.id] ?? defaultProgress("demo-student", w.id));
      const ranked = rankForQuiz(progressList).map((p) => VOCAB_WORDS.find((w) => w.id === p.wordId)!);
      return buildQuiz(ranked, Math.min(TEST_LENGTH, ranked.length), { selectionMode: "ranked" });
    }
    if (mode === "set" && setWords.length > 0) {
      return buildQuiz(setWords, Math.min(TEST_LENGTH, setWords.length));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, setId, seed]);

  // ── Hub: pick a mode ──────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground">
          <ArrowLeft size={16} /> Bosh sahifa
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{TEST_LENGTH} talik random test</h1>
        <p className="text-sm text-muted mb-6">Vaqtsiz amaliy test — javob berilgach darhol natija ko'rasiz.</p>

        <div className="flex flex-col gap-4">
          <Card
            interactive
            className="p-5"
            onClick={() => router.push("/random-test?mode=weak")}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                <Target size={20} className="text-brand-darker" />
              </div>
              <div>
                <p className="font-bold">Zaif so'zlar bo'yicha</p>
                <p className="text-xs text-muted mt-0.5">
                  Barcha to'plamlardan — ko'proq xato qilgan va zaif so'zlar ustuvor chiqadi
                </p>
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                <Shuffle size={20} className="text-brand-darker" />
              </div>
              <div>
                <p className="font-bold">To'plam tanlab, tasodifiy</p>
                <p className="text-xs text-muted mt-0.5">Faqat tanlagan to'plamingizdan tasodifiy so'zlar</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 pl-1">
              {VOCAB_SETS.filter((s) => VOCAB_WORDS.some((w) => w.setId === s.id)).map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/random-test?mode=set&set=${s.id}`)}
                  className="text-left"
                >
                  <Card interactive className="p-3.5">
                    <p className="font-kr font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {VOCAB_WORDS.filter((w) => w.setId === s.id).length} ta so'z
                    </p>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <p className="text-muted">So'z topilmadi.</p>
        <Link href="/random-test" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
          Orqaga
        </Link>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────
  if (done) {
    const correct = done.filter((d) => d.isCorrect).length;
    return (
      <div className="max-w-xl mx-auto px-5 py-10 text-center">
        <Card elevation="md" className="p-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Natija</p>
          <p className="text-5xl font-extrabold mb-1 tabular-nums">
            {correct}/{done.length}
          </p>
          <p className="text-lg font-bold text-brand-darker mb-6">
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
            <Link href="/random-test" className="flex-1">
              <Button className="w-full">Yangi test</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Running test ──────────────────────────────────────────────────
  return (
    <div className="px-5 py-8">
      <Link
        href="/random-test"
        className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground max-w-xl mx-auto"
      >
        <ArrowLeft size={16} /> Orqaga
      </Link>
      <p className="text-center text-xs font-semibold text-muted mb-4">
        {mode === "weak" ? "Zaif so'zlar bo'yicha" : `${chosenSet?.title ?? ""} — tasodifiy`}
      </p>
      <QuizEngine
        questions={questions}
        onAnswer={(entry) => reviewWord(entry.wordId, entry.isCorrect ? "correct" : "wrong")}
        onFinish={setDone}
      />
    </div>
  );
}

export default function RandomTestPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <RandomTestContent />
      </Suspense>
    </AppShell>
  );
}
