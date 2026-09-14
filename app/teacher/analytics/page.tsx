"use client";

import { TrendingUp, AlertTriangle } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { useTeacherData } from "@/lib/hooks/useTeacherData";

export default function TeacherAnalyticsPage() {
  const { status, students, errorMessage, refresh } = useTeacherData();

  const hardestWords = students
    .flatMap((s) => s.wrongWords)
    .reduce<Record<string, { uzbek: string; count: number }>>((acc, w) => {
      acc[w.koreanWord] = { uzbek: w.uzbekTranslation, count: (acc[w.koreanWord]?.count ?? 0) + w.timesWrong };
      return acc;
    }, {});
  const ranked = Object.entries(hardestWords).sort((a, b) => b[1].count - a[1].count).slice(0, 15);
  const sortedByMastery = [...students].sort((a, b) => b.masteryPercent - a.masteryPercent);

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Analitika</h1>
          <p className="text-sm text-muted mb-6">Barcha o'quvchilar bo'yicha eng qiyin so'zlar va reyting.</p>

          <Card className="p-5 mb-6">
            <div className="flex items-center gap-2 mb-4 text-muted">
              <AlertTriangle size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">Eng ko'p xato qilingan so'zlar</p>
            </div>
            {ranked.length === 0 ? (
              <p className="text-sm text-muted">Hozircha ma'lumot yo'q.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {ranked.map(([korean, data]) => (
                  <div key={korean} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-kr font-semibold">{korean}</p>
                      <p className="text-xs text-muted">{data.uzbek}</p>
                    </div>
                    <span className="text-xs font-semibold text-red bg-red-soft px-2.5 py-1 rounded-full">
                      {data.count} marta
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 text-muted">
              <TrendingUp size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">O'quvchilar reytingi</p>
            </div>
            {sortedByMastery.length === 0 ? (
              <p className="text-sm text-muted">Hozircha o'quvchi yo'q.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {sortedByMastery.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted w-5">{i + 1}</span>
                      <span className="text-sm font-semibold">{s.fullName}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-darker">{s.masteryPercent}%</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </TeacherGate>
    </TeacherShell>
  );
}
