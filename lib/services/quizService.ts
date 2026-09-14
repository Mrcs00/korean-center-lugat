import { QuizType, VocabularyWord } from "../types";

export interface QuizQuestion {
  word: VocabularyWord;
  type: QuizType;
  prompt: string;
  choices?: string[]; // for multiple-choice types
  correctAnswer: string;
}

const TYPES: QuizType[] = ["kr_to_uz", "uz_to_kr", "typing", "listening", "context"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: string, pool: string[], count = 4): string[] {
  const distractors = shuffle(pool.filter((v) => v !== correct)).slice(0, count - 1);
  return shuffle([correct, ...distractors]);
}

export function buildQuiz(
  words: VocabularyWord[],
  length: number,
  options: { allowedTypes?: QuizType[]; selectionMode?: "random" | "ranked" } = {}
): QuizQuestion[] {
  const allowedTypes = options.allowedTypes ?? TYPES;
  const selectionMode = options.selectionMode ?? "random";

  const pool = words;
  const uzPool = pool.map((w) => w.uzbekTranslation);
  const krPool = pool.map((w) => w.koreanWord);

  // "ranked": the caller has already sorted `words` by priority (e.g. weak/
  // wrong words first via rankForQuiz) — take the top N as-is, then shuffle
  // only the presentation order so the same weak words don't always appear
  // first. "random": pick N uniformly at random from the whole pool.
  const selected =
    selectionMode === "ranked"
      ? shuffle(words.slice(0, Math.min(length, words.length)))
      : shuffle(words).slice(0, Math.min(length, words.length));

  return selected.map((word, i) => {
    let type = allowedTypes[i % allowedTypes.length];
    // "context" needs an example sentence to build a fill-in-the-blank —
    // fall back to a safe type for words that don't have one (e.g. sets
    // without example sentences in their source data).
    if (type === "context" && !word.exampleSentenceKo) {
      type = "kr_to_uz";
    }

    switch (type) {
      case "kr_to_uz":
        return {
          word,
          type,
          prompt: word.koreanWord,
          choices: buildChoices(word.uzbekTranslation, uzPool),
          correctAnswer: word.uzbekTranslation,
        };
      case "uz_to_kr":
        return {
          word,
          type,
          prompt: word.uzbekTranslation,
          choices: buildChoices(word.koreanWord, krPool),
          correctAnswer: word.koreanWord,
        };
      case "typing":
        return {
          word,
          type,
          prompt: word.uzbekTranslation,
          correctAnswer: word.koreanWord,
        };
      case "listening":
        return {
          word,
          type,
          prompt: word.koreanWord, // spoken via TTS, not shown until answered
          choices: buildChoices(word.uzbekTranslation, uzPool),
          correctAnswer: word.uzbekTranslation,
        };
      case "context":
      default: {
        const example = word.exampleSentenceKo ?? word.koreanWord;
        const blanked = example.includes(word.koreanWord)
          ? example.replace(word.koreanWord, "＿＿＿＿")
          : example;
        return {
          word,
          type: "context",
          prompt: blanked,
          choices: buildChoices(word.koreanWord, krPool),
          correctAnswer: word.koreanWord,
        };
      }
    }
  });
}

export function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}
