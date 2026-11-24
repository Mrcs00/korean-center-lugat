"use client";

import Link from "next/link";
import { BookOpenCheck, Clock, GraduationCap, Layers, ListChecks, Table, Target } from "lucide-react";
import type { RealAssignment } from "@/lib/services/assignmentService";
import { examSetTitle, rangeLabel, rangeProgressPercent } from "@/lib/utils/examSets";
import { useStore } from "@/lib/store/progressStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "./ui";

const actionCls =
  "flex-1 h-10 rounded-xl border border-border bg-surface hover:border-border-strong text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors";

// A vocabulary assignment sent to the group (set practice or a book exam).
export function VocabAssignmentCard({ a }: { a: RealAssignment }) {
  const { progress, examAttempts } = useStore();
  const isBookExam = a.kind === "book_exam" && Boolean(a.bookId);
  const hasRange = Boolean(a.wordFrom && a.wordTo);
  const rangeQuery = hasRange ? `&from=${a.wordFrom}&to=${a.wordTo}` : "";

  const attempts = examAttempts.filter((x) => x.setId === a.setId);
  const bestScore = attempts.reduce((best, x) => Math.max(best, Math.round((x.correctCount / Math.max(x.totalQuestions, 1)) * 100)), 0);
  const pct = isBookExam ? bestScore : rangeProgressPercent(a.setId, a.wordFrom, a.wordTo, progress);
  const met = pct >= a.minimumMastery && (!isBookExam || attempts.length > 0);

  return (
    <div className="rounded-2xl bg-surface border border-border p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isBookExam ? <BookOpenCheck size={16} className="text-brand-darker shrink-0" /> : <Target size={16} className="text-brand-darker shrink-0" />}
          <span className="font-kr font-semibold truncate">{examSetTitle(a.setId)}</span>
        </div>
        {isBookExam ? (
          <Badge tone="brand">{a.questionCount ?? 50} ta savol</Badge>
        ) : (
          hasRange && <Badge tone="brand">{rangeLabel(a.wordFrom!, a.wordTo!)}</Badge>
        )}
      </div>
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-muted flex items-center gap-1">
          <Clock size={12} /> Muddat: {a.deadline ?? "Muddatsiz"}
        </span>
        <span className={`font-bold ${met ? "text-green" : "text-brand-darker"}`}>
          {isBookExam && attempts.length === 0 ? "Topshirilmagan" : `${pct}%`} {met && "✓"}
        </span>
      </div>
      <ProgressBar value={pct} max={100} />
      <p className="text-[11px] text-muted-soft mt-2">
        {isBookExam ? "O'tish bali" : "Talab qilingan"}: {a.minimumMastery}%{met ? " — bajarildi!" : ""}
      </p>

      <div className={`mt-4 ${isBookExam ? "flex gap-2" : "grid grid-cols-2 gap-2"}`}>
        {isBookExam ? (
          <Link href={`/exam/seoul-hangugo/${a.bookId}/umumiy`} className={`${actionCls} bg-brand-soft border-transparent`}>
            <GraduationCap size={14} /> Topshirish
          </Link>
        ) : (
          <>
            <Link href={`/flashcards?set=${a.setId}${rangeQuery}`} className={actionCls}>
              <Layers size={14} /> Flashcard
            </Link>
            <Link href={`/vocabulary/${a.setId}/table${hasRange ? `?from=${a.wordFrom}&to=${a.wordTo}` : ""}`} className={actionCls}>
              <Table size={14} /> Jadval
            </Link>
            <Link href={`/quiz?set=${a.setId}${rangeQuery}`} className={actionCls}>
              <ListChecks size={14} /> Test
            </Link>
            <Link href={`/exam/${a.setId}${hasRange ? `?from=${a.wordFrom}&to=${a.wordTo}` : ""}`} className={`${actionCls} bg-brand-soft border-transparent`}>
              <GraduationCap size={14} /> Topshirish
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
