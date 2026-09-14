"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Brain, Target, BarChart3, Flame } from "lucide-react";
import { HeroFlashcards } from "@/components/study/HeroFlashcards";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const FEATURES = [
  { icon: BookOpen, label: "TOPIK 3—6 lug'atlari", note: "professional daraja" },
  { icon: Brain, label: "Spaced Repetition", note: "avtomatik takrorlash" },
  { icon: Target, label: "Vocabulary Exam", note: "vaqt bilan" },
  { icon: BarChart3, label: "Progress", note: "so'zma-so'z" },
  { icon: Flame, label: "Streak", note: "kunlik odat" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-grain overflow-x-clip">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center font-black shadow-[var(--shadow-brand)]">
            토
          </div>
          <span className="font-bold text-lg tracking-tight">Korean Center Lug'at</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-semibold text-muted hover:text-foreground transition-colors"
          >
            Kirish
          </Link>
          <Link
            href="/register"
            className="h-10 px-5 rounded-2xl bg-brand text-foreground text-sm font-semibold flex items-center hover:bg-brand-dark transition-all shadow-[var(--shadow-brand)] active:scale-95"
          >
            Boshlash
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-soft text-foreground/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              TOPIK 3—6 uchun professional platforma
            </div>
            <h1 className="text-4xl md:text-[3.4rem] font-extrabold tracking-tight leading-[1.05]">
              Yuqori daraja TOPIK lug'atlarini yodlang.{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Test orqali</span>
                <span className="absolute left-0 right-0 bottom-1 h-3 bg-brand/60 -z-0 rounded-sm" />
              </span>{" "}
              o'zingizni tekshiring.
            </h1>
            <p className="mt-6 text-lg text-muted max-w-lg">
              TOPIK 3, 4, 5 va 6 darajalari uchun so'zlarni yodlang, avtomatik takrorlang va imtihonga tayyorlaning — bitta professional platformada.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="h-14 px-8 rounded-2xl bg-brand text-foreground font-bold flex items-center hover:bg-brand-dark transition-all shadow-[var(--shadow-brand)] active:scale-95"
              >
                Boshlash
              </Link>
              <Link
                href="/dashboard"
                className="h-14 px-8 rounded-2xl bg-surface border border-border font-semibold flex items-center hover:border-border-strong transition-colors shadow-[var(--shadow-xs)]"
              >
                Demo ko'rish
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 flex-wrap">
              {FEATURES.map(({ icon: Icon, label, note }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-brand-darker" strokeWidth={2.25} />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-soft">{note}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
          >
            <HeroFlashcards />
          </motion.div>
        </div>

        <p className="mt-24 text-sm text-muted text-center max-w-md mx-auto">
          Bu sayt oddiy dictionary emas — so'z yodlash va o'zingizni imtihon
          qilish uchun.
        </p>
      </main>
    </div>
  );
}
