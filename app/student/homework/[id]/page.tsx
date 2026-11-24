"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Save, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, EmptyState, ErrorNote, Field, Page, PageHeader, Panel, Spinner, Textarea, useLoad } from "@/components/platform/ui";
import { FileList, FileUploader } from "@/components/platform/FileUploader";
import { useToast } from "@/components/platform/Toast";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getHomework, q, saveSubmission } from "@/lib/platform/api";
import { supabase } from "@/lib/supabase/client";
import { studentHomeworkStatus } from "@/lib/platform/homework";
import { HOMEWORK_TYPES, SUBMISSION } from "@/lib/platform/labels";
import { deadlineHint, formatDateTime } from "@/lib/platform/format";
import type { FileRef, Submission } from "@/lib/platform/types";

export default function StudentHomeworkDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const uid = user?.id ?? "";

  const hw = useLoad(() => getHomework(id), [id]);
  const sub = useLoad(
    () => (uid ? q<Submission | null>(supabase.from("homework_submissions").select("*").eq("homework_id", id).eq("student_id", uid).maybeSingle()) : Promise.resolve(null)),
    [id, uid]
  );

  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<FileRef[]>([]);
  const [busy, setBusy] = useState(false);

  // fill the form from the saved submission once it is loaded
  useEffect(() => {
    if (sub.data) {
      setAnswer(sub.data.answer ?? "");
      setFiles(sub.data.attachments ?? []);
    }
  }, [sub.data]);

  if (hw.loading || sub.loading) return <AppShell><Page><Spinner /></Page></AppShell>;
  const h = hw.data;
  if (!h) {
    return (
      <AppShell>
        <Page>
          {hw.error && <ErrorNote message={hw.error} />}
          <EmptyState title="Vazifa topilmadi" action={<Link href="/student/homework" className="text-sm font-semibold text-brand-darker">← Vazifalarga qaytish</Link>} />
        </Page>
      </AppShell>
    );
  }

  const s = sub.data;
  const status = studentHomeworkStatus(h, s);
  const locked = s?.status === "reviewing" || s?.status === "graded";
  const canSubmit = !locked;

  const save = async (final: boolean) => {
    if (final && !answer.trim() && files.length === 0) {
      toast.error("Javob yozing yoki fayl biriktiring.");
      return;
    }
    setBusy(true);
    try {
      await saveSubmission(h.id, uid, { answer, attachments: files, status: final ? "submitted" : "draft" });
      toast.success(final ? "Vazifa topshirildi." : "Qoralama saqlandi.");
      sub.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <Page>
        <PageHeader
          back={<Link href="/student/homework" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Vazifalar</Link>}
          title={h.title}
          subtitle={`${HOMEWORK_TYPES[h.type]} · ${h.points} ball`}
          actions={<Badge tone={SUBMISSION[status].tone}>{SUBMISSION[status].label}</Badge>}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Panel title="Topshiriq">
              <p className="text-sm whitespace-pre-line">{h.description || "Tavsif kiritilmagan."}</p>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-4">
                <Clock size={13} /> Muddat: {h.due_at ? `${formatDateTime(h.due_at)} (${deadlineHint(h.due_at)})` : "Muddatsiz"}
              </p>
              {h.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted mb-2">Ustoz biriktirgan fayllar</p>
                  <FileList files={h.attachments} />
                </div>
              )}
            </Panel>

            <Panel title="Mening javobim">
              {s?.status === "needs_revision" && (
                <div className="mb-4 rounded-xl bg-red-soft text-red text-sm px-4 py-3">
                  Ustoz vazifani qayta ishlashni so&apos;radi. Izohni o&apos;qib, javobni to&apos;g&apos;rilang va qayta topshiring.
                </div>
              )}
              <div className="flex flex-col gap-4">
                <Field label="Javob matni">
                  <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!canSubmit} rows={7} placeholder="Javobingizni shu yerga yozing..." />
                </Field>
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">Fayl yoki rasm</p>
                  <FileUploader value={files} onChange={setFiles} prefix={`sub/${h.id}/${uid}`} disabled={!canSubmit} />
                </div>
                {canSubmit ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => save(true)} disabled={busy}>
                      <Send size={16} /> {s?.status === "needs_revision" ? "Qayta topshirish" : s?.status === "submitted" ? "Yangilab topshirish" : "Topshirish"}
                    </Button>
                    {(!s || s.status === "draft") && (
                      <Button variant="secondary" onClick={() => save(false)} disabled={busy}>
                        <Save size={16} /> Qoralama saqlash
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Ustoz tekshirayotgani uchun javobni o&apos;zgartirib bo&apos;lmaydi.</p>
                )}
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            <Panel title="Natija">
              {s?.status === "graded" ? (
                <div>
                  <p className="text-4xl font-extrabold">
                    {s.score ?? "—"}
                    <span className="text-base text-muted font-semibold"> / {h.points}</span>
                  </p>
                  {s.feedback && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted mb-1">Ustoz izohi</p>
                      <p className="text-sm whitespace-pre-line">{s.feedback}</p>
                    </div>
                  )}
                  {s.mistakes && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted mb-1">Xatolar</p>
                      <p className="text-sm whitespace-pre-line text-red">{s.mistakes}</p>
                    </div>
                  )}
                </div>
              ) : s?.status === "needs_revision" ? (
                <div className="text-sm">
                  <p className="font-bold text-red mb-2">Qayta ishlash kerak</p>
                  <p className="whitespace-pre-line">{s.feedback || "Izoh qoldirilmagan."}</p>
                  {s.mistakes && <p className="whitespace-pre-line text-red mt-3">{s.mistakes}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted">Hali baholanmagan.</p>
              )}
              {s && (
                <p className="text-[11px] text-muted-soft mt-4">
                  Urinish: {s.attempt}
                  {s.submitted_at ? ` · Topshirilgan: ${formatDateTime(s.submitted_at)}` : ""}
                </p>
              )}
            </Panel>
          </div>
        </div>
      </Page>
    </AppShell>
  );
}
