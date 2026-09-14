"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, History, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_WORDS } from "@/lib/data/seed";

export default function VocabularyPage() {
  const { progress } = useStore();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? VOCAB_WORDS.filter(
        (w) =>
          w.koreanWord.toLowerCase().includes(q) ||
          w.uzbekTranslation.toLowerCase().includes(q) ||
          (w.pronunciation && w.pronunciation.toLowerCase().includes(q))
      )
    : [];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Lug'atlar</h1>
        <p className="text-sm text-muted mb-6">Kategoriyani tanlang va o'rganishni boshlang.</p>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="So'z qidirish..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-surface text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>

        {q ? (
          <div className="flex flex-col gap-2">
            {searchResults.length === 0 && (
              <p className="text-sm text-muted py-6 text-center">Hech narsa topilmadi.</p>
            )}
            {searchResults.map((w) => {
              const p = progress[w.id];
              return (
                <Card key={w.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-kr font-semibold">{w.koreanWord}</p>
                    <p className="text-xs text-muted">{w.uzbekTranslation}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted">
                    {p ? `Mastery ${p.masteryLevel}/4` : "Yangi"}
                  </span>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/vocabulary/past-exams">
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

            <Link href="/vocabulary/seoul-hangugo">
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
        )}
      </div>
    </AppShell>
  );
}
