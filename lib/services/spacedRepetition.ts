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

export function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Applies a quiz / exam / review result to a word's progress record and returns the next state.
 *  - correct: the word is learned (level 3). A learned word answered correctly again climbs to level 4.
 *  - wrong (or skipped): the word is not learned any more (level 0) and is due for review right away,
 *    so it shows up in "Takrorlash".
 * Flashcards no longer change progress at all; only tests do.
 */
export function applyReview(
  current: VocabularyProgress,
  outcome: SelfRating | "correct" | "wrong"
): VocabularyProgress {
  let next: MasteryLevel = current.masteryLevel;
  let correctCount = current.correctCount;
  let wrongCount = current.wrongCount;

  const isPositive = outcome === "known" || outcome === "correct";
  const isNeutral = outcome === "partial";

  if (isPositive) {
    next = (current.masteryLevel < 3 ? 3 : 4) as MasteryLevel;
    correctCount += 1;
  } else if (isNeutral) {
    // stays at same level, but doesn't reset progress
    next = current.masteryLevel;
  } else {
    // wrong / skipped: back to "new", due now -> goes to the review queue
    next = 0;
    wrongCount += 1;
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
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: isoDatePlusDays(INTERVAL_DAYS[next]),
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
