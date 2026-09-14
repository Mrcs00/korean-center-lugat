import { VocabularySet, VocabularyWord } from "../types";
import { SEOUL_BOOKS, SeoulRawUnit, seoulSetId } from "./seoulHangugoMeta";
import { seoul1ARaw } from "./seoul-1a-raw";
import { seoul1BRaw } from "./seoul-1b-raw";
import { seoul2ARaw } from "./seoul-2a-raw";
import { seoul2BRaw } from "./seoul-2b-raw";
import { seoul3ARaw } from "./seoul-3a-raw";
import { seoul3BRaw } from "./seoul-3b-raw";

// 서울대 한국어 textbook levels aren't TOPIK 1-6 exam levels — `topikLevel`
// here is a rough grouping only (used nowhere critical; the app's overall
// TOPIK 3-6 estimate is based on total vocabulary mastery, not per-set tags).
const BOOK_TOPIK_LEVEL: Record<string, number> = {
  "1a": 1,
  "1b": 1,
  "2a": 2,
  "2b": 2,
  "3a": 3,
  "3b": 3,
};

const RAW_BY_BOOK: Record<string, SeoulRawUnit[]> = {
  "1a": seoul1ARaw,
  "1b": seoul1BRaw,
  "2a": seoul2ARaw,
  "2b": seoul2BRaw,
  "3a": seoul3ARaw,
  "3b": seoul3BRaw,
};

const sets: VocabularySet[] = [];
const words: VocabularyWord[] = [];

for (const book of SEOUL_BOOKS) {
  const units = RAW_BY_BOOK[book.id] ?? [];
  for (const unit of units) {
    const setId = seoulSetId(book.id, unit.kva);
    sets.push({
      id: setId,
      topikLevel: BOOK_TOPIK_LEVEL[book.id] ?? 1,
      setNumber: unit.kva,
      title: `${book.label} — ${unit.kva}과`,
      description: `${book.label} kitobi, ${unit.kva}-dars so'zlari`,
      wordCount: unit.words.length,
      category: "seoul-hangugo",
      book: book.id,
      unit: unit.kva,
    });

    unit.words.forEach((w, i) => {
      words.push({
        id: `${setId}-${i + 1}`,
        setId,
        koreanWord: w.kr,
        uzbekTranslation: w.uz,
        order: i + 1,
        // pronunciation / exampleSentence* / partOfSpeech / topic
        // intentionally omitted — this source doesn't include them, and
        // every UI surface (WordCard, Flashcard, quiz) already handles
        // their absence gracefully.
      });
    });
  }
}

export const SEOUL_VOCAB_SETS: VocabularySet[] = sets;
export const SEOUL_VOCAB_WORDS: VocabularyWord[] = words;
