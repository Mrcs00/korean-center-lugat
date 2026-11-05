// Core domain types. These mirror the intended Supabase/PostgreSQL schema
// (see /docs/database-schema.sql) so the mock data layer in lib/services/*
// can later be swapped for real Supabase queries without touching the UI.

export type Role = "student" | "teacher" | "admin";

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
}

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "expression";

export interface VocabularySet {
  id: string;
  topikLevel: number; // 1..6 (grouped level) — kept for stats compatibility
  setNumber: number; // e.g. 35 -> "35-TOPIK", or unit number within a book
  title: string; // "35-TOPIK" or "1A - 1과"
  description: string;
  wordCount: number;
  // Which top-level vocabulary category this set belongs to. Optional for
  // backward compatibility; past-exam sets built before this field existed
  // are still recognized by their id suffix (-reading / -listening).
  category?: "past-exam" | "seoul-hangugo";
  book?: string; // e.g. "1A" — only for category "seoul-hangugo"
  unit?: number; // e.g. 1..9 (과 number) — only for category "seoul-hangugo"
}

export interface VocabularyWord {
  id: string;
  setId: string;
  koreanWord: string;
  pronunciation?: string; // romanization — optional, some sources don't include it
  uzbekTranslation: string;
  exampleSentenceKo?: string;
  exampleSentenceUz?: string;
  synonym?: string;
  antonym?: string;
  partOfSpeech?: PartOfSpeech;
  audioUrl?: string;
  imageUrl?: string;
  topic?: string;
  order: number;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export interface VocabularyProgress {
  studentId: string;
  wordId: string;
  masteryLevel: MasteryLevel;
  correctCount: number;
  wrongCount: number;
  timesSeen: number;
  confidence: number; // 0..1
  lastReviewedAt: string | null;
  nextReviewAt: string; // ISO date
}

export type SelfRating = "unknown" | "partial" | "known";

export type QuizType =
  | "kr_to_uz"
  | "uz_to_kr"
  | "typing"
  | "listening"
  | "context";

export interface ExamAttempt {
  id: string;
  studentId: string;
  setId: string;
  startedAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

export interface ExamAnswer {
  attemptId: string;
  wordId: string;
  questionType: QuizType;
  isCorrect: boolean;
  studentAnswer: string;
}

export interface Group {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
}

export interface Assignment {
  id: string;
  groupId: string;
  setId: string;
  deadline: string;
  minimumMastery: number; // percent
}

export interface DailyActivity {
  date: string; // ISO date (yyyy-mm-dd)
  newWords: number;
  reviewedWords: number;
  xpEarned: number;
}
