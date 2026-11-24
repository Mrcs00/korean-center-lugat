"use client";

import { Avatar, Badge, ErrorNote, Spinner, useLoad } from "@/components/platform/ui";
import { loadVocabResults } from "@/lib/platform/vocabResults";
import type { RealAssignment } from "@/lib/services/assignmentService";

function dateOf(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" });
}

// Who solved a vocabulary assignment and how well (read from the students' own work).
export function VocabResultsTable({ a }: { a: RealAssignment }) {
  const res = useLoad(() => loadVocabResults(a), [a.id]);
  const isBookExam = a.kind === "book_exam";

  if (res.loading) return <Spinner />;
  if (res.error) return <ErrorNote message={res.error} onRetry={res.reload} />;
  const data = res.data;
  if (!data || data.rows.length === 0) return <p className="text-sm text-muted py-2">Guruhda o&apos;quvchi yo&apos;q.</p>;

  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="text-xs text-muted mb-2">
        Bajargan: <b className="text-foreground">{data.doneCount}/{data.rows.length}</b> · Boshlagan:{" "}
        <b className="text-foreground">{data.startedCount}/{data.rows.length}</b> · O&apos;rtacha: <b className="text-foreground">{data.averagePct}%</b>
      </p>
      <div className="flex flex-col">
        {data.rows.map((r) => (
          <div key={r.studentId} className="flex flex-wrap items-center gap-3 py-2.5 border-b border-border last:border-0">
            <div className="flex items-center gap-3 flex-1 basis-40 min-w-0">
              <Avatar name={r.name} size={32} />
              <p className="font-semibold text-sm truncate">{r.name}</p>
            </div>
            <span className="text-xs text-muted w-28">
              {isBookExam ? `Urinish: ${r.attempts}` : `Imtihon: ${r.attempts}${r.bestExamPct !== null ? ` · ${r.bestExamPct}%` : ""}`}
            </span>
            <span className="text-xs text-muted w-20">{dateOf(r.lastAt)}</span>
            <span className="font-bold text-sm w-12 text-right">{r.pct}%</span>
            {r.status === "done" ? (
              <span className="text-xs font-bold text-green w-24 text-right">Bajargan ✓</span>
            ) : r.status === "progress" ? (
              <span className="w-24 text-right"><Badge tone="brand">Jarayonda</Badge></span>
            ) : (
              <span className="w-24 text-right"><Badge tone="gray">Boshlamagan</Badge></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
