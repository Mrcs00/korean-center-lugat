"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Field, Input, Modal, Textarea } from "@/components/platform/ui";
import { FileList } from "@/components/platform/FileUploader";
import { useToast } from "@/components/platform/Toast";
import { reviewSubmission } from "@/lib/platform/api";
import { SUBMISSION } from "@/lib/platform/labels";
import { formatDateTime } from "@/lib/platform/format";
import type { Homework, Submission } from "@/lib/platform/types";

export function ReviewDialog({
  open,
  homework,
  submission,
  studentName,
  onClose,
  onSaved,
}: {
  open: boolean;
  homework: Homework | null;
  submission: Submission | null;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !submission) return;
    setScore(submission.score === null ? "" : String(submission.score));
    setFeedback(submission.feedback ?? "");
    setMistakes(submission.mistakes ?? "");
  }, [open, submission]);

  if (!homework || !submission) return null;

  const act = async (status: "graded" | "needs_revision" | "reviewing") => {
    const value = score.trim() === "" ? null : Number(score);
    if (status === "graded" && (value === null || Number.isNaN(value) || value < 0 || value > homework.points)) {
      toast.error(`Ball 0 dan ${homework.points} gacha bo'lsin.`);
      return;
    }
    if (status === "needs_revision" && !feedback.trim()) {
      toast.error("Qayta ishlash uchun izoh yozing.");
      return;
    }
    setBusy(true);
    try {
      await reviewSubmission(submission.id, { status, score: status === "graded" ? value : null, feedback: feedback.trim() || null, mistakes: mistakes.trim() || null });
      toast.success(status === "graded" ? "Baholandi." : status === "needs_revision" ? "Qayta ishlashga qaytarildi." : "Tekshirilmoqda deb belgilandi.");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`${studentName} · ${homework.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={() => act("reviewing")} disabled={busy}>Tekshirilmoqda</Button>
          <Button variant="secondary" onClick={() => act("needs_revision")} disabled={busy}>Qayta ishlash</Button>
          <Button onClick={() => act("graded")} disabled={busy}>Baholash</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge tone={SUBMISSION[submission.status].tone}>{SUBMISSION[submission.status].label}</Badge>
          <span>Urinish: {submission.attempt}</span>
          {submission.submitted_at && <span>Topshirilgan: {formatDateTime(submission.submitted_at)}</span>}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted mb-1.5">O&apos;quvchi javobi</p>
          <div className="rounded-xl bg-background border border-border px-4 py-3 text-sm whitespace-pre-line min-h-[3.5rem]">
            {submission.answer?.trim() || <span className="text-muted-soft">Matn yozilmagan.</span>}
          </div>
        </div>

        {submission.attachments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted mb-1.5">Fayllar</p>
            <FileList files={submission.attachments} />
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={`Ball (0–${homework.points})`}>
            <Input inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} />
          </Field>
          <Field label="Izoh" className="sm:col-span-2">
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} className="min-h-[44px]" placeholder="O'quvchiga izoh..." />
          </Field>
        </div>
        <Field label="Xatolar (ixtiyoriy)">
          <Textarea value={mistakes} onChange={(e) => setMistakes(e.target.value)} rows={2} className="min-h-[44px]" placeholder="Qaysi joylarda xato qilgan..." />
        </Field>
      </div>
    </Modal>
  );
}
