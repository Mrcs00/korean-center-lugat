"use client";

import { useEffect, useState } from "react";
import { Volume2, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuizQuestion, normalize } from "@/lib/services/quizService";
import { QuizResultEntry } from "./QuizEngine";

const TYPE_LABEL: Record<string, string> = {
  kr_to_uz: "Koreys → O'zbek",
  uz_to_kr: "O'zbek → Koreys",
  typing: "Yozib javob bering",
  listening: "Tinglab tanlang",
  context: "Gapni to'ldiring",
};

export function ExamEngine({
  questions,
  timeLimitSec,
  onFinish,
}: {
  questions: QuizQuestion[];
  timeLimitSec?: number;
  onFinish: (results: QuizResultEntry[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remaining, setRemaining] = useState(timeLimitSec ?? 0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  const buildResults = (): QuizResultEntry[] =>
    questions.map((q, i) => {
      const given = answers[i];
      return {
        wordId: q.word.id,
        isCorrect: given !== undefined && normalize(given) === normalize(q.correctAnswer),
        studentAnswer: given ?? "",
        type: q.type,
      };
    });

  useEffect(() => {
    if (!timeLimitSec) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          onFinish(buildResults());
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimitSec]);

  if (!question) return null;

  const speak = () => {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(question.word.koreanWord);
    utter.lang = "ko-KR";
    window.speechSynthesis.speak(utter);
  };

  const setAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header: progress + timer + finish */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-muted">
          {index + 1} / {questions.length}
          <span className="text-muted-soft"> · {answeredCount} javob berilgan</span>
        </span>
        <div className="flex items-center gap-2">
          {timeLimitSec ? (
            <span className="text-sm font-bold tabular-nums bg-black/[0.05] px-2.5 py-1 rounded-lg">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          ) : null}
          <button
            onClick={() => setConfirmSubmit(true)}
            className="flex items-center gap-1 text-xs font-semibold text-red bg-red-soft px-2.5 py-1.5 rounded-lg hover:brightness-95 transition-all"
          >
            <Flag size={12} /> Yakunlash
          </button>
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
        {questions.map((_, i) => {
          const isAnswered = answers[i] !== undefined;
          const isCurrent = i === index;
          let style = "border-border bg-surface text-muted";
          if (isCurrent) style = "border-brand bg-brand text-foreground";
          else if (isAnswered) style = "border-green-soft bg-green-soft text-green";
          return (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`shrink-0 h-8 w-8 rounded-lg border-2 text-xs font-bold flex items-center justify-center transition-colors ${style}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <Card elevation="md" className="p-7">
        <p className="text-[11px] font-semibold text-muted mb-3">{TYPE_LABEL[question.type]}</p>

        {question.type === "listening" ? (
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={speak}
              className="h-16 w-16 rounded-full bg-brand-soft flex items-center justify-center hover:bg-brand transition-colors active:scale-95"
            >
              <Volume2 size={26} className="text-brand-darker" />
            </button>
            <p className="text-xs text-muted">Tovushni tinglab, to'g'ri tarjimani tanlang</p>
          </div>
        ) : question.type === "context" ? (
          <p className="font-kr text-lg text-center mb-6 leading-relaxed">{question.prompt}</p>
        ) : (
          <h2
            className={`text-center mb-6 font-extrabold ${
              question.type === "kr_to_uz" || question.type === "typing"
                ? "font-kr text-3xl"
                : "text-2xl"
            }`}
          >
            {question.prompt}
          </h2>
        )}

        {question.type === "typing" ? (
          <input
            value={answers[index] ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Koreyscha yozing..."
            className="font-kr w-full h-12 px-4 rounded-2xl border border-border bg-background text-center text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {question.choices?.map((choice) => {
              const isSelected = answers[index] === choice;
              return (
                <button
                  key={choice}
                  onClick={() => setAnswer(choice)}
                  className={`font-kr text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-brand bg-brand-soft"
                      : "border-border bg-background hover:border-border-strong"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Prev / Next controls */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft size={18} /> Oldingi
        </Button>
        {index < questions.length - 1 ? (
          <Button size="lg" className="flex-1" onClick={() => setIndex((i) => i + 1)}>
            Keyingi <ChevronRight size={18} />
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setConfirmSubmit(true)}>
            Yakunlash
          </Button>
        )}
      </div>

      {/* Submit confirmation */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5" onClick={() => setConfirmSubmit(false)}>
          <Card elevation="lg" className="p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Imtihonni yakunlaysizmi?</h3>
            <p className="text-sm text-muted mb-5">
              {unansweredCount > 0
                ? `Siz ${unansweredCount} ta savolga javob bermadingiz. Baribir yakunlansinmi?`
                : "Barcha savollarga javob berdingiz."}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmSubmit(false)}>
                Davom etish
              </Button>
              <Button className="flex-1" onClick={() => onFinish(buildResults())}>
                Ha, yakunlash
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
