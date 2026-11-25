"use client";

import { Badge, ErrorNote, Panel, Spinner, useLoad } from "@/components/platform/ui";
import { loadStudentVocab } from "@/lib/platform/vocabResults";
import type { GroupFull } from "@/lib/platform/api";
import { examSetTitle, rangeLabel } from "@/lib/utils/examSets";
import { formatDate } from "@/lib/platform/format";

// One student's results on the vocabulary assignments sent to their groups.
export function StudentVocabList({ studentId, groups }: { studentId: string; groups: GroupFull[] }) {
  const key = groups.map((g) => g.id).join(",");
  const res = useLoad(() => loadStudentVocab(studentId, groups.map((g) => g.id)), [studentId, key]);

  return (
    <Panel title="Lug'at topshiriqlari">
      {res.loading && <Spinner />}
      {res.error && <ErrorNote message={res.error} onRetry={res.reload} />}
      {res.data && res.data.length === 0 && <p className="text-sm text-muted">Guruhga lug&apos;at topshirig&apos;i yuborilmagan.</p>}
      {(res.data ?? []).map(({ a, result }) => {
        const isBookExam = a.kind === "book_exam";
        const detail = isBookExam ? `${a.questionCount ?? 50} ta savol` : a.wordFrom && a.wordTo ? rangeLabel(a.wordFrom, a.wordTo) : "Butun to'plam";
        const status = result?.status ?? "none";
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-3 py-3 border-b border-border last:border-0">
            <div className="min-w-0 flex-1 basis-48">
              <p className="font-kr font-semibold text-sm truncate">{examSetTitle(a.setId)}</p>
              <p className="text-xs text-muted">{groups.find((g) => g.id === a.groupId)?.name ?? a.groupName} · {detail} · Muddat: {a.deadline ? formatDate(a.deadline) : "yo'q"}</p>
            </div>
            <span className="text-xs text-muted">Imtihon: {result?.attempts ?? 0}</span>
            <span className="font-bold text-sm w-12 text-right">{result?.pct ?? 0}%</span>
            {status === "done" ? (
              <span className="text-xs font-bold text-green w-24 text-right">Bajargan ✓</span>
            ) : status === "progress" ? (
              <span className="w-24 text-right"><Badge tone="brand">Jarayonda</Badge></span>
            ) : (
              <span className="w-24 text-right"><Badge tone="gray">Boshlamagan</Badge></span>
            )}
          </div>
        );
      })}
    </Panel>
  );
}
