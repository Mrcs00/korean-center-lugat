"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_WORDS = [
  { ko: "설레다", pron: "seol-le-da", uz: "hayajonlanmoq" },
  { ko: "극복하다", pron: "geuk-bok-ha-da", uz: "yengib o'tmoq" },
  { ko: "궁금하다", pron: "gung-geum-ha-da", uz: "qiziqmoq" },
  { ko: "성장하다", pron: "seong-jang-ha-da", uz: "o'sib rivojlanmoq" },
];

export function HeroFlashcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFlipped((f) => {
        if (f) {
          // was showing translation → move to next word, front side
          setIndex((i) => (i + 1) % DEMO_WORDS.length);
          return false;
        }
        return true;
      });
    }, 1700);
    return () => clearInterval(t);
  }, []);

  const word = DEMO_WORDS[index];

  return (
    <div className="relative h-80 flex items-center justify-center [perspective:1400px]">
      {/* Back stack cards for depth */}
      <div
        className="absolute w-64 h-40 rounded-3xl bg-brand-soft border border-border rotate-[-8deg] translate-x-3 translate-y-4 animate-float"
        style={{ ["--r" as string]: "-8deg" }}
      />
      <div
        className="absolute w-64 h-40 rounded-3xl bg-surface border border-border rotate-[6deg] -translate-x-2 -translate-y-2 shadow-[var(--shadow-sm)] animate-float"
        style={{ ["--r" as string]: "6deg", animationDelay: "1.2s" }}
      />

      {/* Front interactive card */}
      <motion.div
        className="relative w-64 h-40 [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden] bg-surface border border-border-strong rounded-3xl shadow-[var(--shadow-lg)] flex flex-col items-center justify-center gap-1.5 px-6">
          <AnimatePresence mode="wait">
            {!flipped && (
              <motion.div
                key={word.ko}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-1.5"
              >
                <h3 className="font-kr text-3xl font-bold">{word.ko}</h3>
                <p className="text-xs text-muted">[{word.pron}]</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-brand to-brand-dark rounded-3xl shadow-[var(--shadow-lg)] flex items-center justify-center px-6">
          <p className="text-xl font-extrabold text-foreground">{word.uz}</p>
        </div>
      </motion.div>
    </div>
  );
}
