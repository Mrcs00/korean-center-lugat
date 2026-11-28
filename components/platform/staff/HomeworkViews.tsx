"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { Avatar, Badge, EmptyState, ErrorNote, FilterChips, Modal, Page, PageHeader, Panel, Spinner, useLoad } from "@/components/platform/ui";
import { DataTable } from "@/components/platform/DataTable";
import { useToast } from "@/components/platform/Toast";
import { HomeworkFormModal } from "./HomeworkFormModal";
import { ReviewDialog } from "./ReviewDialog";
import { VocabResultsTable } from "./VocabResultsTable";
import { VocabAssignmentRow } from "./VocabAssignmentRow";
import { allMemberships, deleteHomework, getHomework, listHomework, listMembers, listProfiles, listSubmissions, type GroupFull } from "@/lib/platform/api";
import { baseOf, type StaffRole } from "@/lib/platform/staff";
import { HOMEWORK_TYPES, SUBMISSION } from "@/lib/platform/labels";
import { deadlineHint, formatDate, formatDateTime } from "@/lib/platform/format";
import { buildGradingQueue, emptySubmission } from "@/lib/platform/homework";
import { fetchAllAssignments, type RealAssignment } from "@/lib/services/assignmentService";
import { examSetTitle, rangeLabel } from "@/lib/utils/examSets";
import type { Homework, Profile, Submission } from "@/lib/platform/types";
import { groupLabeler } from "@/lib/platform/groupLabel";

// ── list of homework + vocabulary assignments (teacher: own groups, admin: all) ──
type Row = { id: string; kind: "hw"; h: Homework } | { id: string; kind: "vocab"; a: RealAssignment };

const vocabDetail = (a: RealAssignment) =>
  a.kind === "book_exam" ? `${a.questionCount ?? 50} ta tasodifiy savol` : a.wordFrom && a.wordTo ? rangeLabel(a.wordFrom, a.wordTo) : "Butun to'plam";

export function HomeworkListView({ role, groups }: { role: StaffRole; groups: GroupFull[] }) {
  const router = useRouter();
  const toast = useToast();
  const ids = groups.map((g) => g.id);
  const key = ids.join(",");
  const hw = useLoad(() => listHomework(ids), [key]);
  const vocab = useLoad(() => fetchAllAssignments(), []);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const memberships = useLoad(() => allMemberships(), []);
  const [form, setForm] = useState<{ open: boolean; existing: Homework | null }>({ open: false, existing: null });
  const [toDelete, setToDelete] = useState<Homework | null>(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState<"all" | "hw" | "vocab">("all");
  const [openVocab, setOpenVocab] = useState<RealAssignment | null>(null);

  const base = baseOf(role);
  const groupOf = (r: Row) => (r.kind === "hw" ? r.h.group_id : r.a.groupId);
  const dueOf = (r: Row) => (r.kind === "hw" ? r.h.due_at ?? "" : r.a.deadline ?? "");

  const all: Row[] = [
    ...(hw.data ?? []).map((h) => ({ id: h.id, kind: "hw" as const, h })),
    ...(vocab.data ?? []).filter((a) => ids.includes(a.groupId)).map((a) => ({ id: a.id, kind: "vocab" as const, a })),
  ];
  const rows = all
    .filter((r) => (groupFilter === "all" || groupOf(r) === groupFilter) && (kindFilter === "all" || r.kind === kindFilter))
    .sort((x, y) => {
      const dx = dueOf(x);
      const dy = dueOf(y);
      if (!dx && !dy) return 0;
      if (!dx) return 1;
      if (!dy) return -1;
      return dy.localeCompare(dx);
    });

  const membersOf = (h: Homework) => (h.student_ids ? h.student_ids.length : (memberships.data ?? []).filter((m) => m.group_id === h.group_id).length);
  const subsOf = (h: Homework) => (subs.data ?? []).filter((s) => s.homework_id === h.id && s.status !== "draft");
  const groupName = (gid: string) => {
    const g = groups.find((x) => x.id === gid);
    return g ? groupLabeler(groups)(g) : "—";
  };

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
        subtitle="Vazifa va lug'at topshiriqlari bir joyda. Vazifani o'zingiz baholaysiz, lug'atni tizim hisoblaydi"
        actions={
          <>
            <Link href={`${base}/exams`} className="h-10 px-4 rounded-xl border border-border text-sm font-semibold flex items-center hover:border-border-strong">Lug&apos;at topshirig&apos;i yuborish</Link>
            <Button onClick={() => setForm({ open: true, existing: null })} disabled={groups.length === 0}>
              <Plus size={16} /> Yangi vazifa
            </Button>
          </>
        }
      />
      {(hw.error || vocab.error) && <ErrorNote message={(hw.error ?? vocab.error) as string} onRetry={() => { hw.reload(); vocab.reload(); }} />}
      <div className="flex flex-col gap-3 mb-4">
        <FilterChips
          value={kindFilter}
          onChange={setKindFilter}
          options={[
            { id: "all", label: "Hammasi", count: all.length },
            { id: "hw", label: "Vazifalar", count: all.filter((r) => r.kind === "hw").length },
            { id: "vocab", label: "Lug'at", count: all.filter((r) => r.kind === "vocab").length },
          ]}
        />
        {groups.length > 1 && (
          <FilterChips value={groupFilter} onChange={setGroupFilter} options={[{ id: "all", label: "Barcha guruhlar" }, ...groups.map((g, _i, all) => ({ id: g.id, label: groupLabeler(all)(g) }))]} />
        )}
      </div>
      {hw.loading ? (
        <Spinner />
      ) : (
        <DataTable<Row>
          rows={rows}
          rowKey={(r) => r.id}
          searchText={(r) => `${r.kind === "hw" ? r.h.title : examSetTitle(r.a.setId)} ${groupName(groupOf(r))}`}
          searchPlaceholder="Vazifa yoki guruh bo'yicha qidirish..."
          onRowClick={(r) => (r.kind === "hw" ? router.push(`${base}/homework/${r.h.id}`) : setOpenVocab(r.a))}
          empty={<EmptyState icon={ClipboardList} title="Hali vazifa berilmagan" text="“Yangi vazifa” tugmasi bilan birinchi vazifani bering." />}
          columns={[
            {
              key: "title",
              header: "Vazifa",
              sortValue: (r) => (r.kind === "hw" ? r.h.title : examSetTitle(r.a.setId)),
              render: (r) =>
                r.kind === "hw" ? (
                  <div>
                    <p className="font-semibold">{r.h.title}</p>
                    <p className="text-xs text-muted">{HOMEWORK_TYPES[r.h.type]} · {r.h.points} ball</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-kr font-semibold">{examSetTitle(r.a.setId)}</p>
                    <p className="text-xs text-muted">{vocabDetail(r.a)} · o&apos;tish {r.a.minimumMastery}%</p>
                  </div>
                ),
            },
            { key: "kind", header: "Turi", render: (r) => (r.kind === "hw" ? <Badge tone="gray">Vazifa</Badge> : <Badge tone="brand">Lug&apos;at</Badge>) },
            { key: "group", header: "Guruh", render: (r) => groupName(groupOf(r)) },
            {
              key: "due",
              header: "Muddat",
              sortValue: (r) => dueOf(r) || "9",
              render: (r) =>
                r.kind === "hw" ? (
                  r.h.due_at ? <span>{formatDateTime(r.h.due_at)}<span className="block text-xs text-muted">{deadlineHint(r.h.due_at)}</span></span> : "Muddatsiz"
                ) : r.a.deadline ? formatDate(r.a.deadline) : "Muddatsiz",
            },
            { key: "done", header: "Topshirgan", render: (r) => (r.kind === "hw" ? `${subsOf(r.h).length} / ${membersOf(r.h)}` : <span className="text-xs text-muted">Natijalar</span>) },
            { key: "graded", header: "Baholangan", render: (r) => (r.kind === "hw" ? subsOf(r.h).filter((s) => s.status === "graded").length : <span className="text-xs text-muted">Avtomatik</span>) },
            {
              key: "actions",
              header: "",
              render: (r) =>
                r.kind === "hw" ? (
                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button aria-label="Tahrirlash" onClick={() => setForm({ open: true, existing: r.h })} className="h-8 w-8 rounded-lg hover:bg-black/[0.05] flex items-center justify-center text-muted"><Pencil size={15} /></button>
                    <button aria-label="O'chirish" onClick={() => setToDelete(r.h)} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button>
                  </div>
                ) : null,
            },
          ]}
        />
      )}

      <Modal
        open={Boolean(openVocab)}
        onClose={() => setOpenVocab(null)}
        size="lg"
        title={openVocab ? `${examSetTitle(openVocab.setId)} · ${groupName(openVocab.groupId)}` : ""}
        footer={<Button variant="secondary" onClick={() => setOpenVocab(null)}>Yopish</Button>}
      >
        {openVocab && <VocabResultsTable a={openVocab} />}
      </Modal>

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

// ── grading page: homework you grade yourself + vocabulary results (automatic) ──
// Handed-in work is always listed. After the deadline, students who did not
// press "Topshirish" are listed too (they show their work to the teacher).
export function GradingView({ groups }: { groups: GroupFull[] }) {
  const ids = groups.map((g) => g.id);
  const hw = useLoad(() => listHomework(ids), [ids.join(",")]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  const members = useLoad(() => allMemberships(), []);
  const people = useLoad(() => listProfiles("student"), []);
  const vocab = useLoad(() => fetchAllAssignments(), []);
  const [groupFilter, setGroupFilter] = useState("all");
  const [review, setReview] = useState<{ sub: Submission; name: string; hw: Homework } | null>(null);

  const inGroup = (gid: string) => groupFilter === "all" || gid === groupFilter;
  const pending = buildGradingQueue(hw.data ?? [], subs.data ?? [], members.data ?? []).filter((i) => inGroup(i.hw.group_id));
  const vocabRows = (vocab.data ?? [])
    .filter((a) => ids.includes(a.groupId) && inGroup(a.groupId))
    .sort((x, y) => (y.deadline ?? "").localeCompare(x.deadline ?? ""));
  const nameOf = (id: string, ps: Profile[] | null) => ps?.find((p) => p.id === id)?.full_name ?? "O'quvchi";
  const groupName = (gid: string) => {
    const g = groups.find((x) => x.id === gid);
    return g ? groupLabeler(groups)(g) : "";
  };

  return (
    <Page>
      <PageHeader title="Baholash" subtitle="Vazifalarni o'zingiz baholaysiz, lug'at topshiriqlarida ball avtomatik" />
      {(hw.error || subs.error || members.error || vocab.error) && <ErrorNote message={(hw.error ?? subs.error ?? members.error ?? vocab.error) as string} />}
      {groups.length > 1 && (
        <div className="mb-4">
          <FilterChips value={groupFilter} onChange={setGroupFilter} options={[{ id: "all", label: "Barcha guruhlar" }, ...groups.map((g, _i, all) => ({ id: g.id, label: groupLabeler(all)(g) }))]} />
        </div>
      )}

      <h2 className="text-sm font-extrabold mb-2">Baholash kerak</h2>
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
                  <p className="text-xs text-muted truncate">{item.hw.title} · {groupName(item.hw.group_id)}</p>
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

      <h2 className="text-sm font-extrabold mt-8 mb-1">Lug&apos;at topshiriqlari (avtomatik)</h2>
      <p className="text-xs text-muted mb-3">O&apos;quvchi testni o&apos;zi yechadi, ball avtomatik hisoblanadi. Siz faqat natijani ko&apos;rasiz.</p>
      {vocab.loading ? (
        <Spinner />
      ) : vocabRows.length === 0 ? (
        <p className="text-sm text-muted">Lug&apos;at topshirig&apos;i yo&apos;q.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {vocabRows.map((a) => <VocabAssignmentRow key={a.id} a={a} groupName={groupName(a.groupId)} />)}
        </div>
      )}

      <ReviewDialog open={Boolean(review)} homework={review?.hw ?? null} submission={review?.sub ?? null} studentName={review?.name ?? ""} onClose={() => setReview(null)} onSaved={() => subs.reload()} />
    </Page>
  );
}
