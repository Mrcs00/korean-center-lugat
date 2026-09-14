// 서울대 한국어 (Seoul National University Korean) textbook series.
// Structure: 6 books (1A, 1B, 2A, 2B, 3A, 3B), each with several 과 (units).
// 1A/1B have 8 units, 2A/2B/3A/3B have 9 units.
//
// Vocabulary sets for each unit live in lib/data/seed.ts like every other
// set, tagged with category: "seoul-hangugo", book, and unit. This file
// only describes the book/unit *shape* so the navigation pages can render
// the full book → unit structure immediately, even for units whose
// vocabulary hasn't been added yet (shown as "so'z qo'shilmagan").

export interface SeoulBook {
  id: string; // "1a", "1b", "2a", "2b", "3a", "3b"
  label: string; // "1A"
  unitCount: number;
}

export const SEOUL_BOOKS: SeoulBook[] = [
  { id: "1a", label: "1A", unitCount: 8 },
  { id: "1b", label: "1B", unitCount: 8 },
  { id: "2a", label: "2A", unitCount: 9 },
  { id: "2b", label: "2B", unitCount: 9 },
  { id: "3a", label: "3A", unitCount: 9 },
  { id: "3b", label: "3B", unitCount: 9 },
];

// Shape of each book's raw source data (lib/data/seoul-<book>-raw.ts):
// one entry per 과 (unit), each holding its word list. This mirrors the
// original source files closely so re-exporting new/updated books is a
// straight copy-paste, no manual re-typing.
export interface SeoulRawUnit {
  kva: number;
  words: { kr: string; uz: string }[];
}

// Matches the id pattern used for each unit's VocabularySet, e.g.
// "seoul-1a-unit-3". Kept as a single helper so the id format only has to
// be right in one place.
export function seoulSetId(bookId: string, unit: number): string {
  return `seoul-${bookId}-unit-${unit}`;
}
