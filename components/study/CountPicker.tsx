"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface CountSelection {
  /** 1-based, inclusive position of the first word */
  from: number;
  /** 1-based, inclusive position of the last word */
  to: number;
  count: number;
  /** Number of questions chosen (only when `withQuestionCount` is on) */
  questions: number;
}

const PRESETS = [10, 20, 30, 50, 100];

function toInt(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return parseInt(value, 10);
}

/**
 * Lets the student choose how many words to be tested on: quick presets, a
 * custom number, "all", and (optionally) a from–to range.
 */
export function CountPicker({
  total,
  defaultCount,
  withRange = false,
  withQuestionCount = false,
  defaultQuestions = 10,
  confirmLabel,
  onConfirm,
}: {
  total: number;
  defaultCount?: number;
  withRange?: boolean;
  /** Adds a separate "how many questions" field (limited by the chosen words). */
  withQuestionCount?: boolean;
  defaultQuestions?: number;
  confirmLabel: string;
  onConfirm: (selection: CountSelection) => void;
}) {
  const initial = Math.min(defaultCount ?? total, total);
  const [mode, setMode] = useState<"first" | "range">("first");
  const [countText, setCountText] = useState(String(initial));
  const [fromText, setFromText] = useState("1");
  const [toText, setToText] = useState(String(Math.min(100, total)));
  const [questionsText, setQuestionsText] = useState(String(Math.min(defaultQuestions, initial)));

  const presets = PRESETS.filter((p) => p < total);

  let selection: CountSelection | null = null;
  let error: string | null = null;

  if (mode === "first") {
    const n = toInt(countText);
    if (n === null || n < 1) error = "Son kiriting (kamida 1).";
    else if (n > total) error = `Bu to'plamda jami ${total} ta so'z bor.`;
    else selection = { from: 1, to: n, count: n, questions: n };
  } else {
    const f = toInt(fromText);
    const t = toInt(toText);
    if (f === null || t === null || f < 1 || t < 1) error = "Ikkala sonni kiriting.";
    else if (f > t) error = "Boshlanish soni oxirgisidan katta bo'lmasligi kerak.";
    else if (t > total) error = `Bu to'plamda jami ${total} ta so'z bor.`;
    else selection = { from: f, to: t, count: t - f + 1, questions: t - f + 1 };
  }

  // Optional second choice: how many questions to ask from the chosen words.
  let questionsError: string | null = null;
  if (withQuestionCount && selection) {
    const q = toInt(questionsText);
    if (q === null || q < 1) questionsError = "Savollar sonini kiriting (kamida 1).";
    else if (q > selection.count)
      questionsError = `Savollar soni tanlangan so'zlardan (${selection.count}) ko'p bo'lishi mumkin emas.`;
    else selection = { ...selection, questions: q };
    if (questionsError) selection = null;
  }

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-colors ${
      active ? "border-brand bg-brand-soft" : "border-border bg-background hover:border-border-strong"
    }`;

  const inputCls =
    "w-full h-11 px-3 rounded-xl border border-border bg-background text-center text-base font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="text-left">
      {withRange && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button type="button" className={chip(mode === "first")} onClick={() => setMode("first")}>
            Birinchi N ta
          </button>
          <button type="button" className={chip(mode === "range")} onClick={() => setMode("range")}>
            Oraliq (dan–gacha)
          </button>
        </div>
      )}

      {mode === "first" ? (
        <>
          <p className="text-sm font-semibold mb-2">Nechta so'z?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                className={chip(toInt(countText) === p)}
                onClick={() => setCountText(String(p))}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={chip(toInt(countText) === total)}
              onClick={() => setCountText(String(total))}
            >
              Hammasi ({total})
            </button>
          </div>
          <input
            inputMode="numeric"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            placeholder="Boshqa son..."
            className={inputCls}
          />
        </>
      ) : (
        <>
          <p className="text-sm font-semibold mb-2">Qaysi so'zlardan? (1–{total})</p>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              className={inputCls}
              aria-label="Boshlanish"
            />
            <span className="text-muted">–</span>
            <input
              inputMode="numeric"
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              className={inputCls}
              aria-label="Tugash"
            />
          </div>
        </>
      )}

      {withQuestionCount && (
        <div className="mt-5">
          <p className="text-sm font-semibold mb-2">Nechta savol?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[10, 20, 30, 50, 100].map((q) => (
              <button
                key={q}
                type="button"
                className={chip(toInt(questionsText) === q)}
                onClick={() => setQuestionsText(String(q))}
              >
                {q}
              </button>
            ))}
          </div>
          <input
            inputMode="numeric"
            value={questionsText}
            onChange={(e) => setQuestionsText(e.target.value)}
            placeholder="Boshqa son..."
            className={inputCls}
          />
        </div>
      )}

      <p className={`text-xs mt-2 min-h-[1rem] ${error || questionsError ? "text-red" : "text-muted"}`}>
        {error ??
          questionsError ??
          (selection
            ? withQuestionCount
              ? `${selection.count} ta so'zdan ${selection.questions} ta savol`
              : `${selection.count} ta savol tanlandi`
            : "")}
      </p>

      <Button size="lg" className="w-full mt-3" disabled={!selection} onClick={() => selection && onConfirm(selection)}>
        {confirmLabel}
      </Button>
    </div>
  );
}
