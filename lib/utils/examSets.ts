import { VOCAB_SETS, VOCAB_WORDS } from "../data/seed";
import { SEOUL_BOOKS } from "../data/seoulHangugoMeta";
import { VocabularyProgress, VocabularyWord } from "../types";

// ── Book-wide ("umumiy") exams ───────────────────────────────────────────
// A book exam is not a real vocabulary set: its id is virtual and only the
// teacher can hand it out (as an assignment), so students never see it in
// the normal exam lists.

export function bookExamSetId(bookId: string): string {
  return `seoul-${bookId}-umumiy`;
}

/** "seoul-1a-umumiy" -> "1a"; anything else -> null. */
export function parseBookExamSetId(setId: string): string | null {
  const m = /^seoul-([0-9][ab])-umumiy$/.exec(setId);
  return m ? m[1] : null;
}

/** Every word of every 과 in a book, in book order. */
export function bookWords(bookId: string): VocabularyWord[] {
  const prefix = `seoul-${bookId}-unit-`;
  return VOCAB_WORDS.filter((w) => w.setId.startsWith(prefix));
}

/** Human title for any exam/set id, including the virtual book exams. */
export function examSetTitle(setId: string): string {
  const set = VOCAB_SETS.find((s) => s.id === setId);
  if (set) return set.title;
  const bookId = parseBookExamSetId(setId);
  if (bookId) {
    const book = SEOUL_BOOKS.find((b) => b.id === bookId);
    return `${book?.label ?? bookId.toUpperCase()} — Umumiy imtihon`;
  }
  return setId;
}

// ── Word ranges inside one set ───────────────────────────────────────────
// Positions are 1-based and follow the set's own word order.

export function setWordsInOrder(setId: string): VocabularyWord[] {
  return VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);
}

/** Parses ?from=&to= style values; returns null unless it is a valid range. */
export function parseRange(
  fromRaw: string | null,
  toRaw: string | null,
  total: number
): { from: number; to: number } | null {
  if (!fromRaw || !toRaw || !/^\d+$/.test(fromRaw) || !/^\d+$/.test(toRaw)) return null;
  const from = parseInt(fromRaw, 10);
  const to = parseInt(toRaw, 10);
  if (from < 1 || to < from || to > total) return null;
  return { from, to };
}

export function rangeLabel(from: number, to: number): string {
  return `${from}–${to}-so'zlar`;
}

/** % of the words in [from, to] that the student has mastered. */
export function rangeProgressPercent(
  setId: string,
  from: number | null,
  to: number | null,
  progress: Record<string, VocabularyProgress>
): number {
  const all = setWordsInOrder(setId);
  const words = from && to ? all.slice(from - 1, to) : all;
  if (words.length === 0) return 0;
  const mastered = words.filter((w) => (progress[w.id]?.masteryLevel ?? 0) >= 3).length;
  return Math.round((mastered / words.length) * 100);
}
