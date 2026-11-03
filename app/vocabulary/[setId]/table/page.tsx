"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { parseRange, rangeLabel } from "@/lib/utils/examSets";

export default function TableViewPage() {
  return (
    <Suspense fallback={null}>
      <TableViewContent />
    </Suspense>
  );
}

function TableViewContent() {
  const params = useParams<{ setId: string }>();
  const searchParams = useSearchParams();
  const set = VOCAB_SETS.find((s) => s.id === params.setId);
  const allWords = VOCAB_WORDS.filter((w) => w.setId === params.setId).sort((a, b) => a.order - b.order);
  // A teacher's assignment opens this page with ?from=&to= to show only those words.
  const range = parseRange(searchParams.get("from"), searchParams.get("to"), allWords.length);
  const words = range ? allWords.slice(range.from - 1, range.to) : allWords;
  const firstNumber = range ? range.from : 1;
  const printHref = `/vocabulary/${params.setId}/print${range ? `?from=${range.from}&to=${range.to}` : ""}`;

  if (!set) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <p className="text-muted">To'plam topilmadi.</p>
        <Link href="/vocabulary" className="text-sm font-semibold text-brand-dark mt-2 inline-block">
          Orqaga
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/vocabulary/${set.id}`}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={16} /> Orqaga
          </Link>
          <Link
            href={printHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline"
          >
            <Printer size={15} /> Chop etish
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-kr text-2xl font-extrabold">{set.title}</h1>
          <p className="text-sm text-muted mt-0.5">
            {range && <span className="font-semibold text-brand-darker">{rangeLabel(range.from, range.to)} · </span>}
            {set.description} · {words.length} ta so'z
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse text-sm bg-surface">
            <thead>
              <tr className="border-b-2 border-border bg-black/[0.02]">
                <th className="text-left py-2.5 px-3 w-10 font-semibold text-muted text-xs uppercase tracking-wide">№</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">한국어</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">O'zbekcha</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
                  <td className="py-2.5 px-3 text-muted-soft tabular-nums">{firstNumber + i}</td>
                  <td className="font-kr py-2.5 px-3 font-semibold whitespace-nowrap">{w.koreanWord}</td>
                  <td className="py-2.5 px-3">{w.uzbekTranslation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
