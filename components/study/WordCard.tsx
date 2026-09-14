"use client";

import { Volume2 } from "lucide-react";
import { VocabularyWord, SelfRating } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { useMemoryShortcuts } from "@/lib/hooks/useMemoryShortcuts";

const POS_LABEL: Record<string, string> = {
  noun: "ot",
  verb: "fe'l",
  adjective: "sifat",
  adverb: "ravish",
  expression: "ibora",
};

export function WordCard({
  word,
  onRate,
}: {
  word: VocabularyWord;
  onRate?: (rating: SelfRating) => void;
}) {
  useMemoryShortcuts(onRate ?? (() => {}), Boolean(onRate));

  const speak = () => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(word.koreanWord);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  };

  return (
    <Card elevation="md" className="p-8 text-center">
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
          className="h-9 w-9 rounded-full bg-brand-soft flex items-center justify-center hover:bg-brand transition-colors active:scale-90"
        >
          <Volume2 size={16} className="text-brand-darker" />
        </button>
      </div>
      {word.pronunciation && <p className="text-sm text-muted-soft mb-5">[{word.pronunciation}]</p>}

      <p className={`text-xl font-bold ${word.exampleSentenceKo ? "mb-6" : "mb-2"}`}>{word.uzbekTranslation}</p>

      {word.exampleSentenceKo && (
        <div className="bg-black/[0.025] border border-border rounded-2xl p-4 text-left mb-4">
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

      {onRate && (
        <>
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => onRate("unknown")}
              className="flex-1 h-12 rounded-2xl bg-red-soft text-red font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
            >
              🔴 Bilmayman
            </button>
            <button
              onClick={() => onRate("partial")}
              className="flex-1 h-12 rounded-2xl bg-amber-soft text-amber font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
            >
              🟡 Qisman esladim
            </button>
            <button
              onClick={() => onRate("known")}
              className="flex-1 h-12 rounded-2xl bg-green-soft text-green font-semibold text-sm hover:brightness-95 transition-all active:scale-95"
            >
              🟢 Esladim
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-soft mt-3">
            Klaviatura: <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">1</kbd>{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">2</kbd>{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono">3</kbd>
          </p>
        </>
      )}
    </Card>
  );
}
