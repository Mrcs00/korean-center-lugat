"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExamEngine } from "@/components/study/ExamEngine";
import { CountPicker } from "@/components/study/CountPicker";
import { QuizResultEntry } from "@/components/study/QuizEngine";
import { useStore } from "@/lib/store/progressStore";
import { SEOUL_BOOKS } from "@/lib/data/seoulHangugoMeta";
import { buildQuiz, QuizQuestion } from "@/lib/services/quizService";
import {
  ExamSession,
  clearExamSession,
  examSessionKey,
  loadExamSession,
  saveExamSession,
} from "@/lib/services/examSession";
import { RealAssignment, fetchAssignmentsForGroup } from "@/lib/services/assignmentService";
import { bookExamSetId, bookWords } from "@/lib/utils/examSets";
import { supabase } from "@/lib/supabase/client";
import { ExamAnswer, ExamAttempt } from "@/lib/types";

// Book-wide exam: N random words from every 과 of one book.
// It is NOT listed anywhere for students — it only opens when the teacher has
// sent it to the student's group (as an assignment). Teachers can open it
// directly to try it out.
export default function BookExamPage() {
  const params = useParams<{ bookId: string }>();
  const router = useRouter();
  const { recordExamAttempt, reviewWord } = useStore();

  const book = SEOUL_BOOKS.find((b) => b.id === params.bookId);
  const words = useMemo(() => bookWords(params.bookId), [params.bookId]);
  const examId = bookExamSetId(params.bookId);

  const [phase, setPhase] = useState<"loading" | "denied" | "intro" | "running">("loading");
  const [isTeacher, setIsTeacher] = useState(false);
  const [assignment, setAssignment] = useState<RealAssignment | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [picking, setPicking] = useState(false);
  // How many times this student already took the exam (counted from when it was sent).
  const [attemptInfo, setAttemptInfo] = useState<{ used: number; best: number }>({ used: 0, best: 0 });
  const sessionKeyRef = useRef<string | null>(null);
  const sessionRef = useRef<ExamSession | null>(null);
  const finishedRef = useRef(false);

  // Who is allowed in? A teacher, or a student whose group was sent this exam.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (!cancelled) setPhase("denied");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const teacher = profile?.role === "teacher";

      let found: RealAssignment | null = null;
      if (!teacher) {
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("student_id", user.id);
        const lists = await Promise.all(
          (memberships ?? []).map((m) => fetchAssignmentsForGroup(m.group_id).catch(() => [] as RealAssignment[]))
        );
        found = lists.flat().find((a) => a.kind === "book_exam" && a.bookId === params.bookId) ?? null;
        if (!found) {
          if (!cancelled) setPhase("denied");
          return;
        }
      }
      if (cancelled) return;

      let used = 0;
      let best = 0;
      if (!teacher && found) {
        const { data: past } = await supabase
          .from("exam_attempts")
          .select("correct_count, total_questions")
          .eq("student_id", user.id)
          .eq("set_id", examId)
          .gte("started_at", found.createdAt ?? "1970-01-01T00:00:00Z");
        used = past?.length ?? 0;
        best = (past ?? []).reduce(
          (m, a) => Math.max(m, Math.round((a.correct_count / Math.max(a.total_questions, 1)) * 100)),
          0
        );
      }
      if (cancelled) return;
      setAttemptInfo({ used, best });

      const key = examSessionKey(user.id, examId);
      sessionKeyRef.current = key;
      const saved = loadExamSession(key);
      setIsTeacher(teacher);
      setAssignment(found);
      setSession(saved);
      setSessionExpired(saved?.endsAt ? saved.endsAt <= Date.now() : false);
      setPhase("intro");
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [params.bookId, examId]);

  const startNew = (count: number) => {
    const key = sessionKeyRef.current;
    // Random words from the whole book, in random order. The wrong-answer
    // choices are also drawn from the whole book.
    const qs = buildQuiz(words, Math.min(count, words.length), { selectionMode: "random" });
    const now = Date.now();
    const fresh: ExamSession = {
      questions: qs,
      answers: {},
      index: 0,
      startedAt: now,
      endsAt: now + qs.length * 20 * 1000,
      savedAt: now,
    };
    sessionRef.current = fresh;
    if (key) saveExamSession(key, fresh);
    setQuestions(qs);
    setSession(fresh);
    setPicking(false);
    setPhase("running");
  };

  const resume = () => {
    if (!session) return;
    sessionRef.current = session;
    setQuestions(session.questions);
    setPhase("running");
  };

  // "Qaytadan boshlash": drop the old questions and draw a new random set.
  const restart = (count: number) => {
    if (sessionKeyRef.current) clearExamSession(sessionKeyRef.current);
    startNew(count);
  };

  const handleProgress = useCallback((answers: Record<number, string>, index: number) => {
    const key = sessionKeyRef.current;
    const current = sessionRef.current;
    if (!key || !current || finishedRef.current) return;
    const next = { ...current, answers, index, savedAt: Date.now() };
    sessionRef.current = next;
    saveExamSession(key, next);
  }, []);

  if (!book || words.length === 0) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-5 py-16 text-center">
          <p className="text-muted">Bu kitob uchun savollar mavjud emas.</p>
          <Link href="/exam" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
            Orqaga
          </Link>
        </div>
      </AppShell>
    );
  }

  if (phase === "loading") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center text-sm text-muted">Yuklanmoqda...</div>
      </AppShell>
    );
  }

  if (phase === "denied") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <Card className="p-8">
            <div className="h-12 w-12 rounded-2xl bg-black/[0.05] flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-muted" />
            </div>
            <h1 className="text-lg font-bold mb-1">Bu imtihon sizga berilmagan</h1>
            <p className="text-sm text-muted mb-5">
              Umumiy imtihonni faqat o&apos;qituvchi yuborganda topshirish mumkin.
            </p>
            <Link href="/groups" className="text-sm font-semibold text-brand-dark">
              Guruhim va topshiriqlar →
            </Link>
          </Card>
        </div>
      </AppShell>
    );
  }

  const studentCount = Math.min(assignment?.questionCount ?? 50, words.length);
  const maxAttempts = assignment?.maxAttempts ?? 2;
  const attemptsExhausted = !isTeacher && attemptInfo.used >= maxAttempts;

  if (phase === "intro") {
    const answeredCount = session ? Object.keys(session.answers).length : 0;
    const showPicker = isTeacher && (!session || picking);
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <Card className="p-8">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Umumiy imtihon</p>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">{book.label}</h1>
            <p className="text-muted text-sm mb-6">
              {book.unitCount} ta 과, jami {words.length} ta so&apos;z
            </p>
            <ul className="text-sm text-left text-muted flex flex-col gap-1.5 mb-8 max-w-xs mx-auto">
              <li>🎲 Kitobning hamma 과laridan tasodifiy so&apos;zlar</li>
              <li>⏱ Har bir savol uchun taxminan 20 soniya</li>
              {assignment && (
                <li>
                  🎯 O&apos;tish bali: {assignment.minimumMastery}%
                  {assignment.deadline ? ` · Muddat: ${assignment.deadline}` : ""}
                </li>
              )}
              {assignment && (
                <li>
                  🔁 Urinishlar: {Math.min(attemptInfo.used + (session ? 1 : 0), maxAttempts)} / {maxAttempts}
                </li>
              )}
              <li>📊 Natija va xato so&apos;zlar avtomatik saqlanadi</li>
            </ul>

            {showPicker ? (
              <>
                <CountPicker
                  total={words.length}
                  defaultCount={Math.min(50, words.length)}
                  confirmLabel="Imtihonni boshlash"
                  onConfirm={({ count }) => restart(count)}
                />
                {session && (
                  <button
                    type="button"
                    onClick={() => setPicking(false)}
                    className="text-xs text-muted hover:text-foreground mt-3"
                  >
                    ← Bekor qilish
                  </button>
                )}
              </>
            ) : session ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted mb-1">
                  {sessionExpired
                    ? "Oldingi imtihon vaqti tugagan."
                    : `Tugallanmagan imtihon bor: ${answeredCount} / ${session.questions.length} javob berilgan.`}
                </p>
                <Button size="lg" onClick={resume}>
                  {sessionExpired ? "Natijani ko'rish" : "Davom ettirish"}
                </Button>
                {isTeacher ? (
                  <Button size="lg" variant="secondary" onClick={() => setPicking(true)}>
                    Qaytadan boshlash (yangi savollar)
                  </Button>
                ) : (
                  <p className="text-xs text-muted mt-1">
                    Imtihonni tugatmaguncha savollar o&apos;zgarmaydi.
                  </p>
                )}
              </div>
            ) : attemptsExhausted ? (
              <div>
                <p className="text-sm font-semibold mb-1">Urinishlar tugadi</p>
                <p className="text-xs text-muted mb-4">
                  {attemptInfo.used} / {maxAttempts} urinish ishlatildi. Eng yaxshi natija: {attemptInfo.best}%.
                </p>
                <Link href="/groups" className="text-sm font-semibold text-brand-dark">
                  Guruhim va topshiriqlar →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold mb-4">{studentCount} ta savol</p>
                <Button size="lg" className="w-full" onClick={() => startNew(studentCount)}>
                  Imtihonni boshlash
                </Button>
              </>
            )}
          </Card>
        </div>
      </AppShell>
    );
  }

  const handleFinish = (results: QuizResultEntry[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (sessionKeyRef.current) clearExamSession(sessionKeyRef.current);
    const skippedCount = results.filter((r) => r.studentAnswer === "").length;
    const wrongCount = results.filter((r) => !r.isCorrect && r.studentAnswer !== "").length;
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      studentId: "demo-student",
      setId: examId,
      startedAt: new Date(session?.startedAt ?? Date.now()).toISOString(),
      submittedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      correctCount: results.filter((r) => r.isCorrect).length,
      wrongCount,
      skippedCount,
    };
    const answers: ExamAnswer[] = results
      .filter((r) => r.studentAnswer !== "")
      .map((r) => ({
        attemptId: attempt.id,
        wordId: r.wordId,
        questionType: r.type as ExamAnswer["questionType"],
        isCorrect: r.isCorrect,
        studentAnswer: r.studentAnswer,
      }));
    // A question left unanswered counts as not known, so that word comes back
    // for review instead of silently disappearing from the student's progress.
    results.forEach((r) => reviewWord(r.wordId, r.isCorrect ? "correct" : "wrong"));
    recordExamAttempt(attempt, answers);
    router.push(`/result/${attempt.id}`);
  };

  return (
    <AppShell>
      <div className="py-8 px-5">
        <ExamEngine
          questions={questions}
          endsAt={session?.endsAt ?? null}
          initialAnswers={session?.answers}
          initialIndex={session?.index}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />
      </div>
    </AppShell>
  );
}
