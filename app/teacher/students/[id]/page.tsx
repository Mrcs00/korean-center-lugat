"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTeacherData } from "@/lib/hooks/useTeacherData";
import { VOCAB_SETS } from "@/lib/data/seed";

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const { status, students, errorMessage, refresh } = useTeacherData();
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
              <Card className="p-6 mb-4">
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-14 w-14 rounded-full bg-brand-soft flex items-center justify-center text-xl font-extrabold">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">{student.fullName}</h1>
                    <p className="text-sm text-muted">@{student.username} · {student.group ?? "Guruhsiz"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold">{student.totalMastered.toLocaleString()}</p>
                    <p className="text-[11px] text-muted">so'z o'zlashtirilgan</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-brand-dark">{student.masteryPercent}%</p>
                    <p className="text-[11px] text-muted">Umumiy mastery</p>
                  </div>
                </div>
                <ProgressBar value={student.masteryPercent} className="mt-5" />
              </Card>

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
