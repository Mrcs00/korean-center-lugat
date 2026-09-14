"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Target, Clock, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore } from "@/lib/store/progressStore";
import { useAssignments } from "@/lib/store/assignmentStore";
import { MOCK_STUDENTS } from "@/lib/data/teacherMock";
import { VOCAB_SETS } from "@/lib/data/seed";
import { setProgressPercent } from "@/lib/services/statsService";
import { supabase } from "@/lib/supabase/client";

interface RealGroupmate {
  id: string;
  full_name: string;
}

export default function GroupsPage() {
  const { profile, progress } = useStore();
  const { assignments } = useAssignments();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [realGroupName, setRealGroupName] = useState<string | null>(null);
  const [realGroupmates, setRealGroupmates] = useState<RealGroupmate[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRealGroup() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (!cancelled) setLoadingAuth(false);
        return;
      }

      const { data: membership } = await supabase
        .from("group_members")
        .select("group_id, groups(name)")
        .eq("student_id", user.id)
        .maybeSingle();

      if (!membership) {
        if (!cancelled) setLoadingAuth(false);
        return;
      }

      const groupName = (membership.groups as unknown as { name: string } | null)?.name ?? null;

      const { data: mates } = await supabase
        .from("group_members")
        .select("student_id, profiles(id, full_name)")
        .eq("group_id", membership.group_id);

      if (!cancelled) {
        setRealGroupName(groupName);
        setRealGroupmates(
          (mates ?? [])
            .map((m) => m.profiles as unknown as { id: string; full_name: string } | null)
            .filter((p): p is RealGroupmate => Boolean(p) && p!.id !== user.id)
        );
        setLoadingAuth(false);
      }
    }

    loadRealGroup();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefer real Supabase group data (once registered/logged in via
  // /register or /login); fall back to the offline mock roster so the demo
  // still works before Supabase is set up.
  const usingRealData = realGroupName !== null;
  const mockMe = MOCK_STUDENTS.find((s) => s.fullName === profile.fullName) ?? MOCK_STUDENTS[0];
  const groupName = realGroupName ?? mockMe.group;
  const classmates: { id: string; fullName: string; masteryPercent?: number }[] = usingRealData
    ? realGroupmates.map((m) => ({ id: m.id, fullName: m.full_name }))
    : MOCK_STUDENTS.filter((s) => s.group === mockMe.group && s.id !== mockMe.id).map((s) => ({
        id: s.id,
        fullName: s.fullName,
        masteryPercent: s.masteryPercent,
      }));

  const myAssignments = assignments.filter((a) => a.groupId === groupName);

  if (loadingAuth) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-5 md:px-8 py-16 text-center text-sm text-muted">
          Yuklanmoqda...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Guruhlar</h1>
        <p className="text-sm text-muted mb-6">Sizning guruhingiz va o'qituvchi topshiriqlari.</p>

        <Card elevation="md" className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
              <Users size={20} className="text-brand-darker" />
            </div>
            <div>
              <p className="font-bold text-lg">{groupName}</p>
              <p className="text-xs text-muted">{classmates.length + 1} ta o'quvchi</p>
            </div>
          </div>
        </Card>

        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
          Faol topshiriqlar
        </p>
        {myAssignments.length === 0 ? (
          <Card className="p-5 mb-4">
            <p className="text-sm text-muted text-center py-2">
              Hozircha guruhingizga topshiriq berilmagan.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {myAssignments.map((a) => {
              const set = VOCAB_SETS.find((s) => s.id === a.setId);
              const pct = setProgressPercent(a.setId, progress);
              const met = pct >= a.minimumMastery;
              return (
                <Link key={a.id} href={set ? `/vocabulary/${set.id}` : "/vocabulary"}>
                  <Card interactive className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target size={15} className="text-brand-darker shrink-0" />
                        <span className="font-kr font-semibold truncate">{set?.title ?? a.setId}</span>
                      </div>
                      <ChevronRight size={16} className="text-muted shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} /> Muddat: {a.deadline}
                      </span>
                      <span className={`text-xs font-bold ${met ? "text-green" : "text-brand-darker"}`}>
                        {pct}% {met && "✓"}
                      </span>
                    </div>
                    <ProgressBar value={pct} max={100} />
                    <p className="text-[11px] text-muted-soft mt-2">
                      Talab qilingan: {a.minimumMastery}%{met ? " — bajarildi!" : ""}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2 px-1">
          Guruhdoshlar
        </p>
        <div className="flex flex-col gap-2">
          {classmates.length === 0 && (
            <Card className="p-4 text-center text-sm text-muted">Hozircha guruhdoshlar yo'q.</Card>
          )}
          {classmates.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold">
                  {s.fullName.charAt(0)}
                </div>
                <span className="text-sm font-semibold">{s.fullName}</span>
              </div>
              {s.masteryPercent !== undefined && (
                <span className="text-xs font-semibold text-muted-soft">{s.masteryPercent}% mastery</span>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
