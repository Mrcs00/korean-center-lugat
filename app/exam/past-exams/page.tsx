"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, BookOpenText, Headphones } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";

function countWords(setIds: string[]) {
  return VOCAB_WORDS.filter((w) => setIds.includes(w.setId)).length;
}

export default function ExamPastExamsPage() {
  const readingSets = VOCAB_SETS.filter((s) => s.id.endsWith("-reading"));
  const listeningSets = VOCAB_SETS.filter((s) => s.id.endsWith("-listening"));

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link href="/exam" className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground">
          <ArrowLeft size={16} /> Imtihon
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">O'tgan TOPIK imtihonidagi lug'atlar</h1>
        <p className="text-sm text-muted mb-6">Avval bo'limni tanlang.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/exam/past-exams/reading">
            <Card interactive className="p-6 h-full">
              <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center mb-4">
                <BookOpenText size={20} className="text-brand-darker" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">읽기 — O'qish</p>
                  <p className="text-xs text-muted mt-0.5">
                    {readingSets.length} ta to'plam · {countWords(readingSets.map((s) => s.id))} so'z
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted shrink-0" />
              </div>
            </Card>
          </Link>

          <Link href="/exam/past-exams/listening">
            <Card interactive className="p-6 h-full">
              <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center mb-4">
                <Headphones size={20} className="text-brand-darker" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">듣기 — Tinglash</p>
                  <p className="text-xs text-muted mt-0.5">
                    {listeningSets.length} ta to'plam · {countWords(listeningSets.map((s) => s.id))} so'z
                  </p>
                </div>
                <ChevronRight size={18} className="text-muted shrink-0" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
