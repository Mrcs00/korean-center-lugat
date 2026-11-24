"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { Avatar, Badge, EmptyState, ErrorNote, FilterChips, Page, PageHeader, Panel, Spinner, useLoad } from "@/components/platform/ui";
import { DataTable } from "@/components/platform/DataTable";
import { useToast } from "@/components/platform/Toast";
import { HomeworkFormModal } from "./HomeworkFormModal";
import { ReviewDialog } from "./ReviewDialog";
import { allMemberships, deleteHomework, getHomework, listHomework, listMembers, listProfiles, listSubmissions, type GroupFull } from "@/lib/platform/api";
import { baseOf, type StaffRole } from "@/lib/platform/staff";
import { HOMEWORK_TYPES, SUBMISSION } from "@/lib/platform/labels";
import { deadlineHint, formatDateTime } from "@/lib/platform/format";
import { buildGradingQueue, emptySubmission } from "@/lib/platform/homework";
import type { Homework, Profile, Submission } from "@/lib/platform/types";

// ── list of homework (teacher: own groups, admin: all) ──────────────────────
export function HomeworkListView({ role, groups }: { role: StaffRole; groups: GroupFull[] }) {
  const router = useRouter();
  const toast = useToast();
  const ids = groups.map((g) => g.id);
  const key = ids.join(",");
  const hw = useLoad(() => listHomework(ids), [key]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const memberships = useLoad(() => allMemberships(), []);
  const [form, setForm] = useState<{ open: boolean; existing: Homework | null }>({ open: false, existing: null });
  const [toDelete, setToDelete] = useState<Homework | null>(null);
  const [groupFilter, setGroupFilter] = useState("all");

  const rows = (hw.data ?? []).filter((h) => groupFilter === "all" || h.group_id === groupFilter);
  const base = baseOf(role);

  const membersOf = (h: Homework) => (h.student_ids ? h.student_ids.length : (memberships.data ?? []).filter((m) => m.group_id === h.group_id).length);
  const subsOf = (h: Homework) => (subs.data ?? []).filter((s) => s.homework_id === h.id && s.status !== "draft");

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteHomework(toDelete.id);
      toast.success("Vazifa o'chirildi.");
      setToDelete(null);
      hw.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Page wide>
      <PageHeader
        title="Uy vazifalari"
        subtitle="Vazifa bering, topshiriqlarni tekshiring va baholang"
        actions={
          <>
            <Link href={`${base}/exams`} className="h-10 px-4 rounded-xl border border-border text-sm font-semibold flex items-center hover:border-border-strong">Lug&apos;at topshiriqlari</Link>
            <Button onClick={() => setForm({ open: true, existing: null })} disabled={groups.length === 0}>
              <Plus size={16} /> Yangi vazifa
            </Button>
          </>
        }
      />
      {hw.error && <ErrorNote message={hw.error} onRetry={hw.reload} />}
      {groups.length > 1 && (
        <div className="mb-4">
          <FilterChips value={groupFilter} onChange={setGroupFilter} options={[{ id: "all", label: "Hammasi" }, ...groups.map((g) => ({ id: g.id, label: g.name }))]} />
        </div>
      )}
      {hw.loading ? (
        <Spinner />
      ) : (
        <DataTable<Homework>
          rows={rows}
          rowKey={(h) => h.id}
          searchText={(h) => `${h.title} ${groups.find((g) => g.id === h.group_id)?.name ?? ""}`}
          searchPlaceholder="Vazifa yoki guruh bo'yicha qidirish..."
          onRowClick={(h) => router.push(`${base}/homework/${h.id}`)}
          empty={<EmptyState icon={ClipboardList} title="Hali vazifa berilmagan" text="“Yangi vazifa” tugmasi bilan birinchi vazifani bering." />}
          columns={[
            {
              key: "title",
              header: "Vazifa",
              sortValue: (h) => h.title,
              render: (h) => (
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-xs text-muted">{HOMEWORK_TYPES[h.type]} · {h.points} ball</p>
                </div>
              ),
            },
            { key: "group", header: "Guruh", render: (h) => groups.find((g) => g.id === h.group_id)?.name ?? "—" },
            { key: "due", header: "Muddat", sortValue: (h) => h.due_at ?? "9", render: (h) => (h.due_at ? <span>{formatDateTime(h.due_at)}<span className="block text-xs text-muted">{deadlineHint(h.due_at)}</span></span> : "Muddatsiz") },
            { key: "done", header: "Topshirgan", render: (h) => `${subsOf(h).length} / ${membersOf(h)}` },
            { key: "graded", header: "Baholangan", render: (h) => subsOf(h).filter((s) => s.status === "graded").length },
            {
              key: "actions",
              header: "",
              render: (h) => (
                <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  <button aria-label="Tahrirlash" onClick={() => setForm({ open: true, existing: h })} className="h-8 w-8 rounded-lg hover:bg-black/[0.05] flex items-center justify-center text-muted"><Pencil size={15} /></button>
                  <button aria-label="O'chirish" onClick={() => setToDelete(h)} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
        />
      )}

      <HomeworkFormModal open={form.open} groups={groups} existing={form.existing} onClose={() => setForm({ open: false, existing: null })} onSaved={() => { hw.reload(); subs.reload(); }} />
      <ConfirmDialog open={Boolean(toDelete)} title="Vazifani o'chirish" confirmLabel="O'chirish" onConfirm={remove} onCancel={() => setToDelete(null)}>
        <p>“{toDelete?.title}” vazifasi va o&apos;quvchilarning barcha topshiriqlari o&apos;chadi. Qaytarib bo&apos;lmaydi.</p>
      </ConfirmDialog>
    </Page>
  );
}

// ── one homework: who handed in, review ─────────────────────────────────────
export function HomeworkReviewView({ role, id }: { role: StaffRole; id: string }) {
  const base = baseOf(role);
  const hw = useLoad(() => getHomework(id), [id]);
  const h = hw.data;
  const members = useLoad(() => (h ? listMembers(h.group_id) : Promise.resolve([])), [h?.group_id]);
  const subs = useLoad(() => listSubmissions([id]), [id]);
  const [review, setReview] = useState<{ sub: Submission; name: string } | null>(null);

  if (hw.loading) return <Page><Spinner /></Page>;
  if (!h) return <Page><EmptyState title="Vazifa topilmadi" action={<Link href={`${base}/homework`} className="text-sm font-semibold text-brand-darker">← Vazifalarga qaytish</Link>} /></Page>;

  const targets = (members.data ?? []).filter((m) => !h.student_ids || h.student_ids.includes(m.student_id));
  const rows = targets.map((m) => ({ m, sub: (subs.data ?? []).find((s) => s.student_id === m.student_id) ?? null }));
  const handed = rows.filter((r) => r.sub && r.sub.status !== "draft").length;
  const graded = rows.filter((r) => r.sub?.status === "graded");
  const avg = graded.length ? Math.round(graded.reduce((s, r) => s + (r.sub?.score ?? 0), 0) / graded.length) : null;

  return (
    <Page wide>
      <PageHeader
        back={<Link href={`${base}/homework`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Vazifalar</Link>}
        title={h.title}
        subtitle={`${HOMEWORK_TYPES[h.type]} · ${h.points} ball · Muddat: ${h.due_at ? formatDateTime(h.due_at) : "yo'q"}`}
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Panel><p className="text-2xl font-extrabold">{handed}/{rows.length}</p><p className="text-xs text-muted">topshirgan</p></Panel>
        <Panel><p className="text-2xl font-extrabold">{graded.length}</p><p className="text-xs text-muted">baholangan</p></Panel>
        <Panel><p className="text-2xl font-extrabold">{avg === null ? "—" : `${avg}/${h.points}`}</p><p className="text-xs text-muted">o&apos;rtacha ball</p></Panel>
      </div>

      {h.description && <Panel title="Tavsif" className="mb-6"><p className="text-sm whitespace-pre-line">{h.description}</p></Panel>}

      <Panel title="O'quvchilar">
        {subs.error && <ErrorNote message={subs.error} />}
        <div className="flex flex-col">
          {rows.map(({ m, sub }) => {
            const status = sub && sub.status !== "draft" ? SUBMISSION[sub.status] : null;
            const isHanded = Boolean(sub && sub.status !== "draft");
            const late = sub?.submitted_at && h.due_at && new Date(sub.submitted_at) > new Date(h.due_at);
            return (
              <div key={m.student_id} className="flex flex-wrap items-center gap-3 py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3 flex-1 basis-48 min-w-0">
                  <Avatar name={m.profile?.full_name ?? "?"} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{m.profile?.full_name}</p>
                    {sub?.submitted_at && <p className="text-xs text-muted">{formatDateTime(sub.submitted_at)}{late ? " · kechikkan" : ""}</p>}
                  </div>
                </div>
                {sub?.status === "graded" && <span className="font-bold text-green text-sm">{sub.score ?? "—"}/{h.points}</span>}
                {status ? <Badge tone={status.tone}>{status.label}</Badge> : <Badge tone="gray">Topshirmagan</Badge>}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setReview({ sub: sub ?? emptySubmission(h.id, m.student_id), name: m.profile?.full_name ?? "O'quvchi" })}
                >
                  <ClipboardCheck size={14} /> {sub?.status === "graded" ? "Ko'rish" : isHanded ? "Tekshirish" : "Baholash"}
                </Button>
              </div>
            );
          })}
          {rows.length === 0 && <p className="text-sm text-muted py-3">O&apos;quvchi yo&apos;q.</p>}
        </div>
      </Panel>

      <ReviewDialog open={Boolean(review)} homework={h} submission={review?.sub ?? null} studentName={review?.name ?? ""} onClose={() => setReview(null)} onSaved={() => subs.reload()} />
    </Page>
  );
}

// ── queue of submissions waiting for a grade ────────────────────────────────
// Handed-in work is always listed. After the deadline, students who did not
// press "Topshirish" are listed too (they show their work to the teacher).
export function GradingView({ groups }: { groups: GroupFull[] }) {
  const ids = groups.map((g) => g.id);
  const hw = useLoad(() => listHomework(ids), [ids.join(",")]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const members = useLoad(() => allMemberships(), []);
  const people = useLoad(() => listProfiles("student"), []);
  const [review, setReview] = useState<{ sub: Submission; name: string; hw: Homework } | null>(null);

  const pending = buildGradingQueue(hw.data ?? [], subs.data ?? [], members.data ?? []);
  const nameOf = (id: string, ps: Profile[] | null) => ps?.find((p) => p.id === id)?.full_name ?? "O'quvchi";

  return (
    <Page>
      <PageHeader title="Baholash" subtitle="Tekshirilishi kerak bo'lgan topshiriqlar" />
      {(hw.error || subs.error || members.error) && <ErrorNote message={(hw.error ?? subs.error ?? members.error) as string} />}
      {hw.loading || subs.loading || members.loading ? (
        <Spinner />
      ) : pending.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Tekshiriladigan topshiriq yo'q" text="Yangi topshiriq kelganda yoki muddat o'tganda shu yerda ko'rinadi." />
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((item) => {
            const name = nameOf(item.studentId, people.data);
            return (
              <button key={item.key} onClick={() => setReview({ sub: item.sub, name, hw: item.hw })} className="text-left rounded-2xl bg-surface border border-border p-4 hover:border-border-strong flex flex-wrap items-center gap-3">
                <Avatar name={name} size={40} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-bold text-sm">{name}</p>
                  <p className="text-xs text-muted truncate">{item.hw.title} · {groups.find((g) => g.id === item.hw.group_id)?.name}</p>
                </div>
                <span className="text-xs text-muted">
                  {item.handed ? formatDateTime(item.sub.submitted_at) : `Muddat: ${formatDateTime(item.hw.due_at)}`}
                </span>
                {item.handed ? <Badge tone={SUBMISSION[item.sub.status].tone}>{SUBMISSION[item.sub.status].label}</Badge> : <Badge tone="gray">Topshirmagan</Badge>}
              </button>
            );
          })}
        </div>
      )}
      <ReviewDialog open={Boolean(review)} homework={review?.hw ?? null} submission={review?.sub ?? null} studentName={review?.name ?? ""} onClose={() => setReview(null)} onSaved={() => subs.reload()} />
    </Page>
  );
}
