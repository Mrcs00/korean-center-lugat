"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { VocabularyWord } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const POS_LABEL: Record<string, string> = {
  noun: "ot",
  verb: "fe'l",
  adjective: "sifat",
  adverb: "ravish",
  expression: "ibora",
};

// Just shows a word. With onPrev / onNext it also shows "Oldingi" / "Keyingi" (and the ← → keys work).
// Looking at a word never changes the student's progress; only tests do.
export function WordCard({
  word,
  onPrev,
  onNext,
  isFirst = false,
  isLast = false,
}: {
  word: VocabularyWord;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  useEffect(() => {
    if (!onPrev && !onNext) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft" && onPrev && !isFirst) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, isFirst]);

  const speak = () => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(word.koreanWord);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  };

  return (
    <Card elevation="md" className="p-8 sm:p-10 text-center">
      {(word.partOfSpeech || word.topic) && (
        <span className="inline-block text-[11px] font-bold text-brand-darker bg-brand-soft px-2.5 py-1 rounded-full mb-5">
          {[word.partOfSpeech && POS_LABEL[word.partOfSpeech], word.topic].filter(Boolean).join(" · ")}
        </span>
      )}

      <div className="flex items-center justify-center gap-3 mb-2">
        <h2 className="font-kr text-4xl font-extrabold tracking-tight">{word.koreanWord}</h2>
        <button
          onClick={speak}
          aria-label="Talaffuzni eshitish"
          className="h-10 w-10 rounded-full bg-brand-soft flex items-center justify-center hover:bg-brand transition-colors active:scale-90 shadow-[var(--shadow-xs)]"
        >
          <Volume2 size={16} className="text-brand-darker" />
        </button>
      </div>
      {word.pronunciation && <p className="text-sm text-muted-soft mb-5">[{word.pronunciation}]</p>}

      <p className={`text-xl font-bold ${word.exampleSentenceKo ? "mb-6" : "mb-2"}`}>{word.uzbekTranslation}</p>

      {word.exampleSentenceKo && (
        <div className="bg-black/[0.025] dark:bg-white/[0.04] border border-border rounded-2xl p-4 text-left mb-4">
          <p className="font-kr text-sm mb-1.5">{word.exampleSentenceKo}</p>
          {word.exampleSentenceUz && <p className="text-sm text-muted">{word.exampleSentenceUz}</p>}
        </div>
      )}

      {(word.synonym || word.antonym) && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted mb-2">
          {word.synonym && (
            <span>
              Sinonim: <span className="font-kr font-semibold text-foreground">{word.synonym}</span>
            </span>
          )}
          {word.antonym && (
            <span>
              Antonim: <span className="font-kr font-semibold text-foreground">{word.antonym}</span>
            </span>
          )}
        </div>
      )}

      {(onPrev || onNext) && (
        <div className="flex items-center gap-2 mt-6">
          <Button variant="secondary" size="lg" className="flex-1" disabled={isFirst || !onPrev} onClick={onPrev}>
            <ChevronLeft size={18} /> Oldingi
          </Button>
          <Button size="lg" className="flex-1" disabled={!onNext} onClick={onNext}>
            {isLast ? "Tugatish" : "Keyingi"} <ChevronRight size={18} />
          </Button>
        </div>
      )}
    </Card>
  );
}
