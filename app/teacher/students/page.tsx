"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTeacherData } from "@/lib/hooks/useTeacherData";

export default function TeacherStudentsPage() {
  const { status, students, errorMessage, refresh } = useTeacherData();

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">O'quvchilar</h1>
          <p className="text-sm text-muted mb-6">Barcha ro'yxatdan o'tgan o'quvchilar va ularning progressi.</p>

          {students.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted">Hali hech kim ro'yxatdan o'tmagan.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden sm:grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-2 px-5 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide border-b border-border">
                <span>O'quvchi</span>
                <span>Guruh</span>
                <span>Progress</span>
                <span>Oxirgi test</span>
                <span />
              </div>
              <div className="flex flex-col divide-y divide-border">
                {students.map((s) => (
                  <Link key={s.id} href={`/teacher/students/${s.id}`}>
                    <div className="grid sm:grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-2 items-center px-5 py-4 hover:bg-black/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold shrink-0">
                          {s.fullName.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold">{s.fullName}</span>
                      </div>
                      <span className="text-xs text-muted">{s.group ?? "Guruhsiz"}</span>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={s.masteryPercent} className="w-16" />
                        <span className="text-xs font-semibold">{s.masteryPercent}%</span>
                      </div>
                      <span className="text-sm font-bold">{s.lastExamScore ?? "—"}</span>
                      <ChevronRight size={16} className="text-muted justify-self-end hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </TeacherGate>
    </TeacherShell>
  );
}
