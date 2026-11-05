import { MasteryLevel, SelfRating, VocabularyProgress } from "../types";

// Interval (in days) for each mastery level, per the product brief:
// Level 0: bugun, 1: 1 kun, 2: 3 kun, 3: 7 kun, 4: 14 kun
const INTERVAL_DAYS: Record<MasteryLevel, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
};

export function isoDatePlusDays(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Applies a self-rating (flashcard) or a test/exam answer to a word's
 * progress and returns the next state.
 *
 * Two rules keep "mastered" honest:
 *  1. A level only goes UP when the word is due (its review interval has
 *     passed). Answering correctly three times in one minute no longer makes
 *     a word "o'zlashtirilgan"; it takes several days of spaced practice.
 *  2. "Verified" mastery (verifiedLevel) moves only with test/exam answers
 *     ("correct" / "wrong"), never with the flashcard "Bilaman" button. The
 *     teacher panel and assignments use the verified numbers.
 *
 * Wrong answers drop the level and bring the word back sooner.
 */
export function applyReview(
  current: VocabularyProgress,
  outcome: SelfRating | "correct" | "wrong",
  now: Date = new Date()
): VocabularyProgress {
  const isPositive = outcome === "known" || outcome === "correct";
  const isNeutral = outcome === "partial";

  // ── Student-facing mastery (self-rating + tests) ──
  let next: MasteryLevel = current.masteryLevel;
  let nextReviewAt = current.nextReviewAt;
  let correctCount = current.correctCount;
  let wrongCount = current.wrongCount;

  if (isPositive) {
    correctCount += 1;
    const due = current.masteryLevel === 0 || new Date(current.nextReviewAt).getTime() <= now.getTime();
    if (due) {
      next = Math.min(4, current.masteryLevel + 1) as MasteryLevel;
      nextReviewAt = isoDatePlusDays(INTERVAL_DAYS[next], now);
    }
  } else if (!isNeutral) {
    // "Bilmayman" / wrong: drop back, review sooner
    next = Math.max(0, current.masteryLevel - 1) as MasteryLevel;
    nextReviewAt = isoDatePlusDays(INTERVAL_DAYS[next], now);
    wrongCount += 1;
  }

  // ── Verified mastery (test/exam answers only) ──
  let verifiedLevel: MasteryLevel = current.verifiedLevel;
  let verifiedNextAt = current.verifiedNextAt;
  let verifiedCorrectAt = current.verifiedCorrectAt;

  if (outcome === "correct") {
    verifiedCorrectAt = now.toISOString();
    const verifiedDue =
      current.verifiedLevel === 0 || new Date(current.verifiedNextAt).getTime() <= now.getTime();
    if (verifiedDue) {
      verifiedLevel = Math.min(4, current.verifiedLevel + 1) as MasteryLevel;
      verifiedNextAt = isoDatePlusDays(INTERVAL_DAYS[verifiedLevel], now);
    }
  } else if (outcome === "wrong") {
    verifiedLevel = Math.max(0, current.verifiedLevel - 1) as MasteryLevel;
    verifiedNextAt = isoDatePlusDays(INTERVAL_DAYS[verifiedLevel], now);
  }

  const confidence = Math.max(
    0,
    Math.min(1, current.confidence + (isPositive ? 0.15 : isNeutral ? 0 : -0.2))
  );

  return {
    ...current,
    masteryLevel: next,
    correctCount,
    wrongCount,
    timesSeen: current.timesSeen + 1,
    confidence,
    lastReviewedAt: now.toISOString(),
    nextReviewAt,
    verifiedLevel,
    verifiedNextAt,
    verifiedCorrectAt,
  };
}

export function isDueForReview(progress: VocabularyProgress, now = new Date()): boolean {
  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function masteryLabel(level: MasteryLevel): string {
  return ["Yangi", "O'rganilmoqda", "Yaxshi", "O'zlashtirilgan", "Mustahkam"][level];
}

export function defaultProgress(studentId: string, wordId: string): VocabularyProgress {
  return {
    studentId,
    wordId,
    masteryLevel: 0,
    correctCount: 0,
    wrongCount: 0,
    timesSeen: 0,
    confidence: 0,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
    verifiedLevel: 0,
    verifiedNextAt: new Date().toISOString(),
    verifiedCorrectAt: null,
  };
}

/**
 * Prioritizes words for a quiz/review session: words the student got wrong
 * before, weak mastery, and words seen less often surface first — per
 * "Oldingi xato so'zlar, zaif mastery va kam takrorlangan so'zlar ko'proq chiqsin."
 */
export function rankForQuiz(progresses: VocabularyProgress[]): VocabularyProgress[] {
  return [...progresses].sort((a, b) => {
    const scoreA = a.wrongCount * 3 - a.masteryLevel * 2 - a.timesSeen * 0.5;
    const scoreB = b.wrongCount * 3 - b.masteryLevel * 2 - b.timesSeen * 0.5;
    return scoreB - scoreA;
  });
}
