"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuizQuestion, normalize } from "@/lib/services/quizService";

const TYPE_LABEL: Record<string, string> = {
  kr_to_uz: "Koreys → O'zbek",
  uz_to_kr: "O'zbek → Koreys",
  typing: "Yozib javob bering",
  listening: "Tinglab tanlang",
  context: "Gapni to'ldiring",
};

export interface QuizResultEntry {
  wordId: string;
  isCorrect: boolean;
  studentAnswer: string;
  type: string;
}

export function QuizEngine({
  questions,
  examMode = false,
  timeLimitSec,
  onAnswer,
  onFinish,
}: {
  questions: QuizQuestion[];
  examMode?: boolean;
  timeLimitSec?: number;
  onAnswer?: (entry: QuizResultEntry) => void;
  onFinish: (results: QuizResultEntry[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<QuizResultEntry[]>([]);
  const [remaining, setRemaining] = useState(timeLimitSec ?? 0);

  const question = questions[index];

  useEffect(() => {
    if (!timeLimitSec) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          onFinish(results);
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

  const commitAnswer = (answer: string) => {
    const isCorrect = normalize(answer) === normalize(question.correctAnswer);
    const entry: QuizResultEntry = {
      wordId: question.word.id,
      isCorrect,
      studentAnswer: answer,
      type: question.type,
    };
    setResults((prev) => [...prev, entry]);
    onAnswer?.(entry);
    setRevealed(true);
  };

  const goNext = () => {
    setSelected(null);
    setTypedAnswer("");
    setRevealed(false);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onFinish([...results]);
    }
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-muted">
          Savol {index + 1} / {questions.length}
        </span>
        {examMode && timeLimitSec ? (
          <span className="text-sm font-bold tabular-nums bg-black/[0.05] px-2.5 py-1 rounded-lg">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        ) : (
          <span className="text-xs font-semibold text-muted bg-black/[0.05] px-2.5 py-1 rounded-lg">
            {TYPE_LABEL[question.type]}
          </span>
        )}
      </div>
      <ProgressBar value={index + (revealed ? 1 : 0)} max={questions.length} className="mb-6" />

      <Card className="p-7">
        {examMode && (
          <p className="text-[11px] font-semibold text-muted mb-3">{TYPE_LABEL[question.type]}</p>
        )}

        {question.type === "listening" ? (
          <div className="flex flex-col items-center gap-3 mb-6">
            <button
              onClick={speak}
              className="h-16 w-16 rounded-full bg-brand-soft flex items-center justify-center hover:bg-brand transition-colors"
            >
              <Volume2 size={26} className="text-brand-dark" />
            </button>
            <p className="text-xs text-muted">Tovushni tinglab, to'g'ri tarjimani tanlang</p>
          </div>
        ) : question.type === "context" ? (
          <p className="font-kr text-lg text-center mb-6 leading-relaxed">{question.prompt}</p>
        ) : (
          <h2
            className={`text-center mb-6 font-bold ${
              question.type === "kr_to_uz" || question.type === "typing"
                ? "font-kr text-3xl"
                : "text-2xl"
            }`}
          >
            {question.prompt}
          </h2>
        )}

        {question.type === "typing" ? (
          <div className="flex flex-col gap-3">
            <input
              value={typedAnswer}
              disabled={revealed}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Koreyscha yozing..."
              className="font-kr w-full h-12 px-4 rounded-2xl border border-border bg-background text-center text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-70"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !revealed && typedAnswer.trim()) commitAnswer(typedAnswer);
              }}
            />
            {!revealed ? (
              <Button disabled={!typedAnswer.trim()} onClick={() => commitAnswer(typedAnswer)}>
                Javobni yuborish
              </Button>
            ) : (
              <AnswerFeedback
                isCorrect={normalize(typedAnswer) === normalize(question.correctAnswer)}
                correctAnswer={question.correctAnswer}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {question.choices?.map((choice) => {
              const isCorrectChoice = choice === question.correctAnswer;
              const isSelected = choice === selected;
              let style =
                "border-border bg-background hover:border-foreground/20";
              if (revealed && isCorrectChoice) style = "border-green bg-green/10";
              else if (revealed && isSelected && !isCorrectChoice) style = "border-red bg-red/10";
              else if (isSelected) style = "border-brand bg-brand-soft";

              return (
                <button
                  key={choice}
                  disabled={revealed}
                  onClick={() => {
                    setSelected(choice);
                    commitAnswer(choice);
                  }}
                  className={`font-kr text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-colors disabled:pointer-events-none ${style}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {revealed && (
          <Button className="w-full mt-5" onClick={goNext}>
            {index < questions.length - 1 ? "Keyingisi" : "Yakunlash"}
          </Button>
        )}
      </Card>
    </div>
  );
}

function AnswerFeedback({ isCorrect, correctAnswer }: { isCorrect: boolean; correctAnswer: string }) {
  return (
    <div
      className={`text-center rounded-xl px-4 py-2.5 text-sm font-semibold ${
        isCorrect ? "bg-green/10 text-green" : "bg-red/10 text-red"
      }`}
    >
      {isCorrect ? "To'g'ri!" : (
        <>
          Noto'g'ri. To'g'ri javob: <span className="font-kr">{correctAnswer}</span>
        </>
      )}
    </div>
  );
}
