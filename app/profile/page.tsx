"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Trophy, BookOpen, Target, LogOut, Trash2, Minus, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/progressStore";
import { masteredCount } from "@/lib/services/statsService";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, progress, examAttempts, dailyGoal, setDailyGoal, reset } = useStore();
  const mastered = masteredCount(progress);
  const avgExamScore =
    examAttempts.length > 0
      ? Math.round(
          examAttempts.reduce((sum, a) => sum + (a.correctCount / a.totalQuestions) * 100, 0) /
            examAttempts.length
        )
      : null;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-5 md:px-8 py-8">
        <Card className="p-6 text-center mb-6">
          <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">
            {profile.fullName.charAt(0)}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">{profile.fullName}</h1>
          <p className="text-sm text-muted">{profile.email}</p>
          <div className="inline-flex items-center gap-1.5 bg-black/[0.04] px-3 py-1 rounded-full mt-3 text-xs font-semibold">
            Daraja {profile.level} · {profile.xp} XP
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatTile icon={Flame} label="Streak" value={`${profile.streak} kun`} />
          <StatTile icon={BookOpen} label="Umumiy so'zlar" value={VOCAB_WORDS.length} />
          <StatTile icon={Trophy} label="O'zlashtirilgan" value={mastered} />
          <StatTile
            icon={Target}
            label="O'rtacha imtihon"
            value={avgExamScore !== null ? `${avgExamScore}%` : "—"}
          />
        </div>

        <Card className="p-2 mb-6">
          <ProfileRow href="/statistics" label="Batafsil statistika" />
          <ProfileRow href="/wrong-words" label="Xato so'zlar" />
          <ProfileRow href="/vocabulary" label="Lug'atlarim" />
        </Card>

        <Card className="p-5 mb-6">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Sozlamalar</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Kunlik maqsad</p>
              <p className="text-xs text-muted mt-0.5">Har kuni o'rganish uchun so'z soni</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDailyGoal(dailyGoal - 5)}
                disabled={dailyGoal <= 5}
                aria-label="Kamaytirish"
                className="h-9 w-9 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-90"
              >
                <Minus size={15} />
              </button>
              <span className="text-lg font-extrabold tabular-nums w-10 text-center">{dailyGoal}</span>
              <button
                onClick={() => setDailyGoal(dailyGoal + 5)}
                disabled={dailyGoal >= 200}
                aria-label="Oshirish"
                className="h-9 w-9 rounded-xl bg-black/[0.04] hover:bg-black/[0.07] flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-90"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </Card>

        <Button
          variant="secondary"
          className="w-full mb-2"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
        >
          <LogOut size={16} /> Chiqish
        </Button>

        <Button
          variant="secondary"
          className="w-full text-red"
          onClick={() => {
            if (confirm("Barcha progress tozalansinmi? Bu qaytarib bo'lmaydi.")) reset();
          }}
        >
          <Trash2 size={16} /> Progressni tozalash (demo)
        </Button>
      </div>
    </AppShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
        <Icon size={18} className="text-brand-dark" />
      </div>
      <div>
        <p className="font-bold">{value}</p>
        <p className="text-[11px] text-muted">{label}</p>
      </div>
    </Card>
  );
}

function ProfileRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-black/[0.03] transition-colors text-sm font-medium"
    >
      {label}
      <span className="text-muted">›</span>
    </Link>
  );
}
