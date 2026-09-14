"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordCard } from "@/components/study/WordCard";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { wordsDueForReview } from "@/lib/services/statsService";

export default function ReviewPage() {
  const { progress, reviewWord } = useStore();
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const dueIds = wordsDueForReview(progress);
  const dueWords = VOCAB_WORDS.filter((w) => dueIds.includes(w.id));

  if (!started) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <div className="h-16 w-16 rounded-3xl bg-brand-soft flex items-center justify-center mx-auto mb-5 text-3xl">
            🔄
          </div>
          {dueWords.length > 0 ? (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                Bugun {dueWords.length} ta so'zni takrorlash kerak.
              </h1>
              <p className="text-sm text-muted mb-8">
                Faqat vaqti kelgan so'zlar chiqadi — spaced repetition asosida.
              </p>
              <Button size="lg" onClick={() => setStarted(true)}>
                Takrorlashni boshlash
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                🎉 Bugun takrorlash uchun so'z qolmadi!
              </h1>
              <p className="text-sm text-muted mb-8">
                Yangi so'zlarni o'rganish uchun lug'atlar bo'limiga o'ting.
              </p>
              <Link href="/vocabulary">
                <Button size="lg">Lug'atlarga o'tish</Button>
              </Link>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  const word = dueWords[index];

  if (!word) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">🎉 Ajoyib ish!</h1>
          <p className="text-sm text-muted mb-8">Barcha takrorlash yakunlandi.</p>
          <Link href="/dashboard">
            <Button size="lg">Bosh sahifaga</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleRate = (rating: "unknown" | "partial" | "known") => {
    reviewWord(word.id, rating);
    setIndex(index + 1);
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="text-muted hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-semibold text-muted">
            {index + 1} / {dueWords.length}
          </span>
        </div>
        <ProgressBar value={index + 1} max={dueWords.length} className="mb-6" />
        <WordCard word={word} onRate={handleRate} />
      </div>
    </AppShell>
  );
}
