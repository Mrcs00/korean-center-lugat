import { VOCAB_WORDS } from "../data/seed";
import { VocabularyProgress, DailyActivity } from "../types";
import { isDueForReview } from "./spacedRepetition";

/**
 * Real, activity-derived streak — counts consecutive days (ending today or
 * yesterday, so the streak doesn't drop to zero the instant midnight
 * passes before the student has studied yet) with at least one new or
 * reviewed word. Works the same whether dailyActivity came from
 * localStorage (demo mode) or Supabase (logged-in mode).
 */
export function computeStreak(dailyActivity: Record<string, DailyActivity>): number {
  const hasActivity = (iso: string) => {
    const a = dailyActivity[iso];
    return !!a && (a.newWords > 0 || a.reviewedWords > 0);
  };
  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  const cursor = new Date();
  if (!hasActivity(toIso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (hasActivity(toIso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function wordsDueForReview(progress: Record<string, VocabularyProgress>): string[] {
  return VOCAB_WORDS.filter((w) => {
    const p = progress[w.id];
    if (!p || p.timesSeen === 0) return false; // only "seen" words are reviewed, not new ones
    return isDueForReview(p);
  }).map((w) => w.id);
}

export function masteredCount(progress: Record<string, VocabularyProgress>): number {
  return Object.values(progress).filter((p) => p.masteryLevel >= 3).length;
}

export function learningCount(progress: Record<string, VocabularyProgress>): number {
  return Object.values(progress).filter((p) => p.masteryLevel >= 1 && p.masteryLevel < 3).length;
}

export function newCount(progress: Record<string, VocabularyProgress>): number {
  const seen = new Set(Object.keys(progress));
  return VOCAB_WORDS.filter((w) => !seen.has(w.id)).length;
}

export function setProgressPercent(setId: string, progress: Record<string, VocabularyProgress>): number {
  const words = VOCAB_WORDS.filter((w) => w.setId === setId);
  if (words.length === 0) return 0;
  const mastered = words.filter((w) => (progress[w.id]?.masteryLevel ?? 0) >= 3).length;
  return Math.round((mastered / words.length) * 100);
}

// ─────────────────────────────────────────────────────────────────────────
// TOPIK LEVEL ESTIMATE
// ─────────────────────────────────────────────────────────────────────────
// A vocabulary set (e.g. "35-TOPIK", "41-TOPIK") is just a numbered lesson
// — it is NOT tied to a specific TOPIK exam level. Instead, the student's
// TOPIK level is an *estimate* derived from what percentage of the total
// vocabulary (across ALL sets combined) they've mastered:
//   0—65%   → not enough vocabulary yet for any TOPIK 3-6 level
//   65—75%  → TOPIK 3
//   75—85%  → TOPIK 4
//   85—95%  → TOPIK 5
//   95—100% → TOPIK 6
const LEVEL_BANDS: { minPercent: number; level: 3 | 4 | 5 | 6 | null }[] = [
  { minPercent: 0, level: null },
  { minPercent: 65, level: 3 },
  { minPercent: 75, level: 4 },
  { minPercent: 85, level: 5 },
  { minPercent: 95, level: 6 },
];
const LEVEL_BAND_CEILING = 100;

export interface LevelEstimate {
  level: 3 | 4 | 5 | 6 | null; // null = below the TOPIK 3 threshold
  percentMastered: number;
  masteredTotal: number;
  totalWords: number;
  currentBandFloor: number; // % floor of the current band
  nextLevelAtPercent: number | null; // % needed for next level (null at max)
  progressToNext: number; // 0-100, progress within the current band
  wordsToNextLevel: number;
}

export function estimateTopikLevel(progress: Record<string, VocabularyProgress>): LevelEstimate {
  const totalWords = VOCAB_WORDS.length;
  const mastered = masteredCount(progress);

  if (totalWords === 0) {
    return {
      level: null,
      percentMastered: 0,
      masteredTotal: 0,
      totalWords: 0,
      currentBandFloor: 0,
      nextLevelAtPercent: LEVEL_BANDS[1].minPercent,
      progressToNext: 0,
      wordsToNextLevel: 0,
    };
  }

  const percentMastered = (mastered / totalWords) * 100;

  let bandIndex = 0;
  for (let i = LEVEL_BANDS.length - 1; i >= 0; i--) {
    if (percentMastered >= LEVEL_BANDS[i].minPercent) {
      bandIndex = i;
      break;
    }
  }

  const currentBandFloor = LEVEL_BANDS[bandIndex].minPercent;
  const nextBand = LEVEL_BANDS[bandIndex + 1];
  const nextLevelAtPercent = nextBand ? nextBand.minPercent : null;
  const bandCeiling = nextLevelAtPercent ?? LEVEL_BAND_CEILING;

  const progressToNext =
    bandCeiling > currentBandFloor
      ? ((percentMastered - currentBandFloor) / (bandCeiling - currentBandFloor)) * 100
      : 100;

  const wordsToNextLevel = nextLevelAtPercent
    ? Math.max(0, Math.ceil((nextLevelAtPercent / 100) * totalWords) - mastered)
    : 0;

  return {
    level: LEVEL_BANDS[bandIndex].level,
    percentMastered: Math.round(percentMastered * 10) / 10,
    masteredTotal: mastered,
    totalWords,
    currentBandFloor,
    nextLevelAtPercent,
    progressToNext: Math.max(0, Math.min(100, Math.round(progressToNext))),
    wordsToNextLevel,
  };
}

export function wrongWordIds(progress: Record<string, VocabularyProgress>): string[] {
  return Object.values(progress)
    .filter((p) => p.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .map((p) => p.wordId);
}
