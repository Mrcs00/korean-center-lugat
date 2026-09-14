"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Flashcard } from "@/components/study/Flashcard";
import { useStore } from "@/lib/store/progressStore";
import { useMemoryShortcuts } from "@/lib/hooks/useMemoryShortcuts";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { SelfRating } from "@/lib/types";

function FlashcardsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const setId = params.get("set") ?? VOCAB_SETS[0]?.id;
  const { reviewWord } = useStore();
  const [index, setIndex] = useState(0);

  const set = VOCAB_SETS.find((s) => s.id === setId);
  const words = VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);
  const word = words[index];

  const handleRate = useCallback(
    (rating: SelfRating) => {
      if (!word || !set) return;
      reviewWord(word.id, rating);
      if (index < words.length - 1) {
        setIndex((i) => i + 1);
      } else {
        router.push(`/vocabulary/${set.id}`);
      }
    },
    [word, set, index, words.length, reviewWord, router]
  );

  useMemoryShortcuts(handleRate, Boolean(word));

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
          {index + 1} / {words.length}
        </span>
      </div>
      <ProgressBar value={index + 1} max={words.length} className="mb-6" />

      <Flashcard key={word.id} word={word} />

      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handleRate("unknown")}
          className="flex-1 h-12 rounded-2xl bg-red-soft text-red font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
        >
          🔴 Bilmayman
        </button>
        <button
          onClick={() => handleRate("partial")}
          className="flex-1 h-12 rounded-2xl bg-amber-soft text-amber font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
        >
          🟡 Qisman esladim
        </button>
        <button
          onClick={() => handleRate("known")}
          className="flex-1 h-12 rounded-2xl bg-green-soft text-green font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
        >
          🟢 Esladim
        </button>
      </div>
      <p className="text-center text-[11px] text-muted-soft mt-3">
        Klaviatura: <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">1</kbd> Bilmayman ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">2</kbd> Qisman ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">3</kbd> Esladim
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
