"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/progressStore";
import { VOCAB_WORDS } from "@/lib/data/seed";
import { wrongWordIds } from "@/lib/services/statsService";

export default function WrongWordsPage() {
  const { progress } = useStore();
  const ids = wrongWordIds(progress);
  const words = ids.map((id) => VOCAB_WORDS.find((w) => w.id === id)).filter(Boolean);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Xato so'zlar</h1>
        <p className="text-sm text-muted mb-6">
          {words.length > 0
            ? `Siz ${words.length} ta so'zda xato qildingiz. Ularni qayta yodlang.`
            : "Hozircha xato qilingan so'zlar yo'q."}
        </p>

        {words.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm text-muted">Ajoyib! Hozircha xatolaringiz yo'q.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {words.map((w) => {
              const p = progress[w!.id];
              return (
                <Card key={w!.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-kr font-semibold">{w!.koreanWord}</p>
                    <p className="text-xs text-muted">{w!.uzbekTranslation}</p>
                  </div>
                  <span className="text-xs font-semibold text-red bg-red/10 px-2.5 py-1 rounded-full">
                    {p?.wrongCount ?? 0} marta xato
                  </span>
                </Card>
              );
            })}
            <Link href="/review" className="mt-2">
              <Button size="lg" className="w-full">
                Qayta yodlash
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
