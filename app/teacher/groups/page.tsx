"use client";

import { UsersRound } from "lucide-react";
import { TeacherShell } from "@/components/layout/TeacherShell";
import { TeacherGate } from "@/components/layout/TeacherGate";
import { Card } from "@/components/ui/Card";
import { useTeacherData } from "@/lib/hooks/useTeacherData";

export default function TeacherGroupsPage() {
  const { status, students, groups, errorMessage, refresh } = useTeacherData();

  return (
    <TeacherShell>
      <TeacherGate status={status} errorMessage={errorMessage} onRetry={refresh}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Guruhlar</h1>
          <p className="text-sm text-muted mb-6">
            Guruhlar Supabase'dagi <code className="text-xs">groups</code> jadvalidan olinadi. Yangi
            guruh qo'shish uchun SQL Editor'da qator qo'shing.
          </p>

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
      </TeacherGate>
    </TeacherShell>
  );
}
