"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flashcard } from "@/components/study/Flashcard";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { parseRange, rangeLabel } from "@/lib/utils/examSets";

// Flashcards are only for looking at the words: they do not change the student's progress.
// A word counts as learned only when it is answered correctly in a test or exam.
function FlashcardsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const setId = params.get("set") ?? VOCAB_SETS[0]?.id;
  const [index, setIndex] = useState(0);

  const set = VOCAB_SETS.find((s) => s.id === setId);
  const fromParam = params.get("from");
  const toParam = params.get("to");
  // A teacher's assignment can limit the cards to a range, e.g. ?from=100&to=170.
  const { words, range } = useMemo(() => {
    const all = VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);
    const r = parseRange(fromParam, toParam, all.length);
    return { words: r ? all.slice(r.from - 1, r.to) : all, range: r };
  }, [setId, fromParam, toParam]);
  const word = words[index];
  const isFirst = index === 0;
  const isLast = index >= words.length - 1;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => {
    if (!set) return;
    if (index < words.length - 1) setIndex((i) => i + 1);
    else router.push(`/vocabulary/${set.id}`);
  }, [set, index, words.length, router]);

  // ← and → keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  if (!set || words.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <p className="text-muted">Bu to'plamda so'z topilmadi.</p>
        <Link href="/vocabulary" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
          Lug'atlarga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/vocabulary/${set.id}`} className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-sm font-semibold text-muted">
          {range && <span className="text-brand-darker mr-2">{rangeLabel(range.from, range.to)}</span>}
          {index + 1} / {words.length}
        </span>
      </div>
      <ProgressBar value={index + 1} max={words.length} className="mb-6" />

      <Flashcard key={word.id} word={word} />

      <div className="flex items-center gap-2 mt-6">
        <Button variant="secondary" size="lg" className="flex-1" disabled={isFirst} onClick={prev}>
          <ChevronLeft size={18} /> Oldingi
        </Button>
        <Button size="lg" className="flex-1" onClick={next}>
          {isLast ? "Tugatish" : "Keyingi"} <ChevronRight size={18} />
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted-soft mt-3">
        Klaviatura: <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">←</kbd> oldingi ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">→</kbd> keyingi
      </p>
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <FlashcardsContent />
      </Suspense>
    </AppShell>
  );
}
