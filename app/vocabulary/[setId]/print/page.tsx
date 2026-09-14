"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { Button } from "@/components/ui/Button";

export default function PrintSetPage() {
  const params = useParams<{ setId: string }>();
  const set = VOCAB_SETS.find((s) => s.id === params.setId);
  const words = VOCAB_WORDS.filter((w) => w.setId === params.setId).sort((a, b) => a.order - b.order);

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
      {/* Screen-only toolbar, hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-surface border-b border-border px-5 py-3 flex items-center justify-between">
        <Link
          href={`/vocabulary/${set.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> Orqaga
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={15} /> Chop etish
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 print:py-0">
        <div className="mb-6">
          <h1 className="font-kr text-2xl font-extrabold">{set.title}</h1>
          <p className="text-sm text-muted mt-0.5">
            {set.description} · {words.length} ta so'z
          </p>
          <p className="text-xs text-muted-soft mt-1">
            Har bir so'zni bo'sh chiziqlarga qo'lda ko'chirib yozing.
          </p>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground/20">
              <th className="text-left py-2 pr-2 w-8 font-semibold">№</th>
              <th className="text-left py-2 pr-3 font-semibold">한국어</th>
              <th className="text-left py-2 pr-3 font-semibold">O'zbekcha</th>
              <th className="text-left py-2 font-semibold">Yozib mashq qiling</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id} className="border-b border-border align-top break-inside-avoid">
                <td className="py-2.5 pr-2 text-muted tabular-nums">{w.order}</td>
                <td className="font-kr py-2.5 pr-3 font-semibold whitespace-nowrap">{w.koreanWord}</td>
                <td className="py-2.5 pr-3 text-muted whitespace-nowrap">{w.uzbekTranslation}</td>
                <td className="py-2.5">
                  <div className="h-6 border-b border-muted-soft/60" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
