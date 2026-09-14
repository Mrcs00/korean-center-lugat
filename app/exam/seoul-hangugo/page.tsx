"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, BookMarked } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { SEOUL_BOOKS, seoulSetId } from "@/lib/data/seoulHangugoMeta";

export default function ExamSeoulHangugoPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link href="/exam" className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground">
          <ArrowLeft size={16} /> Imtihon
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">서울대 한국어</h1>
        <p className="text-sm text-muted mb-6">Kitobni tanlang.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {SEOUL_BOOKS.map((book) => {
            const unitSetIds = Array.from({ length: book.unitCount }, (_, i) => seoulSetId(book.id, i + 1));
            const wordCount = VOCAB_WORDS.filter((w) => unitSetIds.includes(w.setId)).length;

            return (
              <Link key={book.id} href={`/exam/seoul-hangugo/${book.id}`}>
                <Card interactive className="p-5 h-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0">
                      <BookMarked size={20} className="text-brand-darker" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{book.label}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {book.unitCount} ta 과 · {wordCount} so'z
                      </p>
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
