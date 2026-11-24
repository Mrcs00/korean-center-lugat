import { listAttendance, listHomework, listLessons, mySubmissions, type GroupFull } from "./api";
import { loadVocabResults } from "./vocabResults";
import { isPastDue, scorePercent } from "./homework";
import { fetchAssignmentsForGroup } from "../services/assignmentService";
import { examSetTitle, rangeLabel } from "../utils/examSets";
import { daysInMonth, monthOfKey, tashkentDateKey } from "../utils/dates";
import type { AttendanceStatus } from "./types";

// Everything a monthly parent report shows. Read-only: the database rules decide
// what the signed-in teacher / admin may read, so a teacher only gets data of
// students in their own groups.

export interface ReportLesson {
  date: string;
  groupName: string;
  topic: string | null;
  status: AttendanceStatus | null;
}

export type ReportHwStatus = "graded" | "handed" | "revision" | "missing" | "pending";

export interface ReportHomework {
  id: string;
  title: string;
  groupName: string;
  due: string | null;
  points: number;
  status: ReportHwStatus;
  score: number | null;
}

export interface ReportVocab {
  id: string;
  title: string;
  detail: string;
  deadline: string | null;
  pct: number;
  done: boolean;
  started: boolean;
}

export interface MonthlyReportData {
  period: string;
  attendance: { total: number; present: number; late: number; excused: number; absent: number; rate: number | null };
  lessons: ReportLesson[];
  homework: ReportHomework[];
  hwStats: { given: number; done: number; graded: number; avgPct: number | null };
  vocab: ReportVocab[];
}

export async function loadMonthlyReport(studentId: string, groups: GroupFull[], period: string): Promise<MonthlyReportData> {
  const from = `${period}-01`;
  const to = `${period}-${String(daysInMonth(period)).padStart(2, "0")}`;
  const groupIds = groups.map((g) => g.id);
  const nameOf = (id: string) => groups.find((g) => g.id === id)?.name ?? "";

  const [att, lessons, homeworkAll, subs, assignmentsPerGroup] = await Promise.all([
    listAttendance({ studentId, from, to }),
    listLessons(groupIds, from, to),
    listHomework(groupIds),
    mySubmissions(studentId),
    Promise.all(groupIds.map((id) => fetchAssignmentsForGroup(id))),
  ]);

  // attendance
  const count = (s: AttendanceStatus) => att.filter((r) => r.status === s).length;
  const present = count("present");
  const late = count("late");
  const excused = count("excused");
  const absent = count("absent");
  const total = att.length;
  const rate = total ? Math.round(((present + late + excused) / total) * 100) : null;

  // lessons that took place (done, or the student has an attendance mark)
  const statusByLesson = new Map(att.map((r) => [r.lesson_id, r.status]));
  const lessonRows: ReportLesson[] = lessons
    .filter((l) => l.status === "done" || statusByLesson.has(l.id))
    .map((l) => ({ date: l.lesson_date, groupName: nameOf(l.group_id), topic: l.topic, status: statusByLesson.get(l.id) ?? null }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // homework due in this month (or given this month when it has no deadline)
  const subMap = new Map(subs.map((s) => [s.homework_id, s]));
  const homework: ReportHomework[] = homeworkAll
    .filter((h) => !h.student_ids || h.student_ids.includes(studentId))
    .filter((h) => monthOfKey(h.due_at ? tashkentDateKey(new Date(h.due_at)) : h.assigned_at) === period)
    .map((h) => {
      const s = subMap.get(h.id);
      let status: ReportHwStatus;
      if (s?.status === "graded") status = "graded";
      else if (s?.status === "needs_revision") status = "revision";
      else if (s && s.status !== "draft") status = "handed";
      else status = isPastDue(h) ? "missing" : "pending";
      return { id: h.id, title: h.title, groupName: nameOf(h.group_id), due: h.due_at, points: h.points, status, score: s?.status === "graded" ? s.score : null };
    })
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));

  const gradedRows = homework.filter((h) => h.status === "graded");
  const pcts = gradedRows.map((h) => scorePercent(h.score, h.points)).filter((x): x is number => x !== null);
  const hwStats = {
    given: homework.length,
    done: homework.filter((h) => h.status === "graded" || h.status === "handed" || h.status === "revision").length,
    graded: gradedRows.length,
    avgPct: pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : null,
  };

  // vocabulary assignments whose deadline falls in this month
  const vocabAssignments = assignmentsPerGroup.flat().filter((a) => a.deadline && monthOfKey(a.deadline) === period);
  const vocab: ReportVocab[] = await Promise.all(
    vocabAssignments.map(async (a) => {
      const res = await loadVocabResults(a);
      const mine = res.rows.find((r) => r.studentId === studentId);
      const detail = a.kind === "book_exam" ? `${a.questionCount ?? 50} ta savol` : a.wordFrom && a.wordTo ? rangeLabel(a.wordFrom, a.wordTo) : "Butun to'plam";
      return {
        id: a.id,
        title: examSetTitle(a.setId),
        detail,
        deadline: a.deadline,
        pct: mine?.pct ?? 0,
        done: mine?.status === "done",
        started: mine ? mine.status !== "none" : false,
      };
    })
  );

  return { period, attendance: { total, present, late, excused, absent, rate }, lessons: lessonRows, homework, hwStats, vocab };
}
