import { QuizQuestion } from "./quizService";

// An in-progress exam, persisted so that leaving and re-entering the exam
// page resumes the same questions, answers, position and timer.
export interface ExamSession {
  questions: QuizQuestion[];
  answers: Record<number, string>;
  index: number;
  startedAt: number; // epoch ms
  endsAt: number | null; // epoch ms; the timer keeps running while away
  savedAt: number; // epoch ms
}

const PREFIX = "exam-session-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // drop sessions older than 24h

export function examSessionKey(userId: string | null, setId: string): string {
  return `${PREFIX}:${userId ?? "local"}:${setId}`;
}

export function loadExamSession(key: string): ExamSession | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as ExamSession;
    const valid =
      s &&
      Array.isArray(s.questions) &&
      s.questions.length > 0 &&
      typeof s.startedAt === "number" &&
      typeof s.savedAt === "number" &&
      typeof s.index === "number" &&
      s.answers !== null &&
      typeof s.answers === "object";
    if (!valid || Date.now() - s.startedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveExamSession(key: string, session: ExamSession): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // storage full / unavailable — the exam still works, just not resumable
  }
}

export function clearExamSession(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
