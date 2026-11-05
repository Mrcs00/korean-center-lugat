"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Target, Plus, Clock, Trash2, X, Users, BookOpenCheck } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VOCAB_SETS } from "@/lib/data/seed";
import { SEOUL_BOOKS } from "@/lib/data/seoulHangugoMeta";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import {
  AssignmentKind,
  RealAssignment,
  fetchAllAssignments,
  createAssignment,
  deleteAssignment,
} from "@/lib/services/assignmentService";
import { bookWords, examSetTitle, rangeLabel, setWordsInOrder } from "@/lib/utils/examSets";

// Groups the huge flat VOCAB_SETS list into <optgroup> sections so the
// picker stays usable across TOPIK reading/listening sets and every
// Seoul Hangugo book.
function useGroupedSetOptions() {
  return useMemo(() => {
    const readingSets = VOCAB_SETS.filter((s) => s.id.endsWith("-reading") && !s.book).sort(
      (a, b) => a.setNumber - b.setNumber
    );
    const listeningSets = VOCAB_SETS.filter((s) => s.id.endsWith("-listening") && !s.book).sort(
      (a, b) => a.setNumber - b.setNumber
    );
    const seoulGroups = SEOUL_BOOKS.map((book) => ({
      label: `서울대 한국어 ${book.label}`,
      sets: VOCAB_SETS.filter((s) => s.book === book.id).sort((a, b) => (a.unit ?? 0) - (b.unit ?? 0)),
    })).filter((g) => g.sets.length > 0);

    return [
      { label: "TOPIK 읽기 (o'qish)", sets: readingSets },
      { label: "TOPIK 듣기 (tinglash)", sets: listeningSets },
      ...seoulGroups,
    ].filter((g) => g.sets.length > 0);
  }, []);
}

const inputCls =
  "mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function toInt(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? parseInt(value, 10) : null;
}

export default function TeacherExamsPage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();
  const groupedSets = useGroupedSetOptions();
  const [formOpen, setFormOpen] = useState(false);

  const [assignments, setAssignments] = useState<RealAssignment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [kind, setKind] = useState<AssignmentKind>("set");
  const [groupId, setGroupId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minMastery, setMinMastery] = useState(70);

  // kind = "set": which set, and which words of it
  const [setId, setSetId] = useState(groupedSets[0]?.sets[0]?.id ?? "");
  const [rangeMode, setRangeMode] = useState<"all" | "first" | "range">("all");
  const [firstText, setFirstText] = useState("50");
  const [fromText, setFromText] = useState("1");
  const [toText, setToText] = useState("50");

  // kind = "book_exam": which book, and how many random questions
  const [bookId, setBookId] = useState(SEOUL_BOOKS[0].id);
  const [questionText, setQuestionText] = useState("50");
  const [attemptsText, setAttemptsText] = useState("2");

  const loadAssignments = useCallback(async () => {
    try {
      setAssignments(await fetchAllAssignments());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Noma'lum xato");
    }
  }, []);

  useEffect(() => {
    if (status === "ready") loadAssignments();
  }, [status, loadAssignments]);

  useEffect(() => {
    if (groups.length > 0 && !groupId) setGroupId(groups[0].id);
  }, [groups, groupId]);

  const setTotal = useMemo(() => setWordsInOrder(setId).length, [setId]);
  const bookTotal = useMemo(() => bookWords(bookId).length, [bookId]);

  // Validate the chosen words / questions; `range` is null for "whole set".
  let range: { from: number; to: number } | null = null;
  let questionCount = 0;
  let inputError: string | null = null;

  if (kind === "set") {
    if (rangeMode === "first") {
      const n = toInt(firstText);
      if (n === null || n < 1) inputError = "So'zlar sonini kiriting.";
      else if (n > setTotal) inputError = `Bu to'plamda jami ${setTotal} ta so'z bor.`;
      else range = { from: 1, to: n };
    } else if (rangeMode === "range") {
      const f = toInt(fromText);
      const t = toInt(toText);
      if (f === null || t === null || f < 1 || t < 1) inputError = "Ikkala sonni kiriting.";
      else if (f > t) inputError = "Boshlanish soni oxirgisidan katta bo'lmasligi kerak.";
      else if (t > setTotal) inputError = `Bu to'plamda jami ${setTotal} ta so'z bor.`;
      else range = { from: f, to: t };
    }
  } else {
    const q = toInt(questionText);
    if (q === null || q < 1) inputError = "Savollar sonini kiriting.";
    else if (q > bookTotal) inputError = `Bu kitobda jami ${bookTotal} ta so'z bor.`;
    else questionCount = q;
    const at = toInt(attemptsText);
    if (!inputError && (at === null || at < 1 || at > 10)) inputError = "Urinishlar soni 1 dan 10 gacha bo'lsin.";
  }

  const canSave = Boolean(groupId) && !inputError && (kind === "book_exam" || Boolean(setId));

  const handleCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    setFormError(null);
    try {
      await createAssignment({
        groupId,
        kind,
        setId: kind === "set" ? setId : undefined,
        wordFrom: range?.from ?? null,
        wordTo: range?.to ?? null,
        bookId: kind === "book_exam" ? bookId : undefined,
        questionCount: kind === "book_exam" ? questionCount : undefined,
        maxAttempts: kind === "book_exam" ? toInt(attemptsText) ?? 2 : undefined,
        deadline: deadline || null,
        minimumMastery: minMastery,
      });
      setFormOpen(false);
      setDeadline("");
      await loadAssignments();
    } catch (err) {
      setFormError((err as { message?: string } | null)?.message ?? "Noma'lum xato");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    await deleteAssignment(id);
    loadAssignments();
  };

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
      active ? "border-brand bg-brand-soft" : "border-border bg-background hover:border-border-strong"
    }`;

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Imtihonlar va topshiriqlar</h1>
            <Button
              size="sm"
              onClick={() => {
                setFormError(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> Yangi topshiriq
            </Button>
          </div>
          <p className="text-sm text-muted mb-6">
            Guruhlarga muddatli lug&apos;at topshiriqlari yoki kitobning umumiy imtihonini yuboring.
          </p>

          <div className="flex flex-col gap-3">
            {loadError && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{loadError}</p>}
            {assignments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted">Hali topshiriq berilmagan.</p>
              </Card>
            )}
            {assignments.map((a) => {
              const memberCount = students.filter((s) => s.group === a.groupName).length;
              const isBookExam = a.kind === "book_exam";
              const title = examSetTitle(a.setId);
              const detail = isBookExam
                ? `${a.questionCount ?? 50} ta tasodifiy savol · ${a.maxAttempts} urinish`
                : a.wordFrom && a.wordTo
                ? rangeLabel(a.wordFrom, a.wordTo)
                : "Butun to'plam";
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                        {isBookExam ? (
                          <BookOpenCheck size={20} className="text-brand-darker" />
                        ) : (
                          <Target size={20} className="text-brand-darker" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-kr font-bold truncate">
                          {title} — {a.groupName}
                        </p>
                        <p className="text-xs text-muted flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="font-semibold text-foreground/80">{detail}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Muddat: {a.deadline ?? "Muddatsiz"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {memberCount} o&apos;quvchi
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(a.id)}
                      aria-label="O'chirish"
                      className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-soft mt-3">
                    {isBookExam ? "O'tish bali" : "Talab (test/imtihonda to'g'ri javob bergan so'zlar)"}: {a.minimumMastery}%
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {formOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 py-6 overflow-y-auto"
            onClick={() => setFormOpen(false)}
          >
            <Card elevation="lg" className="p-6 max-w-md w-full my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Yangi topshiriq</h3>
                <button onClick={() => setFormOpen(false)} className="text-muted hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={chip(kind === "set")} onClick={() => setKind("set")}>
                    Lug&apos;at topshirig&apos;i
                  </button>
                  <button type="button" className={chip(kind === "book_exam")} onClick={() => setKind("book_exam")}>
                    Kitob umumiy imtihoni
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted">Guruh</label>
                  <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
                    {groups.length === 0 && <option value="">Guruhlar yo&apos;q</option>}
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {kind === "set" ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted">Lug&apos;at to&apos;plami</label>
                      <select value={setId} onChange={(e) => setSetId(e.target.value)} className={`font-kr ${inputCls}`}>
                        {groupedSets.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.sets.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted">Qaysi so&apos;zlar? (jami {setTotal} ta)</label>
                      <div className="grid grid-cols-3 gap-2 mt-1.5">
                        <button type="button" className={chip(rangeMode === "all")} onClick={() => setRangeMode("all")}>
                          Hammasi
                        </button>
                        <button type="button" className={chip(rangeMode === "first")} onClick={() => setRangeMode("first")}>
                          Birinchi N ta
                        </button>
                        <button type="button" className={chip(rangeMode === "range")} onClick={() => setRangeMode("range")}>
                          Dan–gacha
                        </button>
                      </div>
                      {rangeMode === "first" && (
                        <input
                          inputMode="numeric"
                          value={firstText}
                          onChange={(e) => setFirstText(e.target.value)}
                          placeholder="Masalan 50"
                          className={`${inputCls} text-center font-semibold`}
                        />
                      )}
                      {rangeMode === "range" && (
                        <div className="flex items-center gap-2">
                          <input
                            inputMode="numeric"
                            value={fromText}
                            onChange={(e) => setFromText(e.target.value)}
                            aria-label="Boshlanish"
                            className={`${inputCls} text-center font-semibold`}
                          />
                          <span className="text-muted mt-1.5">–</span>
                          <input
                            inputMode="numeric"
                            value={toText}
                            onChange={(e) => setToText(e.target.value)}
                            aria-label="Tugash"
                            className={`${inputCls} text-center font-semibold`}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted">Kitob</label>
                      <select value={bookId} onChange={(e) => setBookId(e.target.value)} className={inputCls}>
                        {SEOUL_BOOKS.map((b) => (
                          <option key={b.id} value={b.id}>
                            서울대 한국어 {b.label} ({b.unitCount} ta 과, {bookWords(b.id).length} ta so&apos;z)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">
                        Nechta tasodifiy savol? (1–{bookTotal})
                      </label>
                      <input
                        inputMode="numeric"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        className={`${inputCls} text-center font-semibold`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">
                        Necha marta topshirish mumkin? (1–10)
                      </label>
                      <input
                        inputMode="numeric"
                        value={attemptsText}
                        onChange={(e) => setAttemptsText(e.target.value)}
                        className={`${inputCls} text-center font-semibold`}
                      />
                    </div>
                  </>
                )}

                {inputError && <p className="text-xs text-red -mt-2">{inputError}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted">Muddat</label>
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted">
                      {kind === "book_exam" ? "O'tish bali %" : "Talab: tasdiqlangan so'z %"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minMastery}
                      onChange={(e) => setMinMastery(Number(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {formError && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{formError}</p>}

                <Button size="lg" className="w-full mt-1" onClick={handleCreate} disabled={saving || !canSave}>
                  {saving ? "Yuklanmoqda..." : "Topshiriq berish"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </TeacherGate>
    </TeacherShell>
  );
}
