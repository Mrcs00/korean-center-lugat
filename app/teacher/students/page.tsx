"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, ChevronRight, Search, Trash2, UserX, Users, X } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { deleteStudents, moveStudentsToGroup } from "@/lib/services/teacherService";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { groupColor, masteryColor } from "@/lib/utils/groupColor";

function errorText(e: unknown): string {
  return (e as { message?: string } | null)?.message ?? "Ko'chirib bo'lmadi. Qayta urinib ko'ring.";
}

function StudentsContent() {
  const searchParams = useSearchParams();
  const { status, students, groups, errorMessage, refresh } = useTeacherData();

  const [filter, setFilter] = useState<string>(searchParams.get("filter") ?? "all"); // all | none | <groupId>
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState(""); // "" = not chosen, "none" = remove from group, else groupId
  const [moving, setMoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const noGroupCount = students.filter((s) => !s.groupId).length;
  const atRiskCount = students.filter((s) => s.masteryPercent < 20).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === "none" && s.groupId) return false;
      if (filter !== "all" && filter !== "none" && s.groupId !== filter) return false;
      if (q && !s.fullName.toLowerCase().includes(q) && !s.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, filter, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((s) => next.delete(s.id));
      else visible.forEach((s) => next.add(s.id));
      return next;
    });

  const handleMove = async () => {
    if (!target || selected.size === 0) return;
    const ids = [...selected];
    const targetId = target === "none" ? null : target;
    const expectedRemovals = students.filter(
      (s) => selected.has(s.id) && s.groupId && s.groupId !== targetId
    ).length;

    setMoving(true);
    setNotice(null);
    try {
      await moveStudentsToGroup(ids, targetId, expectedRemovals);
      const targetName = targetId ? groups.find((g) => g.id === targetId)?.name : "guruhsiz";
      setNotice({
        kind: "ok",
        text: targetId
          ? `${ids.length} ta o'quvchi "${targetName}" guruhiga ko'chirildi.`
          : `${ids.length} ta o'quvchi guruhdan chiqarildi.`,
      });
      setSelected(new Set());
      setTarget("");
      refresh();
    } catch (e) {
      setNotice({ kind: "err", text: errorText(e) });
    } finally {
      setMoving(false);
    }
  };

  const handleDelete = async () => {
    const ids = [...selected];
    setDeleting(true);
    setDeleteError(null);
    try {
      const deleted = await deleteStudents(ids);
      setConfirmDelete(false);
      setSelected(new Set());
      setTarget("");
      setNotice(
        deleted === ids.length
          ? { kind: "ok", text: `${deleted} ta akkaunt o'chirildi.` }
          : { kind: "err", text: `${ids.length} tadan ${deleted} tasi o'chirildi.` }
      );
      refresh();
    } catch (e) {
      setDeleteError(errorText(e));
    } finally {
      setDeleting(false);
    }
  };

  const selectedStudents = students.filter((s) => selected.has(s.id));

  const chip = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-surface text-muted border-border hover:border-border-strong hover:text-foreground"
    }`;

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 pb-32">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">O'quvchilar</h1>
          <p className="text-sm text-muted mb-6">
            Belgilab, bir nechta o'quvchini birdaniga to'g'ri guruhga ko'chirishingiz mumkin.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile icon={Users} label="Jami" value={students.length} tint="var(--brand-soft)" color="var(--brand-darker)" />
            <StatTile
              icon={UserX}
              label="Guruhsiz"
              value={noGroupCount}
              tint="var(--red-soft)"
              color="var(--red)"
              onClick={() => setFilter("none")}
            />
            <StatTile icon={AlertTriangle} label="E'tibor talab" value={atRiskCount} tint="var(--amber-soft)" color="var(--amber)" />
          </div>

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ism yoki login bo'yicha qidirish..."
              className="w-full h-11 rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button className={chip(filter === "all")} onClick={() => setFilter("all")}>
              Hammasi <span className="opacity-60">{students.length}</span>
            </button>
            {groups.map((g) => {
              const tone = groupColor(g.name);
              return (
                <button key={g.id} className={chip(filter === g.id)} onClick={() => setFilter(g.id)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
                  {g.name}
                  <span className="opacity-60">{students.filter((s) => s.groupId === g.id).length}</span>
                </button>
              );
            })}
            <button className={chip(filter === "none")} onClick={() => setFilter("none")}>
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--red)" }} />
              Guruhsiz <span className="opacity-60">{noGroupCount}</span>
            </button>
          </div>

          {notice && (
            <div
              className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm mb-4 ${
                notice.kind === "ok" ? "bg-green-soft text-green" : "bg-red-soft text-red"
              }`}
            >
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} aria-label="Yopish">
                <X size={16} />
              </button>
            </div>
          )}

          {students.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted">Hali hech kim ro'yxatdan o'tmagan.</p>
            </Card>
          ) : visible.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted">Bu filtr bo'yicha o'quvchi topilmadi.</p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground">
                  <Checkbox checked={allVisibleSelected} />
                  {allVisibleSelected ? "Tanlovni bekor qilish" : `Hammasini tanlash (${visible.length})`}
                </button>
                <span className="text-xs text-muted-soft">{visible.length} ta o'quvchi</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {visible.map((s) => {
                  const tone = groupColor(s.group);
                  const isSelected = selected.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 rounded-2xl border px-3 sm:px-4 py-3 transition-all duration-200 ${
                        isSelected
                          ? "border-brand bg-brand-tint shadow-[var(--shadow-sm)]"
                          : "border-border bg-surface hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        aria-label={`${s.fullName} ni tanlash`}
                        aria-pressed={isSelected}
                        className="shrink-0"
                      >
                        <Checkbox checked={isSelected} />
                      </button>

                      <Link href={`/teacher/students/${s.id}`} className="flex flex-1 min-w-0 items-center gap-3">
                        <div
                          className="h-11 w-11 rounded-full flex items-center justify-center text-base font-extrabold shrink-0"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{s.fullName}</p>
                          <p className="text-xs text-muted truncate">@{s.username}</p>
                          <span
                            className="sm:hidden mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: tone.bg, color: tone.fg }}
                          >
                            {s.group ?? "Guruhsiz"}
                          </span>
                        </div>
                      </Link>

                      <span
                        className="hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {s.group ?? "Guruhsiz"}
                      </span>

                      <div className="hidden md:block w-28 shrink-0">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-muted">Progress</span>
                          <span className="font-bold" style={{ color: masteryColor(s.masteryPercent) }}>
                            {s.masteryPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${s.masteryPercent}%`, background: masteryColor(s.masteryPercent) }}
                          />
                        </div>
                      </div>

                      <span className="hidden sm:inline-flex w-14 justify-center text-sm font-bold shrink-0">
                        {s.lastExamScore ?? "—"}
                      </span>

                      <Link href={`/teacher/students/${s.id}`} aria-label="Ochish" className="hidden sm:block text-muted">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {selected.size > 0 && (
          <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 lg:pl-64 pointer-events-none animate-rise">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 bg-foreground text-background rounded-2xl px-4 py-3 shadow-[var(--shadow-lg)] max-w-full">
              <span className="text-sm font-semibold">{selected.size} ta tanlandi</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-10 rounded-xl bg-background text-foreground text-sm px-3 outline-none"
              >
                <option value="" disabled>
                  Guruhni tanlang
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
                <option value="none">— Guruhsiz qilish —</option>
              </select>
              <Button size="sm" disabled={!target || moving} onClick={handleMove}>
                {moving ? "Ko'chirilmoqda..." : "Ko'chirish"}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDelete(true);
                }}
              >
                <Trash2 size={14} /> O'chirish
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                aria-label="Tanlovni bekor qilish"
                className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete}
          title="Akkauntlarni o'chirish"
          confirmLabel={`${selectedStudents.length} ta o'chirish`}
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        >
          <p>
            <span className="font-semibold text-foreground">{selectedStudents.length} ta</span> akkaunt va ularning
            barcha progressi, imtihonlari butunlay o'chadi. Bu amalni qaytarib bo'lmaydi.
          </p>
          <ul className="mt-3 max-h-36 overflow-y-auto flex flex-col gap-1">
            {selectedStudents.slice(0, 8).map((s) => (
              <li key={s.id} className="text-foreground">
                {s.fullName} <span className="text-muted">@{s.username}</span>
              </li>
            ))}
            {selectedStudents.length > 8 && <li className="text-muted">...va yana {selectedStudents.length - 8} ta</li>}
          </ul>
        </ConfirmDialog>
      </TeacherGate>
    </TeacherShell>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-brand border-brand text-foreground" : "border-border-strong bg-background"
      }`}
    >
      {checked && <Check size={13} strokeWidth={3.5} />}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
  color,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: number;
  tint: string;
  color: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="text-left">
      <Card className={`p-4 h-full ${onClick ? "hover:border-border-strong cursor-pointer" : ""}`}>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: tint }}>
          <Icon size={18} style={{ color }} />
        </div>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
        <p className="text-[11px] text-muted mt-1.5">{label}</p>
      </Card>
    </Tag>
  );
}

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsContent />
    </Suspense>
  );
}
