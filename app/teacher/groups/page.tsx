"use client";

import { useState } from "react";
import Link from "next/link";
import { UsersRound, Plus, X, Trash2, UserX, ArrowRight } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { supabase } from "@/lib/supabase/client";
import { groupColor, masteryColor } from "@/lib/utils/groupColor";

export default function TeacherGroupsPage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!groupToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    const { error } = await supabase.from("groups").delete().eq("id", groupToDelete.id);

    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
      return;
    }

    setGroupToDelete(null);
    refresh();
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setCreateError(null);

    const { error } = await supabase.from("groups").insert({ name: trimmed });

    setSaving(false);
    if (error) {
      setCreateError(
        error.message.includes("duplicate") ? "Bu nomdagi guruh allaqachon mavjud." : error.message
      );
      return;
    }

    setName("");
    setFormOpen(false);
    refresh();
  };

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Guruhlar</h1>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Yangi guruh
            </Button>
          </div>
          <p className="text-sm text-muted mb-6">O'quvchilaringizni guruhlarga ajrating.</p>

          {groups.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted">Hali guruh yaratilmagan.</p>
            </Card>
          )}

          {students.some((st) => !st.groupId) && (
            <Link href="/teacher/students?filter=none" className="block mb-4">
              <Card className="p-4 flex items-center justify-between border-red/30 bg-red-soft hover:border-red/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center">
                    <UserX size={18} className="text-red" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red">
                      {students.filter((st) => !st.groupId).length} ta o'quvchi guruhsiz
                    </p>
                    <p className="text-xs text-muted">Ularni to'g'ri guruhlarga taqsimlash</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-red" />
              </Card>
            </Link>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {groups.map((group) => {
              const members = students.filter((s) => s.groupId === group.id);
              const avgMastery =
                members.length > 0
                  ? Math.round(members.reduce((s, m) => s + m.masteryPercent, 0) / members.length)
                  : 0;
              const tone = groupColor(group.name);
              return (
                <Card key={group.id} className="p-5 relative overflow-hidden hover:border-border-strong">
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: tone.dot }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        <UsersRound size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{group.name}</p>
                        <p className="text-xs text-muted">{members.length} ta o'quvchi</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setGroupToDelete({ id: group.id, name: group.name })}
                      title="Guruhni o'chirish"
                      className="h-9 w-9 flex items-center justify-center rounded-xl text-muted hover:text-red hover:bg-red-soft transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-muted">O'rtacha progress</span>
                    <span className="font-bold" style={{ color: masteryColor(avgMastery) }}>
                      {avgMastery}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${avgMastery}%`, background: masteryColor(avgMastery) }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members.slice(0, 6).map((m) => (
                        <div
                          key={m.id}
                          title={m.fullName}
                          className="h-8 w-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {members.length > 6 && (
                        <div className="h-8 w-8 rounded-full border-2 border-surface bg-black/[0.06] flex items-center justify-center text-[11px] font-bold text-muted">
                          +{members.length - 6}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/teacher/students?filter=${group.id}`}
                      className="text-xs font-semibold text-brand-dark hover:underline"
                    >
                      Ko'rish →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {formOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5"
            onClick={() => setFormOpen(false)}
          >
            <Card elevation="lg" className="p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Yangi guruh</h3>
                <button onClick={() => setFormOpen(false)} className="text-muted hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <label className="text-xs font-semibold text-muted">Guruh nomi</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder="TOPIK 6 — Guruh D"
                className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />

              {createError && (
                <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2 mt-3">{createError}</p>
              )}

              <Button size="lg" className="w-full mt-4" disabled={!name.trim() || saving} onClick={handleCreate}>
                {saving ? "Yaratilmoqda..." : "Guruh yaratish"}
              </Button>
            </Card>
          </div>
        )}

        {groupToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5"
            onClick={() => setGroupToDelete(null)}
          >
            <Card elevation="lg" className="p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Guruhni o'chirish</h3>
                <button
                  onClick={() => setGroupToDelete(null)}
                  className="text-muted hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-muted">
                <span className="font-semibold text-foreground">{groupToDelete.name}</span> guruhini
                o'chirmoqchimisiz? Guruhdagi barcha o'quvchilar guruhdan chiqariladi. Bu amalni
                qaytarib bo'lmaydi.
              </p>

              {deleteError && (
                <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2 mt-3">{deleteError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setGroupToDelete(null)}
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "O'chirilmoqda..." : "O'chirish"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </TeacherGate>
    </TeacherShell>
  );
}
