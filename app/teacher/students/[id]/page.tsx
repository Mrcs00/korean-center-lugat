"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { VOCAB_SETS } from "@/lib/data/seed";
import { moveStudentsToGroup, RealStudent } from "@/lib/services/teacherService";
import { groupColor, masteryColor } from "@/lib/utils/groupColor";

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const { status, students, groups, errorMessage, refresh } = useTeacherData();
  const student = students.find((s) => s.id === params.id);

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
          <Link
            href="/teacher/students"
            className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground"
          >
            <ArrowLeft size={16} /> O'quvchilar
          </Link>

          {!student ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted">O'quvchi topilmadi.</p>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden mb-4">
                <div
                  className="h-20"
                  style={{
                    background: `linear-gradient(135deg, ${groupColor(student.group).dot}, var(--brand))`,
                    opacity: 0.85,
                  }}
                />
                <div className="px-6 pb-6">
                  <div className="-mt-9 flex items-end gap-4 mb-5">
                    <div
                      className="h-[72px] w-[72px] rounded-full border-4 border-surface flex items-center justify-center text-3xl font-extrabold shrink-0"
                      style={{ background: groupColor(student.group).bg, color: groupColor(student.group).fg }}
                    >
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="pb-1 min-w-0">
                      <h1 className="text-xl font-extrabold tracking-tight truncate">{student.fullName}</h1>
                      <p className="text-sm text-muted">@{student.username}</p>
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-5"
                    style={{ background: groupColor(student.group).bg, color: groupColor(student.group).fg }}
                  >
                    {student.group ?? "Guruhsiz"}
                  </span>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-background py-3">
                      <p className="text-xl font-extrabold">{student.totalMastered.toLocaleString()}</p>
                      <p className="text-[11px] text-muted">o'zlashtirilgan</p>
                    </div>
                    <div className="rounded-2xl bg-background py-3">
                      <p className="text-xl font-extrabold" style={{ color: masteryColor(student.masteryPercent) }}>
                        {student.masteryPercent}%
                      </p>
                      <p className="text-[11px] text-muted">umumiy mastery</p>
                    </div>
                    <div className="rounded-2xl bg-background py-3">
                      <p className="text-xl font-extrabold">
                        {student.avgExamScore !== null ? `${student.avgExamScore}%` : "—"}
                      </p>
                      <p className="text-[11px] text-muted">o'rtacha test</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden mt-5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${student.masteryPercent}%`, background: masteryColor(student.masteryPercent) }}
                    />
                  </div>
                </div>
              </Card>

              <GroupChanger
                key={`${student.id}-${student.groupId ?? "none"}`}
                student={student}
                groups={groups}
                onDone={refresh}
              />

              <Card className="p-5 mb-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Imtihonlar
                </p>
                {student.lastExamScore ? (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {VOCAB_SETS.find((s) => s.id === student.lastExamSetId)?.title ?? student.lastExamSetId}
                    </span>
                    <span className="text-xl font-extrabold text-brand-dark">{student.lastExamScore}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Hali imtihon topshirmagan.</p>
                )}
                {student.avgExamScore !== null && (
                  <p className="text-xs text-muted mt-2">O'rtacha ball: {student.avgExamScore}%</p>
                )}
              </Card>

              <Card className="p-5">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                  Xato so'zlar ({student.wrongWords.length})
                </p>
                {student.wrongWords.length === 0 ? (
                  <p className="text-sm text-muted">Hozircha xato qilingan so'z yo'q.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {student.wrongWords.map((w) => (
                      <div key={w.wordId} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="font-kr font-semibold">{w.koreanWord}</p>
                          <p className="text-xs text-muted">{w.uzbekTranslation}</p>
                        </div>
                        <span className="text-xs font-semibold text-red bg-red-soft px-2.5 py-1 rounded-full">
                          {w.timesWrong} marta xato
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </TeacherGate>
    </TeacherShell>
  );
}

function GroupChanger({
  student,
  groups,
  onDone,
}: {
  student: RealStudent;
  groups: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [value, setValue] = useState(student.groupId ?? "none");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const targetId = value === "none" ? null : value;
  const unchanged = targetId === student.groupId;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await moveStudentsToGroup([student.id], targetId, student.groupId && student.groupId !== targetId ? 1 : 0);
      setMessage({ kind: "ok", text: "Guruh o'zgartirildi." });
      onDone();
    } catch (e) {
      setMessage({
        kind: "err",
        text: (e as { message?: string } | null)?.message ?? "Saqlab bo'lmadi. Qayta urinib ko'ring.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 mb-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Guruhni o'zgartirish</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
          <option value="none">Guruhsiz</option>
        </select>
        <Button disabled={unchanged || saving} onClick={handleSave}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 mt-3 ${
            message.kind === "ok" ? "bg-green-soft text-green" : "bg-red-soft text-red"
          }`}
        >
          {message.text}
        </p>
      )}
    </Card>
  );
}
