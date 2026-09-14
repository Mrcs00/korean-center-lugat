"use client";

import Link from "next/link";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { useTeacherData } from "@/lib/hooks/useTeacherData";

export default function TeacherHomePage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();

  const avgMastery =
    students.length > 0
      ? Math.round(students.reduce((s, st) => s + st.masteryPercent, 0) / students.length)
      : 0;
  const atRisk = students.filter((s) => s.masteryPercent < 20);

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Umumiy ko'rinish</h1>
          <p className="text-sm text-muted mb-6">Barcha guruhlaringiz bo'yicha qisqacha holat.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <Metric icon={Users} label="O'quvchilar" value={students.length} />
            <Metric icon={Users} label="Guruhlar" value={groups.length} />
            <Metric icon={TrendingUp} label="O'rtacha mastery" value={`${avgMastery}%`} />
            <Metric icon={AlertTriangle} label="E'tibor talab" value={atRisk.length} accent />
          </div>

          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Ro'yxatdan o'tgan o'quvchilar
              </p>
              <Link href="/teacher/students" className="text-xs font-semibold text-brand-dark">
                Barchasi →
              </Link>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                Hali hech kim ro'yxatdan o'tmagan.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {students.slice(0, 8).map((s) => (
                  <Link key={s.id} href={`/teacher/students/${s.id}`}>
                    <div className="flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-black/[0.03] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{s.fullName}</p>
                          <p className="text-xs text-muted">{s.group ?? "Guruhsiz"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold">
                        {s.lastExamScore ? s.lastExamScore : `${s.masteryPercent}% mastery`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {atRisk.length > 0 && (
            <Card className="p-5 border-red/20 bg-red/[0.03]">
              <div className="flex items-center gap-2 mb-3 text-red">
                <AlertTriangle size={16} />
                <p className="text-xs font-semibold uppercase tracking-wide">E'tibor talab qiladi</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {atRisk.map((s) => (
                  <Link key={s.id} href={`/teacher/students/${s.id}`} className="text-sm font-medium hover:underline">
                    {s.fullName} — mastery {s.masteryPercent}%
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

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <Icon size={16} className="text-muted mb-2" />
      <p className={`text-2xl font-extrabold ${accent ? "text-red" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </Card>
  );
}
