"use client";

import Link from "next/link";
import { ArrowLeft, Target, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";

export default function ExamListeningListPage() {
  const sets = VOCAB_SETS.filter((s) => s.id.endsWith("-listening")).sort(
    (a, b) => a.setNumber - b.setNumber
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link
          href="/exam/past-exams"
          className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground"
        >
          <ArrowLeft size={16} /> O'tgan TOPIK imtihonidagi lug'atlar
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">듣기 — Tinglash</h1>
        <p className="text-sm text-muted mb-6">Imtihon topshirmoqchi bo'lgan to'plamni tanlang.</p>

        <div className="flex flex-col gap-3">
          {sets.length === 0 && <p className="text-sm text-muted py-6 text-center">Hali to'plam yo'q.</p>}
          {sets.map((set) => {
            const count = VOCAB_WORDS.filter((w) => w.setId === set.id).length;
            return (
              <Link key={set.id} href={`/exam/${set.id}`}>
                <Card interactive className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                      <Target size={20} className="text-brand-darker" />
                    </div>
                    <div>
                      <p className="font-kr font-bold">{set.title}</p>
                      <p className="text-xs text-muted">{count} ta savol · Timer bilan</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
