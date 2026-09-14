"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Table as TableIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WordCard } from "@/components/study/WordCard";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";

export default function VocabularySetPage() {
  const params = useParams<{ setId: string }>();
  const router = useRouter();
  const { progress, reviewWord } = useStore();
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"list" | "learn">("list");

  const set = VOCAB_SETS.find((s) => s.id === params.setId);
  const words = VOCAB_WORDS.filter((w) => w.setId === params.setId).sort((a, b) => a.order - b.order);

  if (!set) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p className="text-muted">To'plam topilmadi.</p>
          <Link href="/vocabulary" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
            Orqaga
          </Link>
        </div>
      </AppShell>
    );
  }

  if (words.length === 0) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-5 py-16 text-center">
          <p className="font-semibold mb-1">{set.title}</p>
          <p className="text-muted text-sm">Hozircha bu to'plamga so'z qo'shilmagan.</p>
          <Link href="/vocabulary" className="text-sm font-semibold text-brand-dark mt-4 inline-block">
            ← Boshqa to'plamni tanlash
          </Link>
        </div>
      </AppShell>
    );
  }

  if (mode === "learn") {
    const word = words[index];
    const handleRate = (rating: "unknown" | "partial" | "known") => {
      reviewWord(word.id, rating);
      if (index < words.length - 1) {
        setIndex(index + 1);
      } else {
        router.push(`/vocabulary/${set.id}`);
      }
    };

    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-5 py-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMode("list")} className="text-muted hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-muted">
              {index + 1} / {words.length}
            </span>
          </div>
          <ProgressBar value={index + 1} max={words.length} className="mb-6" />
          <WordCard word={word} onRate={handleRate} />
        </div>
      </AppShell>
    );
  }

  const masteredInSet = words.filter((w) => (progress[w.id]?.masteryLevel ?? 0) >= 3).length;
  const backHref = set.id.startsWith("seoul-")
    ? `/vocabulary/seoul-hangugo/${set.book ?? set.id.split("-")[1]}`
    : set.id.endsWith("-listening")
    ? "/vocabulary/past-exams/listening"
    : set.id.endsWith("-reading")
    ? "/vocabulary/past-exams/reading"
    : "/vocabulary";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground">
          <ArrowLeft size={16} /> Orqaga
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{set.title}</h1>
        </div>
        <p className="text-sm text-muted mb-4">{set.description}</p>

        <Card className="p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ProgressBar value={masteredInSet} max={words.length} className="flex-1" />
            <span className="text-sm font-semibold text-muted">
              {masteredInSet}/{words.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="lg"
              className="col-span-2"
              onClick={() => {
                setIndex(0);
                setMode("learn");
              }}
            >
              O'rganishni boshlash
            </Button>
            <Link href={`/flashcards?set=${set.id}`}>
              <Button variant="secondary" size="lg" className="w-full">
                Flashcard
              </Button>
            </Link>
            <Link href={`/vocabulary/${set.id}/table`}>
              <Button variant="secondary" size="lg" className="w-full">
                <TableIcon size={16} /> Jadval
              </Button>
            </Link>
            <Link href={`/quiz?set=${set.id}`}>
              <Button variant="secondary" size="lg" className="w-full">
                Test
              </Button>
            </Link>
            <Link href={`/write?set=${set.id}`}>
              <Button variant="secondary" size="lg" className="w-full">
                ✍️ Yozish
              </Button>
            </Link>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          {words.map((w) => {
            const p = progress[w.id];
            return (
              <button
                key={w.id}
                onClick={() => {
                  setIndex(words.indexOf(w));
                  setMode("learn");
                }}
                className="w-full text-left"
              >
                <Card className="p-4 flex items-center justify-between hover:border-foreground/15 transition-colors">
                  <div>
                    <p className="font-kr font-semibold">{w.koreanWord}</p>
                    <p className="text-xs text-muted">{w.uzbekTranslation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                        !p
                          ? "bg-black/[0.05] text-muted"
                          : p.masteryLevel >= 3
                          ? "bg-green/10 text-green"
                          : "bg-amber/10 text-amber"
                      }`}
                    >
                      {!p ? "Yangi" : p.masteryLevel >= 3 ? "O'zlashtirilgan" : "O'rganilmoqda"}
                    </span>
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
