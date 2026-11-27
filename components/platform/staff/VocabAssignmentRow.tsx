"use client";

import { useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronUp, Clock, Target } from "lucide-react";
import { Badge } from "@/components/platform/ui";
import { VocabResultsTable } from "./VocabResultsTable";
import type { RealAssignment } from "@/lib/services/assignmentService";
import { examSetTitle, rangeLabel } from "@/lib/utils/examSets";
import { formatDate } from "@/lib/platform/format";

// A vocabulary assignment as the teacher sees it: no grading, the student's
// score is automatic. "Natijalar" shows who solved it and how well.
export function VocabAssignmentRow({ a, groupName }: { a: RealAssignment; groupName: string }) {
  const [open, setOpen] = useState(false);
  const isBookExam = a.kind === "book_exam";
  const detail = isBookExam ? `${a.questionCount ?? 50} ta tasodifiy savol` : a.wordFrom && a.wordTo ? rangeLabel(a.wordFrom, a.wordTo) : "Butun to'plam";

  return (
    <div className="rounded-2xl bg-surface border border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
          {isBookExam ? <BookOpenCheck size={18} className="text-brand-darker" /> : <Target size={18} className="text-brand-darker" />}
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-kr font-bold text-sm truncate">{examSetTitle(a.setId)}</p>
          <p className="text-xs text-muted flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span>{groupName}</span>
            <span>{detail}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {a.deadline ? formatDate(a.deadline) : "Muddatsiz"}</span>
            <span>O&apos;tish bali: {a.minimumMastery}%</span>
          </p>
        </div>
        <Badge tone="gray">Avtomatik ball</Badge>
        <button
          onClick={() => setOpen(!open)}
          className="h-8 px-3 rounded-lg border border-border hover:border-border-strong text-xs font-semibold flex items-center gap-1"
        >
          Natijalar {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && <VocabResultsTable a={a} />}
    </div>
  );
}
