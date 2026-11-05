"use client";

import Link from "next/link";
import { Flame, ChevronRight, Zap, RotateCw, Trophy, TrendingUp, Shuffle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import {
  masteredCount,
  wordsDueForReview,
  estimateTopikLevel,
} from "@/lib/services/statsService";


export default function DashboardPage() {
  const { profile, progress, dailyActivity, dailyGoal } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = dailyActivity[today] ?? { newWords: 0, reviewedWords: 0, xpEarned: 0 };
  const dailyDone = Math.min(dailyGoal, todayActivity.newWords + todayActivity.reviewedWords);
  const dailyGoalMet = dailyDone >= dailyGoal;

  const mainSet = VOCAB_SETS[0];
  const mainSetWords = VOCAB_WORDS.filter((w) => w.setId === mainSet?.id);
  const mainSetDoneCount = mainSetWords.filter((w) => (progress[w.id]?.masteryLevel ?? 0) >= 3).length;
  const mainSetPct = mainSetWords.length > 0 ? Math.round((mainSetDoneCount / mainSetWords.length) * 100) : 0;
  const wordsLeft = mainSetWords.length - mainSetDoneCount;

  const dueWords = wordsDueForReview(progress);
  const totalMastered = masteredCount(progress);
  const levelEstimate = estimateTopikLevel(progress);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Xush kelibsiz, {profile.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Bugungi TOPIK maqsadingizni bajarishga tayyormisiz?
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-brand-soft px-3.5 py-2 rounded-2xl shrink-0">
            <Flame size={17} className="text-amber" />
            <span className="font-bold text-sm">{profile.streak} kun</span>
          </div>
        </div>

        {/* Today's mission — primary visual focus */}
        {mainSet && (
          <Card elevation="md" className="p-6 md:p-7 mb-4 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-soft/60 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-brand-darker uppercase tracking-wider">
                  Bugungi maqsad
                </p>
                <Link
                  href={`/vocabulary/${mainSet.id}`}
                  className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  Ko'rish <ChevronRight size={13} />
                </Link>
              </div>
              <h2 className="font-kr text-2xl md:text-[1.7rem] font-extrabold tracking-tight mb-4">
                {mainSet.title} lug'atlari
              </h2>
              <div className="flex items-end justify-between mb-2.5">
                <span className="text-3xl font-extrabold tabular-nums">
                  {mainSetDoneCount}
                  <span className="text-lg text-muted-soft font-semibold"> / {mainSetWords.length}</span>
                </span>
                <span className="text-2xl font-extrabold text-brand-darker tabular-nums">{mainSetPct}%</span>
              </div>
              <ProgressBar value={mainSetDoneCount} max={mainSetWords.length || 1} className="mb-3" />
              <p className="text-xs text-muted mb-4">
                {wordsLeft > 0 ? `${wordsLeft} ta so'z qoldi` : "Barcha so'zlar o'zlashtirildi 🎉"}
              </p>
              <Link href={`/vocabulary/${mainSet.id}`}>
                <span className="inline-flex h-12 px-6 items-center rounded-2xl bg-brand text-foreground text-sm font-bold hover:bg-brand-dark transition-all shadow-[var(--shadow-brand)] active:scale-95">
                  Davom etish →
                </span>
              </Link>
            </div>
          </Card>
        )}

        {/* Estimated TOPIK level — derived from overall vocabulary mastery,
            not tied to any single set. */}
        <Card elevation="md" className="p-6 mb-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3 text-muted">
            <TrendingUp size={15} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sizning hozirgi darajangiz</span>
          </div>
          <div className="flex items-end justify-between mb-3">
            <span className="text-4xl font-extrabold tracking-tight">
              {levelEstimate.level !== null ? `TOPIK ${levelEstimate.level}` : "—"}
            </span>
            <span className="text-xs text-muted-soft text-right">
              {levelEstimate.masteredTotal.toLocaleString()} / {levelEstimate.totalWords.toLocaleString()}
              <br />
              so'z o'zlashtirilgan ({levelEstimate.percentMastered}%)
            </span>
          </div>
          <ProgressBar value={levelEstimate.progressToNext} className="mb-2" />
          <p className="text-xs text-muted">
            {levelEstimate.level === null
              ? `TOPIK 3 darajasi uchun lug'atingiz hali yetarli emas — ${levelEstimate.wordsToNextLevel} ta so'z qoldi`
              : levelEstimate.nextLevelAtPercent !== null
              ? `TOPIK ${levelEstimate.level + 1} darajasiga ${levelEstimate.wordsToNextLevel} ta so'z qoldi`
              : "Eng yuqori daraja qo'lga kiritildi 🏆"}
          </p>
        </Card>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2 text-muted">
              <Zap size={15} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Kunlik maqsad</span>
            </div>
            <p className="text-2xl font-extrabold mb-1 tabular-nums">
              {dailyDone}/{dailyGoal}{" "}
              <span className="text-sm font-medium text-muted">so'z</span>
            </p>
            <ProgressBar value={dailyDone} max={dailyGoal} />
            {dailyGoalMet && (
              <p className="text-xs font-semibold text-green mt-2">🎉 Bugungi maqsad bajarildi</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2 text-muted">
              <Trophy size={15} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Umumiy o'zlashtirilgan</span>
            </div>
            <p className="text-2xl font-extrabold tabular-nums">
              {totalMastered.toLocaleString()}{" "}
              <span className="text-sm font-medium text-muted">so'z</span>
            </p>
            <p className="text-xs text-muted mt-2">{profile.xp} XP · Daraja {profile.level}</p>
          </Card>
        </div>

        {/* Quick review */}
        <Card className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
              <RotateCw size={19} className="text-brand-darker" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm flex items-center gap-1.5">
                <span>⚡</span> Tezkor takrorlash
              </p>
              <p className="text-xs text-muted truncate">
                {dueWords.length > 0
                  ? `Bugun ${dueWords.length} ta so'zni takrorlash kerak.`
                  : "Bugun takrorlash uchun so'z qolmadi 🎉"}
              </p>
            </div>
          </div>
          <Link
            href="/review"
            className="h-10 px-4 rounded-xl bg-foreground text-background text-sm font-semibold flex items-center hover:opacity-90 transition-opacity shrink-0"
          >
            Boshlash →
          </Link>
        </Card>

        {/* 50-word random test */}
        <Card className="p-5 mt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
              <Shuffle size={19} className="text-brand-darker" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm flex items-center gap-1.5">
                <span>🎲</span> 50 talik random test
              </p>
              <p className="text-xs text-muted truncate">
                Zaif so'zlar yoki tanlagan to'plamdan — vaqtsiz amaliy test
              </p>
            </div>
          </div>
          <Link
            href="/random-test"
            className="h-10 px-4 rounded-xl bg-surface border border-border text-sm font-semibold flex items-center hover:border-border-strong transition-colors shrink-0"
          >
            Boshlash →
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
