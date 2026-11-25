import { QuizQuestion, normalize } from "../services/quizService";
import type { VocabularyWord } from "../types";

// Assignment exams are test-only: a "typing" question is turned into a normal
// multiple-choice question (same word, same correct answer, 3 wrong choices
// taken from the pool).

const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function choiceOnly(questions: QuizQuestion[], pool: VocabularyWord[]): QuizQuestion[] {
  return questions.map((q) => {
    if (q.type !== "typing") return q;
    const korean = HANGUL.test(q.correctAnswer);
    const valueOf = (w: VocabularyWord) => (korean ? w.koreanWord : w.uzbekTranslation);
    const seen = new Set([normalize(q.correctAnswer)]);
    const distractors: string[] = [];
    for (const w of shuffle(pool)) {
      const v = valueOf(w);
      if (!v) continue;
      const key = normalize(v);
      if (seen.has(key)) continue;
      seen.add(key);
      distractors.push(v);
      if (distractors.length === 3) break;
    }
    return { ...q, type: korean ? "uz_to_kr" : "kr_to_uz", choices: shuffle([q.correctAnswer, ...distractors]) } as QuizQuestion;
  });
}
