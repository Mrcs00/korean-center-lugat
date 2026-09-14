"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { normalize } from "@/lib/services/quizService";

interface Result {
  wordId: string;
  gotItRight: boolean;
  attempts: number;
}

function WriteContent() {
  const params = useSearchParams();
  const setId = params.get("set") ?? VOCAB_SETS[0]?.id;
  const { reviewWord } = useStore();

  const set = VOCAB_SETS.find((s) => s.id === setId);
  const words = VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState<"correct" | "incorrect" | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [done, setDone] = useState(false);
  const [seed, setSeed] = useState(0);

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

  const word = words[index];

  const speak = () => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(word.koreanWord);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  };

  const check = () => {
    if (!input.trim()) return;
    const isCorrect = normalize(input) === normalize(word.koreanWord);
    setAttempts((a) => a + 1);
    setRevealed(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      reviewWord(word.id, "correct");
    }
  };

  const retry = () => {
    setInput("");
    setRevealed(null);
  };

  const goNext = () => {
    const gotItRight = revealed === "correct";
    if (!gotItRight) reviewWord(word.id, "wrong");
    setResults((prev) => [...prev, { wordId: word.id, gotItRight, attempts: attempts + 1 }]);
    setInput("");
    setAttempts(0);
    setRevealed(null);
    if (index < words.length - 1) {
      setIndex(index + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const firstTry = results.filter((r) => r.gotItRight && r.attempts === 1).length;
    return (
      <div className="max-w-xl mx-auto px-5 py-10 text-center">
        <Card elevation="md" className="p-8">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Yozish mashqi tugadi</p>
          <p className="text-5xl font-extrabold mb-1 tabular-nums">
            {firstTry}/{words.length}
          </p>
          <p className="text-sm text-muted mb-6">bir urinishda to'g'ri yozilgan so'zlar</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIndex(0);
                setResults([]);
                setDone(false);
                setSeed((s) => s + 1);
              }}
            >
              <RotateCcw size={16} /> Qayta boshlash
            </Button>
            <Link href={`/vocabulary/${set.id}`} className="flex-1">
              <Button className="w-full">Lug'atga qaytish</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-8" key={seed}>
      <div className="flex items-center justify-between mb-4">
        <Link href={`/vocabulary/${set.id}`} className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-sm font-semibold text-muted">
          {index + 1} / {words.length}
        </span>
      </div>
      <ProgressBar value={index + 1} max={words.length} className="mb-6" />

      <Card elevation="md" className="p-8 text-center">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">
          Koreyscha yozing
        </p>
        <p className="text-2xl font-extrabold mb-6">{word.uzbekTranslation}</p>

        <input
          value={input}
          disabled={revealed !== null}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (revealed === null) check();
            }
          }}
          autoFocus
          placeholder="여기에 쓰세요..."
          className="font-kr w-full h-14 px-4 rounded-2xl border-2 border-border bg-background text-center text-2xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-90 mb-4"
        />

        {revealed === null && (
          <Button size="lg" className="w-full" disabled={!input.trim()} onClick={check}>
            Tekshirish
          </Button>
        )}

        {revealed === "correct" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl px-4 py-3 bg-green-soft text-green font-semibold text-sm flex items-center justify-center gap-2">
              To'g'ri yozildi! ✓
              <button onClick={speak} className="ml-1">
                <Volume2 size={16} />
              </button>
            </div>
            <Button size="lg" className="w-full" onClick={goNext}>
              {index < words.length - 1 ? "Keyingi so'z" : "Yakunlash"}
            </Button>
          </div>
        )}

        {revealed === "incorrect" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl px-4 py-3 bg-red-soft text-red font-semibold text-sm">
              Noto'g'ri. To'g'ri javob: <span className="font-kr">{word.koreanWord}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={retry}>
                Qayta yozish
              </Button>
              <Button className="flex-1" onClick={goNext}>
                {index < words.length - 1 ? "Keyingi so'z" : "Yakunlash"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function WritePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <WriteContent />
      </Suspense>
    </AppShell>
  );
}
