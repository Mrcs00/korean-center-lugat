"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { VocabularyWord } from "@/lib/types";

export function Flashcard({ word }: { word: VocabularyWord }) {
  const [flipped, setFlipped] = useState(false);

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(word.koreanWord);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  };

  return (
    <div
      className="relative h-72 [perspective:1200px] cursor-pointer select-none"
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-surface border border-border rounded-3xl shadow-[0_8px_24px_-12px_rgba(23,23,15,0.12)] flex flex-col items-center justify-center gap-3 px-6">
          <h2 className="font-kr text-4xl font-bold">{word.koreanWord}</h2>
          {word.pronunciation && <p className="text-sm text-muted">[{word.pronunciation}]</p>}
          <button
            onClick={speak}
            aria-label="Talaffuzni eshitish"
            className="h-10 w-10 rounded-full bg-brand-soft flex items-center justify-center hover:bg-brand transition-colors mt-1"
          >
            <Volume2 size={18} className="text-brand-dark" />
          </button>
          <p className="text-xs text-muted absolute bottom-5">Bosib ko'ring</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-brand-soft border border-border rounded-3xl flex flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <p className="text-2xl font-extrabold">{word.uzbekTranslation}</p>
          {word.exampleSentenceKo && <p className="font-kr text-sm text-foreground/70">{word.exampleSentenceKo}</p>}
          {word.exampleSentenceUz && <p className="text-xs text-muted">{word.exampleSentenceUz}</p>}
        </div>
      </motion.div>
    </div>
  );
}
