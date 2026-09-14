"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { setProgressPercent } from "@/lib/services/statsService";

export default function ListeningSetsPage() {
  const { progress } = useStore();
  const sets = VOCAB_SETS.filter((s) => s.id.endsWith("-listening")).sort(
    (a, b) => a.setNumber - b.setNumber
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
        <Link
          href="/vocabulary/past-exams"
          className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground"
        >
          <ArrowLeft size={16} /> O'tgan TOPIK imtihonidagi lug'atlar
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">듣기 — Tinglash</h1>
        <p className="text-sm text-muted mb-6">To'plamni tanlang.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {sets.length === 0 && (
            <p className="text-sm text-muted py-6 text-center col-span-2">
              Hali tinglash to'plami qo'shilmagan.
            </p>
          )}
          {sets.map((set) => {
            const wordCount = VOCAB_WORDS.filter((w) => w.setId === set.id).length;
            const pct = setProgressPercent(set.id, progress);
            const masteredCount = Math.round((pct / 100) * wordCount);
            return (
              <Link key={set.id} href={`/vocabulary/${set.id}`}>
                <Card interactive className="p-5 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-kr font-bold text-lg">{set.title}</p>
                      <p className="text-xs text-muted mt-0.5">{set.description}</p>
                    </div>
                    <ChevronRight size={18} className="text-muted shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <ProgressBar value={pct} className="flex-1" />
                    <span className="text-xs font-semibold text-muted w-9 text-right">{pct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{wordCount} ta so'z</span>
                    <span>{masteredCount} o'zlashtirilgan</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
