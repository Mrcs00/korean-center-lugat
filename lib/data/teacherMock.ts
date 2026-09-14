// Demo roster for the teacher panel. In production this is replaced by
// Supabase queries against `profiles`, `groups`, `group_members`,
// `exam_attempts`, and `student_wrong_words`.
//
// Platform targets TOPIK 3-6, so groups/levels here stay within that range.

export interface LevelBreakdown {
  3: number;
  4: number;
  5: number;
  6: number;
}

export interface MockStudent {
  id: string;
  fullName: string;
  group: string;
  totalWords: number;
  masteryPercent: number;
  levelBreakdown: LevelBreakdown;
  streak: number;
  lastExamSet: string;
  lastExamScore: string;
  avgExamScore: number;
  wrongWords: { korean: string; uzbek: string; timesWrong: number }[];
}

export const MOCK_GROUPS = ["TOPIK 3 — Guruh A", "TOPIK 4 — Guruh B", "TOPIK 5 — Guruh C"];

export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: "s1",
    fullName: "Ali Valiyev",
    group: "TOPIK 5 — Guruh C",
    totalWords: 1568,
    masteryPercent: 82,
    levelBreakdown: { 3: 81, 4: 54, 5: 22, 6: 0 },
    streak: 12,
    lastExamSet: "35-TOPIK",
    lastExamScore: "87/100",
    avgExamScore: 84,
    wrongWords: [
      { korean: "감소하다", uzbek: "kamaymoq", timesWrong: 3 },
      { korean: "유지하다", uzbek: "saqlamoq", timesWrong: 2 },
      { korean: "발생하다", uzbek: "yuzaga kelmoq", timesWrong: 2 },
    ],
  },
  {
    id: "s2",
    fullName: "Dilnoza Karimova",
    group: "TOPIK 5 — Guruh C",
    totalWords: 1980,
    masteryPercent: 91,
    levelBreakdown: { 3: 96, 4: 89, 5: 74, 6: 18 },
    streak: 24,
    lastExamSet: "34-TOPIK",
    lastExamScore: "95/100",
    avgExamScore: 93,
    wrongWords: [{ korean: "보장하다", uzbek: "kafolatlamoq", timesWrong: 1 }],
  },
  {
    id: "s3",
    fullName: "Jasur Toshpo'latov",
    group: "TOPIK 4 — Guruh B",
    totalWords: 740,
    masteryPercent: 58,
    levelBreakdown: { 3: 72, 4: 41, 5: 6, 6: 0 },
    streak: 3,
    lastExamSet: "20-TOPIK",
    lastExamScore: "62/100",
    avgExamScore: 65,
    wrongWords: [
      { korean: "반영하다", uzbek: "aks ettirmoq", timesWrong: 4 },
      { korean: "향상되다", uzbek: "yaxshilanmoq", timesWrong: 3 },
    ],
  },
  {
    id: "s4",
    fullName: "Madina Yusupova",
    group: "TOPIK 3 — Guruh A",
    totalWords: 410,
    masteryPercent: 45,
    levelBreakdown: { 3: 45, 4: 0, 5: 0, 6: 0 },
    streak: 0,
    lastExamSet: "8-TOPIK",
    lastExamScore: "54/100",
    avgExamScore: 54,
    wrongWords: [{ korean: "극복하다", uzbek: "yengib o'tmoq", timesWrong: 5 }],
  },
];
