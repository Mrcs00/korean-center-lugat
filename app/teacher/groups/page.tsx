"use client";

import { useState } from "react";
import { UsersRound, Plus, X } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { supabase } from "@/lib/supabase/client";

export default function TeacherGroupsPage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
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

          <div className="flex flex-col gap-3">
            {groups.map((group) => {
              const members = students.filter((s) => s.group === group.name);
              const avgMastery =
                members.length > 0
                  ? Math.round(members.reduce((s, m) => s + m.masteryPercent, 0) / members.length)
                  : 0;
              return (
                <Card key={group.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center">
                        <UsersRound size={20} className="text-brand-darker" />
                      </div>
                      <div>
                        <p className="font-bold">{group.name}</p>
                        <p className="text-xs text-muted">
                          {members.length} ta o'quvchi
                          {members.length > 0 && ` · o'rtacha ${avgMastery}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                  {members.length > 0 && (
                    <div className="flex -space-x-2">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          title={m.fullName}
                          className="h-8 w-8 rounded-full bg-brand-soft border-2 border-surface flex items-center justify-center text-xs font-bold"
                        >
                          {m.fullName.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
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
      </TeacherGate>
    </TeacherShell>
  );
}
