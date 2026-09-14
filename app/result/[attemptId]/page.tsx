"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { CircularScore } from "@/components/study/CircularScore";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";

export default function ExamResultPage() {
  const params = useParams<{ attemptId: string }>();
  const { examAttempts, examAnswers } = useStore();

  const attempt = examAttempts.find((a) => a.id === params.attemptId);

  if (!attempt) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <p className="text-muted">Natija topilmadi.</p>
          <Link href="/exam" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
            Imtihonlarga qaytish
          </Link>
        </div>
      </AppShell>
    );
  }

  const set = VOCAB_SETS.find((s) => s.id === attempt.setId);
  const percent = Math.round((attempt.correctCount / attempt.totalQuestions) * 100);
  const emoji = percent >= 90 ? "🎉" : percent >= 70 ? "👍" : percent >= 50 ? "💪" : "📚";
  const label = percent >= 90 ? "A'lo!" : percent >= 70 ? "Yaxshi!" : percent >= 50 ? "Yomon emas" : "Ko'proq mashq kerak";

  const wrongAnswers = examAnswers.filter((a) => a.attemptId === attempt.id && !a.isCorrect);
  const wrongWords = wrongAnswers
    .map((a) => VOCAB_WORDS.find((w) => w.id === a.wordId))
    .filter(Boolean);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-5 py-10">
        <Card elevation="md" className="p-8 text-center mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
            {set?.title ?? attempt.setId} Vocabulary Exam
          </p>
          <p className="font-kr text-sm text-muted-soft mb-5">
            {attempt.correctCount} / {attempt.totalQuestions}
          </p>

          <div className="flex justify-center mb-5">
            <CircularScore percent={percent} />
          </div>

          <p className="text-lg font-semibold mb-6">
            {emoji} {label}
          </p>

          <div className="grid grid-cols-3 gap-3 text-center mb-6">
            <div>
              <p className="text-xl font-bold text-green">✓ {attempt.correctCount}</p>
              <p className="text-[11px] text-muted">To'g'ri</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red">× {attempt.wrongCount}</p>
              <p className="text-[11px] text-muted">Xato</p>
            </div>
            <div>
              <p className="text-xl font-bold text-muted">○ {attempt.skippedCount}</p>
              <p className="text-[11px] text-muted">O'tkazib yuborilgan</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {wrongWords.length > 0 && (
              <Link href="/wrong-words" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Xato so'zlarni ko'rish
                </Button>
              </Link>
            )}
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">Bosh sahifaga</Button>
            </Link>
          </div>
        </Card>

        {wrongWords.length > 0 && (
          <>
            <p className="text-sm font-semibold text-muted mb-2">
              Siz {wrongWords.length} ta so'zni xato qildingiz.
            </p>
            <div className="flex flex-col gap-2">
              {wrongWords.map((w) => (
                <Card key={w!.id} className="p-4 flex items-center justify-between">
                  <span className="font-kr font-semibold">{w!.koreanWord}</span>
                  <span className="text-sm text-muted">{w!.uzbekTranslation}</span>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
