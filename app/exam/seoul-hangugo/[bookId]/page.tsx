"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Target, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { SEOUL_BOOKS, seoulSetId } from "@/lib/data/seoulHangugoMeta";

export default function ExamSeoulHangugoBookPage() {
  const params = useParams<{ bookId: string }>();
  const book = SEOUL_BOOKS.find((b) => b.id === params.bookId);

  if (!book) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto px-5 py-16 text-center">
          <p className="text-muted">Kitob topilmadi.</p>
          <Link href="/exam/seoul-hangugo" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
            Orqaga
          </Link>
        </div>
      </AppShell>
    );
  }

  const units = Array.from({ length: book.unitCount }, (_, i) => i + 1);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <Link
          href="/exam/seoul-hangugo"
          className="inline-flex items-center gap-1 text-sm text-muted mb-4 hover:text-foreground"
        >
          <ArrowLeft size={16} /> 서울대 한국어
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{book.label}</h1>
        <p className="text-sm text-muted mb-6">Imtihon topshirmoqchi bo'lgan 과ni tanlang.</p>

        <div className="flex flex-col gap-2">
          {units.map((unit) => {
            const setId = seoulSetId(book.id, unit);
            const wordCount = VOCAB_WORDS.filter((w) => w.setId === setId).length;
            const hasContent = wordCount > 0;

            const content = (
              <Card
                interactive={hasContent}
                className={`p-4 flex items-center justify-between ${!hasContent ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-brand-soft flex items-center justify-center shrink-0 text-sm font-bold text-brand-darker">
                    {unit}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {book.label} — {unit}과
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {hasContent ? `${wordCount} ta savol · Timer bilan` : "Hali so'z qo'shilmagan"}
                    </p>
                  </div>
                </div>
                {hasContent ? (
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-brand-darker" />
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                ) : (
                  <Lock size={15} className="text-muted-soft" />
                )}
              </Card>
            );

            return hasContent ? (
              <Link key={unit} href={`/exam/${setId}`}>
                {content}
              </Link>
            ) : (
              <div key={unit}>{content}</div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
