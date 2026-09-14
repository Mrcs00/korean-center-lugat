import { VOCAB_SETS, VOCAB_WORDS } from "../data/seed";
import { VocabularySet, VocabularyWord } from "../types";

// This module is the single place that talks to "the vocabulary database".
// Right now it reads the local seed data; swapping to Supabase later means
// replacing the bodies of these functions with `supabase.from(...)` calls —
// no caller elsewhere in the app needs to change.

export async function listSets(): Promise<VocabularySet[]> {
  return VOCAB_SETS;
}

export async function getSet(setId: string): Promise<VocabularySet | undefined> {
  return VOCAB_SETS.find((s) => s.id === setId);
}

export async function listWords(setId: string): Promise<VocabularyWord[]> {
  return VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);
}

export async function getWord(wordId: string): Promise<VocabularyWord | undefined> {
  return VOCAB_WORDS.find((w) => w.id === wordId);
}

export async function searchWords(query: string): Promise<VocabularyWord[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return VOCAB_WORDS.filter(
    (w) =>
      w.koreanWord.toLowerCase().includes(q) ||
      w.uzbekTranslation.toLowerCase().includes(q) ||
      (w.pronunciation && w.pronunciation.toLowerCase().includes(q))
  );
}

// Sync helpers (used by client components that already have the seed
// data in memory and don't want to await a promise for a simple lookup).
export function listSetsSync(): VocabularySet[] {
  return VOCAB_SETS;
}
export function listWordsSync(setId: string): VocabularyWord[] {
  return VOCAB_WORDS.filter((w) => w.setId === setId).sort((a, b) => a.order - b.order);
}
export function getWordSync(wordId: string): VocabularyWord | undefined {
  return VOCAB_WORDS.find((w) => w.id === wordId);
}
