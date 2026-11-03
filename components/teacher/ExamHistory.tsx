"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  ExamAttemptSummary,
  WrongAnswerDetail,
  fetchAttemptWrongAnswers,
} from "@/lib/services/teacherService";
import { examSetTitle, parseBookExamSetId } from "@/lib/utils/examSets";

const PAGE_SIZE = 10;

function percentOf(a: ExamAttemptSummary): number {
  return a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0;
}

function scoreColor(percent: number): string {
  if (percent < 50) return "var(--red)";
  if (percent < 70) return "var(--amber)";
  return "var(--green)";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Filter = "all" | "book" | "normal";

// Every exam a student has taken (not just the last one). Tap a row to see
// which words they got wrong in that attempt.
export function ExamHistory({ attempts }: { attempts: ExamAttemptSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, WrongAnswerDetail[] | "loading" | "error">>({});

  const isBook = (a: ExamAttemptSummary) => parseBookExamSetId(a.setId) !== null;
  const filtered = attempts.filter((a) => (filter === "all" ? true : filter === "book" ? isBook(a) : !isBook(a)));
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  const percents = attempts.map(percentOf);
  const average = percents.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : 0;
  const best = percents.length ? Math.max(...percents) : 0;

  const toggle = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (details[id] && details[id] !== "error") return;
    setDetails((d) => ({ ...d, [id]: "loading" }));
    try {
      const wrong = await fetchAttemptWrongAnswers(id);
      setDetails((d) => ({ ...d, [id]: wrong }));
    } catch {
      setDetails((d) => ({ ...d, [id]: "error" }));
    }
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-surface text-muted border-border hover:border-border-strong"
    }`;

  return (
    <Card className="p-5 mb-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
        Imtihonlar ({attempts.length})
      </p>

      {attempts.length === 0 ? (
        <p className="text-sm text-muted">Hali imtihon topshirmagan.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="rounded-xl bg-background py-2.5">
              <p className="text-lg font-extrabold">{attempts.length}</p>
              <p className="text-[11px] text-muted">topshirilgan</p>
            </div>
            <div className="rounded-xl bg-background py-2.5">
              <p className="text-lg font-extrabold" style={{ color: scoreColor(average) }}>
                {average}%
              </p>
              <p className="text-[11px] text-muted">o&apos;rtacha</p>
            </div>
            <div className="rounded-xl bg-background py-2.5">
              <p className="text-lg font-extrabold" style={{ color: scoreColor(best) }}>
                {best}%
              </p>
              <p className="text-[11px] text-muted">eng yaxshi</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <button className={chip(filter === "all")} onClick={() => setFilter("all")}>
              Hammasi
            </button>
            <button className={chip(filter === "book")} onClick={() => setFilter("book")}>
              Umumiy imtihonlar
            </button>
            <button className={chip(filter === "normal")} onClick={() => setFilter("normal")}>
              Oddiy
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted py-2">Bu turdagi imtihon yo&apos;q.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((a) => {
                const percent = percentOf(a);
                const isOpen = openId === a.id;
                const detail = details[a.id];
                return (
                  <div key={a.id} className="rounded-2xl border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(a.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-kr font-semibold text-sm truncate">{examSetTitle(a.setId)}</p>
                        <p className="text-xs text-muted">{formatDate(a.startedAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold" style={{ color: scoreColor(percent) }}>
                          {a.correct} / {a.total}
                        </p>
                        <p className="text-[11px] text-muted">{percent}%</p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border bg-background px-4 py-3">
                        <p className="text-[11px] text-muted mb-2">
                          To&apos;g&apos;ri {a.correct} · Xato {a.wrong} · O&apos;tkazib yuborilgan {a.skipped}
                        </p>
                        {detail === "loading" || detail === undefined ? (
                          <p className="text-xs text-muted">Yuklanmoqda...</p>
                        ) : detail === "error" ? (
                          <p className="text-xs text-red">Xato javoblarni yuklab bo&apos;lmadi.</p>
                        ) : detail.length === 0 ? (
                          <p className="text-xs text-muted">Xato javob yo&apos;q.</p>
                        ) : (
                          <div className="flex flex-col divide-y divide-border">
                            {detail.map((w) => (
                              <div key={w.wordId} className="py-2 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-kr font-semibold text-sm">{w.koreanWord}</p>
                                  <p className="text-xs text-muted">{w.uzbekTranslation}</p>
                                </div>
                                <div className="text-right text-xs shrink-0">
                                  <p className="text-green font-semibold">{w.correctAnswer}</p>
                                  <p className="text-red">{w.studentAnswer ? w.studentAnswer : "—"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-brand-dark mt-3"
            >
              {showAll ? "Oxirgi 10 tasini ko'rsatish" : `Hammasini ko'rsatish (${filtered.length})`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
