"use client";

import Link from "next/link";
import { ChevronRight, History, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS } from "@/lib/data/seed";

export default function ExamHomePage() {
  const { examAttempts } = useStore();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Vocabulary imtihoni</h1>
        <p className="text-sm text-muted mb-6">Kategoriyani tanlang va imtihonni boshlang.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/exam/past-exams">
            <Card interactive className="p-5 h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                  <History size={20} className="text-brand-darker" />
                </div>
                <div>
                  <p className="font-bold">O'tgan TOPIK imtihonidagi lug'atlar</p>
                  <p className="text-xs text-muted mt-0.5">O'qish va tinglash to'plamlari</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </Card>
          </Link>

          <Link href="/exam/seoul-hangugo">
            <Card interactive className="p-5 h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                  <GraduationCap size={20} className="text-brand-darker" />
                </div>
                <div>
                  <p className="font-bold">서울대 한국어 lug'atlari</p>
                  <p className="text-xs text-muted mt-0.5">1A—3B darslik to'plamlari</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </Card>
          </Link>
        </div>

        {examAttempts.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3 text-muted">
              <History size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">Oldingi natijalar</p>
            </div>
            <div className="flex flex-col gap-2">
              {examAttempts.slice(0, 5).map((a) => (
                <Link key={a.id} href={`/result/${a.id}`}>
                  <Card className="p-4 flex items-center justify-between hover:border-foreground/15 transition-colors">
                    <span className="font-kr text-sm font-semibold">
                      {VOCAB_SETS.find((s) => s.id === a.setId)?.title ?? a.setId}
                    </span>
                    <span className="text-sm font-bold text-brand-dark">
                      {a.correctCount}/{a.totalQuestions}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
