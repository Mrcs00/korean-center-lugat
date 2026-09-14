"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VOCAB_SETS, VOCAB_WORDS } from "@/lib/data/seed";
import { useStore } from "@/lib/store/progressStore";

export default function TableViewPage() {
  const params = useParams<{ setId: string }>();
  const { progress } = useStore();
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
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-3">
        <Link
          href={`/vocabulary/${set.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> Orqaga
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-kr text-2xl font-extrabold">{set.title}</h1>
          <p className="text-sm text-muted mt-0.5">
            {set.description} · {words.length} ta so'z
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse text-sm bg-surface">
            <thead>
              <tr className="border-b-2 border-border bg-black/[0.02]">
                <th className="text-left py-2.5 px-3 w-10 font-semibold text-muted text-xs uppercase tracking-wide">№</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">한국어</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">Talaffuz</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">O'zbekcha</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted text-xs uppercase tracking-wide">Holat</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => {
                const p = progress[w.id];
                return (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
                    <td className="py-2.5 px-3 text-muted-soft tabular-nums">{w.order}</td>
                    <td className="font-kr py-2.5 px-3 font-semibold whitespace-nowrap">{w.koreanWord}</td>
                    <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                      {w.pronunciation ? `[${w.pronunciation}]` : "—"}
                    </td>
                    <td className="py-2.5 px-3">{w.uzbekTranslation}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          !p
                            ? "bg-black/[0.05] text-muted"
                            : p.masteryLevel >= 3
                            ? "bg-green-soft text-green"
                            : "bg-amber-soft text-amber"
                        }`}
                      >
                        {!p ? "Yangi" : p.masteryLevel >= 3 ? "O'zlashtirilgan" : "O'rganilmoqda"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
