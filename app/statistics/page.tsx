"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import {
  masteredCount,
  learningCount,
  newCount,
  setProgressPercent,
  estimateTopikLevel,
} from "@/lib/services/statsService";

export default function StatisticsPage() {
  const { profile, progress, examAttempts, dailyActivity } = useStore();

  const mastered = masteredCount(progress);
  const learning = learningCount(progress);
  const fresh = newCount(progress);
  const wrongWords = Object.values(progress).filter((p) => p.wrongCount > 0).length;
  const avgExamScore =
    examAttempts.length > 0
      ? Math.round(
          examAttempts.reduce((sum, a) => sum + (a.correctCount / a.totalQuestions) * 100, 0) /
            examAttempts.length
        )
      : null;

  const levelEstimate = estimateTopikLevel(progress);
  const sortedSets = [...VOCAB_SETS].sort((a, b) => a.setNumber - b.setNumber);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const a = dailyActivity[key];
    return { key, count: (a?.newWords ?? 0) + (a?.reviewedWords ?? 0) };
  });
  const maxDay = Math.max(1, ...last7Days.map((d) => d.count));

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-6">Statistika</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Umumiy so'zlar" value={VOCAB_WORDS.length} />
          <StatCard label="O'zlashtirilgan" value={mastered} accent />
          <StatCard label="O'rganilmoqda" value={learning} />
          <StatCard label="Xato so'zlar" value={wrongWords} />
        </div>

        <Card className="p-5 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            Haftalik faollik
          </p>
          <div className="flex items-end gap-2 h-28">
            {last7Days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-lg bg-brand"
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 96)}px` }}
                />
                <span className="text-[10px] text-muted">
                  {new Date(d.key).toLocaleDateString("uz-UZ", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card elevation="md" className="p-5 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
            Sizning hozirgi darajangiz
          </p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl font-extrabold tracking-tight">
              {levelEstimate.level !== null ? `TOPIK ${levelEstimate.level}` : "—"}
            </span>
            <span className="text-xs text-muted-soft">
              {levelEstimate.masteredTotal}/{levelEstimate.totalWords} so'z ({levelEstimate.percentMastered}%)
            </span>
          </div>
          <ProgressBar value={levelEstimate.progressToNext} />
          {levelEstimate.level === null && (
            <p className="text-xs text-muted mt-2">
              TOPIK 3 darajasi uchun {levelEstimate.wordsToNextLevel} ta so'z qoldi
            </p>
          )}
        </Card>

        <Card className="p-5 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
            To'plamlar bo'yicha progress
          </p>
          <div className="flex flex-col gap-3">
            {sortedSets.map((set) => {
              const pct = setProgressPercent(set.id, progress);
              return (
                <div key={set.id} className="flex items-center gap-3">
                  <span className="font-kr text-sm font-semibold w-32 shrink-0 truncate">{set.title}</span>
                  <ProgressBar value={pct} className="flex-1" />
                  <span className="text-sm font-semibold text-muted w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Imtihonlar" value={examAttempts.length} />
          <StatCard
            label="O'rtacha ball"
            value={avgExamScore !== null ? `${avgExamScore}%` : "—"}
          />
          <StatCard label="Streak" value={`${profile.streak} kun`} />
          <StatCard label="XP" value={profile.xp} />
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="p-4">
      <p className={`text-2xl font-extrabold ${accent ? "text-brand-dark" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </Card>
  );
}
