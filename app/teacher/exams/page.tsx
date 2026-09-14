"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, Plus, Clock, Trash2, X, Users } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VOCAB_SETS } from "@/lib/data/seed";
import { SEOUL_BOOKS } from "@/lib/data/seoulHangugoMeta";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { useAssignments } from "@/lib/store/assignmentStore";

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

export default function TeacherExamsPage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();
  const { assignments, addAssignment, removeAssignment } = useAssignments();
  const groupedSets = useGroupedSetOptions();
  const [formOpen, setFormOpen] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [setId, setSetId] = useState(groupedSets[0]?.sets[0]?.id ?? "");
  const [deadline, setDeadline] = useState("");
  const [minMastery, setMinMastery] = useState(70);

  useEffect(() => {
    if (groups.length > 0 && !groupName) setGroupName(groups[0].name);
  }, [groups, groupName]);

  const handleCreate = () => {
    if (!setId || !groupName) return;
    addAssignment({
      groupId: groupName,
      setId,
      deadline: deadline || "Muddatsiz",
      minimumMastery: minMastery,
    });
    setFormOpen(false);
    setDeadline("");
  };

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Imtihonlar va topshiriqlar</h1>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Yangi topshiriq
            </Button>
          </div>
          <p className="text-sm text-muted mb-6">
            Guruhlarga muddatli lug'at topshiriqlari bering va bajarilishini kuzating.
          </p>

          <div className="flex flex-col gap-3">
            {assignments.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted">Hali topshiriq berilmagan.</p>
              </Card>
            )}
            {assignments.map((a) => {
              const set = VOCAB_SETS.find((s) => s.id === a.setId);
              const memberCount = students.filter((s) => s.group === a.groupId).length;
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                        <Target size={20} className="text-brand-darker" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-kr font-bold truncate">
                          {set?.title ?? a.setId} — {a.groupId}
                        </p>
                        <p className="text-xs text-muted flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Muddat: {a.deadline}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {memberCount} o'quvchi
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAssignment(a.id)}
                      aria-label="O'chirish"
                      className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-soft mt-3">
                    Talab qilingan mastery: {a.minimumMastery}%
                  </p>
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
            <Card elevation="lg" className="p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Yangi topshiriq</h3>
                <button onClick={() => setFormOpen(false)} className="text-muted hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted">Guruh</label>
                  <select
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  >
                    {groups.length === 0 && <option value="">Guruhlar yo'q</option>}
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted">Lug'at to'plami</label>
                  <select
                    value={setId}
                    onChange={(e) => setSetId(e.target.value)}
                    className="font-kr mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                  >
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted">Muddat</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted">Min. mastery %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minMastery}
                      onChange={(e) => setMinMastery(Number(e.target.value))}
                      className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                </div>

                <Button size="lg" className="w-full mt-1" onClick={handleCreate}>
                  Topshiriq berish
                </Button>
              </div>
            </Card>
          </div>
        )}
      </TeacherGate>
    </TeacherShell>
  );
}
