"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Link as LinkIcon, Pencil, Plus, Trash2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { DataTable } from "@/components/platform/DataTable";
import { FileUploader, openStoredFile } from "@/components/platform/FileUploader";
import { useToast } from "@/components/platform/Toast";
import { Avatar, Badge, EmptyState, ErrorNote, Field, Input, Modal, Page, PageHeader, Panel, Select, Spinner, Tabs, useLoad } from "@/components/platform/ui";
import { AttendanceView } from "./AttendanceView";
import { HomeworkFormModal } from "./HomeworkFormModal";
import { AnnouncementsPanel } from "./AnnouncementsView";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  addMaterial, addMembers, attendanceRate, deleteGroup, deleteMaterial, getDetailsMap, listAttendance, listBranches, listCourses, listHomework, listLessons, listMaterials,
  listMembers, listProfiles, listSubmissions, removeMember, saveGroup, setLessonStatus, setLessonTopic, uploadFiles, type GroupFull, type GroupInput,
} from "@/lib/platform/api";
import { baseOf, type StaffRole } from "@/lib/platform/staff";
import { GROUP_STATUS, HOMEWORK_TYPES, WEEKDAYS_FULL, WEEKDAYS_SHORT } from "@/lib/platform/labels";
import { deadlineHint, formatDate, formatTime, timeRange } from "@/lib/platform/format";
import { lessonDatesInRange } from "@/lib/platform/schedule";
import { shiftDateKey, tashkentDateKey } from "@/lib/utils/dates";
import { displayLogin } from "@/lib/utils/usernames";
import type { FileRef, GroupStatus, Homework } from "@/lib/platform/types";

// ── list ────────────────────────────────────────────────────────────────────
export function GroupsListView({ role, groups, loading, error, reload }: { role: StaffRole; groups: GroupFull[]; loading: boolean; error: string | null; reload: () => void }) {
  const router = useRouter();
  const base = baseOf(role);
  const [form, setForm] = useState<{ open: boolean; group: GroupFull | null }>({ open: false, group: null });

  return (
    <Page wide>
      <PageHeader
        title={role === "admin" ? "Guruhlar" : "Guruhlarim"}
        subtitle={role === "admin" ? "Markazdagi barcha guruhlar" : "Sizga biriktirilgan guruhlar"}
        actions={role === "admin" && <Button onClick={() => setForm({ open: true, group: null })}><Plus size={16} /> Guruh yaratish</Button>}
      />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {loading ? <Spinner /> : (
        <DataTable<GroupFull>
          rows={groups}
          rowKey={(g) => g.id}
          searchText={(g) => `${g.name} ${g.course?.name ?? ""} ${g.teacher?.full_name ?? ""}`}
          searchPlaceholder="Guruh, kurs yoki ustoz bo'yicha qidirish..."
          onRowClick={(g) => router.push(`${base}/groups/${g.id}`)}
          empty={<EmptyState icon={Users} title={role === "admin" ? "Hali guruh yaratilmagan" : "Sizga guruh biriktirilmagan"} text={role === "admin" ? "“Guruh yaratish” tugmasi bilan boshlang." : "Admin sizni guruhga biriktirgach shu yerda ko'rinadi."} />}
          columns={[
            { key: "name", header: "Guruh", sortValue: (g) => g.name, render: (g) => (<div><p className="font-semibold">{g.name}</p><p className="text-xs text-muted">{g.course?.name ?? "Kurs belgilanmagan"}</p></div>) },
            { key: "teacher", header: "Ustoz", render: (g) => g.teacher?.full_name ?? <span className="text-muted-soft">Belgilanmagan</span> },
            { key: "schedule", header: "Jadval", render: (g) => (<span className="text-sm">{g.lesson_days.map((d) => WEEKDAYS_SHORT[d - 1]).join(", ") || "—"} <span className="text-muted">{timeRange(g.start_time, g.end_time)}</span></span>) },
            { key: "count", header: "O'quvchilar", sortValue: (g) => g.memberCount, render: (g) => g.memberCount },
            { key: "status", header: "Holat", render: (g) => <Badge tone={GROUP_STATUS[g.status].tone}>{GROUP_STATUS[g.status].label}</Badge> },
          ]}
        />
      )}
      <GroupFormModal open={form.open} group={form.group} onClose={() => setForm({ open: false, group: null })} onSaved={reload} />
    </Page>
  );
}

// ── create / edit (admin) ───────────────────────────────────────────────────
export function GroupFormModal({ open, group, onClose, onSaved }: { open: boolean; group: GroupFull | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const courses = useLoad(() => listCourses(), []);
  const teachers = useLoad(() => listProfiles("teacher"), []);
  const branches = useLoad(() => listBranches(), []);
  const [f, setF] = useState<GroupInput>({ name: "", lesson_days: [], status: "new" });
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  // reset the form when it opens for a different group
  const key = open ? group?.id ?? "new" : null;
  if (key !== seed) {
    setSeed(key);
    if (open) {
      setF(group ? { ...group } : { name: "", lesson_days: [1, 3, 5], status: "new", start_time: "14:00", end_time: "15:30" });
      setPrice(group?.monthly_price != null ? String(group.monthly_price) : "");
    }
  }

  const set = <K extends keyof GroupInput>(k: K, v: GroupInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const problem = f.name.trim().length < 2 ? "Guruh nomini kiriting." : f.start_time && f.end_time && f.end_time <= f.start_time ? "Tugash vaqti boshlanishidan keyin bo'lsin." : f.start_date && f.end_date && f.end_date < f.start_date ? "Tugash sanasi boshlanishidan keyin bo'lsin." : price && Number.isNaN(Number(price)) ? "Narx raqam bo'lsin." : null;

  const save = async () => {
    if (problem) return;
    setBusy(true);
    try {
      await saveGroup({
        id: group?.id,
        name: f.name.trim(),
        course_id: f.course_id || null,
        teacher_id: f.teacher_id || null,
        branch_id: f.branch_id || null,
        level: f.level || null,
        lesson_days: f.lesson_days ?? [],
        start_time: f.start_time || null,
        end_time: f.end_time || null,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        status: (f.status ?? "new") as GroupStatus,
        monthly_price: price === "" ? null : Number(price),
      });
      toast.success(group ? "Guruh yangilandi." : "Guruh yaratildi.");
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(/duplicate|unique/i.test(msg) ? "Bu nomli guruh allaqachon bor." : msg);
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (d: number) => set("lesson_days", (f.lesson_days ?? []).includes(d) ? (f.lesson_days ?? []).filter((x) => x !== d) : [...(f.lesson_days ?? []), d].sort());

  return (
    <Modal open={open} onClose={onClose} size="lg" title={group ? "Guruhni tahrirlash" : "Yangi guruh"} footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={save} disabled={busy || Boolean(problem)}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Guruh nomi" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Masalan: SNU 1A — Du/Chor/Ju 14:00" /></Field>
        <Field label="Kurs">
          <Select value={f.course_id ?? ""} onChange={(e) => { set("course_id", e.target.value || null); const c = (courses.data ?? []).find((x) => x.id === e.target.value); if (c && price === "") setPrice(String(c.monthly_price || "")); }}>
            <option value="">Belgilanmagan</option>
            {(courses.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Daraja"><Input value={f.level ?? ""} onChange={(e) => set("level", e.target.value)} placeholder="1A" /></Field>
        <Field label="Ustoz">
          <Select value={f.teacher_id ?? ""} onChange={(e) => set("teacher_id", e.target.value || null)}>
            <option value="">Belgilanmagan</option>
            {(teachers.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Filial">
          <Select value={f.branch_id ?? ""} onChange={(e) => set("branch_id", e.target.value || null)}>
            <option value="">Belgilanmagan</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-muted mb-2">Dars kunlari</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS_SHORT.map((label, i) => {
              const on = (f.lesson_days ?? []).includes(i + 1);
              return <button key={label} type="button" onClick={() => toggleDay(i + 1)} className={`h-10 w-12 rounded-xl border-2 text-sm font-bold ${on ? "border-brand bg-brand-soft" : "border-border text-muted"}`}>{label}</button>;
            })}
          </div>
        </div>
        <Field label="Boshlanish vaqti"><Input type="time" value={formatTime(f.start_time) || ""} onChange={(e) => set("start_time", e.target.value || null)} /></Field>
        <Field label="Tugash vaqti"><Input type="time" value={formatTime(f.end_time) || ""} onChange={(e) => set("end_time", e.target.value || null)} /></Field>
        <Field label="Boshlanish sanasi"><Input type="date" value={f.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)} /></Field>
        <Field label="Tugash sanasi"><Input type="date" value={f.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} /></Field>
        <Field label="Oylik to'lov (so'm)" hint="Bo'sh bo'lsa, kurs narxi olinadi."><Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500000" /></Field>
        <Field label="Holat">
          <Select value={f.status ?? "new"} onChange={(e) => set("status", e.target.value as GroupStatus)}>
            {(Object.keys(GROUP_STATUS) as GroupStatus[]).map((s) => <option key={s} value={s}>{GROUP_STATUS[s].label}</option>)}
          </Select>
        </Field>
        {problem && <p className="sm:col-span-2 text-xs text-red">{problem}</p>}
      </div>
    </Modal>
  );
}

// ── detail ──────────────────────────────────────────────────────────────────
type Tab = "students" | "attendance" | "homework" | "grades" | "schedule" | "materials" | "announcements";

export function GroupDetailView({ role, group, allGroups, reloadGroups }: { role: StaffRole; group: GroupFull; allGroups: GroupFull[]; reloadGroups: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const base = baseOf(role);
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<Tab>("students");
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);

  return (
    <Page wide>
      <PageHeader
        back={<Link href={`${base}/groups`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Guruhlar</Link>}
        title={group.name}
        subtitle={`${group.course?.name ?? "Kurs belgilanmagan"}${group.teacher ? ` · ${group.teacher.full_name}` : ""}`}
        actions={
          <>
            <Badge tone={GROUP_STATUS[group.status].tone}>{GROUP_STATUS[group.status].label}</Badge>
            {isAdmin && <Button variant="secondary" size="sm" onClick={() => setEdit(true)}><Pencil size={14} /> Tahrirlash</Button>}
            {isAdmin && <Button variant="danger" size="sm" onClick={() => setDel(true)}><Trash2 size={14} /> O&apos;chirish</Button>}
          </>
        }
      />
      <div className="flex flex-wrap gap-2 text-sm text-muted mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1.5 shadow-[var(--shadow-xs)]"><CalendarDays size={15} /> {group.lesson_days.map((d) => WEEKDAYS_FULL[d - 1]).join(", ") || "Kunlar belgilanmagan"} {timeRange(group.start_time, group.end_time)}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1.5 shadow-[var(--shadow-xs)]"><Users size={15} /> {group.memberCount} ta o&apos;quvchi</span>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "students", label: "O'quvchilar", count: group.memberCount },
          { id: "attendance", label: "Davomat" },
          { id: "homework", label: "Vazifalar" },
          { id: "grades", label: "Baholar" },
          { id: "schedule", label: "Jadval" },
          { id: "materials", label: "Materiallar" },
          { id: "announcements", label: "E'lonlar" },
        ]}
      />

      {tab === "students" && <MembersTab role={role} group={group} onChanged={reloadGroups} />}
      {tab === "attendance" && <AttendanceView groups={allGroups} fixedGroupId={group.id} />}
      {tab === "homework" && <GroupHomeworkTab role={role} group={group} />}
      {tab === "grades" && <GradesTab group={group} />}
      {tab === "schedule" && <ScheduleTab group={group} />}
      {tab === "materials" && <MaterialsTab group={group} />}
      {tab === "announcements" && <AnnouncementsPanel role={role} groups={[group]} fixedGroupId={group.id} />}

      {isAdmin && <GroupFormModal open={edit} group={group} onClose={() => setEdit(false)} onSaved={reloadGroups} />}
      <ConfirmDialog
        open={del} title="Guruhni o'chirish" confirmLabel="O'chirish" onCancel={() => setDel(false)}
        onConfirm={async () => { try { await deleteGroup(group.id); toast.success("Guruh o'chirildi."); router.push(`${base}/groups`); } catch (e) { toast.error((e as Error).message); } }}
      >
        <p><b className="text-foreground">{group.name}</b> guruhi, uning darslari, davomati va vazifalari o&apos;chadi. O&apos;quvchilar akkauntlari saqlanadi. Qaytarib bo&apos;lmaydi.</p>
      </ConfirmDialog>
    </Page>
  );
}

function MembersTab({ role, group, onChanged }: { role: StaffRole; group: GroupFull; onChanged: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const base = baseOf(role);
  const members = useLoad(() => listMembers(group.id), [group.id]);
  const details = useLoad(() => getDetailsMap(), []);
  const att = useLoad(() => listAttendance({ groupIds: [group.id] }), [group.id]);
  const [adding, setAdding] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const everyone = useLoad(() => (adding ? listProfiles("student") : Promise.resolve([])), [adding]);
  const inGroup = new Set((members.data ?? []).map((m) => m.student_id));
  const candidates = (everyone.data ?? []).filter((p) => !inGroup.has(p.id) && p.status === "active");

  const add = async () => {
    try {
      await addMembers(group.id, chosen);
      toast.success(`${chosen.length} ta o'quvchi qo'shildi.`);
      setAdding(false);
      setChosen([]);
      members.reload();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      {role === "admin" && <div className="mb-4 flex justify-end"><Button onClick={() => setAdding(true)}><Plus size={16} /> O&apos;quvchi qo&apos;shish</Button></div>}
      {members.loading ? <Spinner /> : (
        <DataTable
          rows={members.data ?? []}
          rowKey={(m) => m.student_id}
          searchText={(m) => m.profile?.full_name ?? ""}
          pageSize={15}
          onRowClick={(m) => router.push(`${base}/students/${m.student_id}`)}
          empty={<EmptyState icon={Users} title="Guruhda o'quvchi yo'q" />}
          columns={[
            { key: "name", header: "O'quvchi", render: (m) => (<div className="flex items-center gap-3 min-w-0"><Avatar name={m.profile?.full_name ?? "?"} size={34} /><div className="min-w-0"><p className="font-semibold truncate">{m.profile?.full_name}</p><p className="text-xs text-muted truncate">{m.profile ? displayLogin(m.profile.username) : ""}</p></div></div>) },
            { key: "phone", header: "Telefon", render: (m) => details.data?.[m.student_id]?.phone || <span className="text-muted-soft">—</span> },
            { key: "att", header: "Davomat", render: (m) => { const rows = (att.data ?? []).filter((a) => a.student_id === m.student_id); return rows.length ? `${attendanceRate(rows)}%` : "—"; } },
            { key: "joined", header: "Qo'shilgan", render: (m) => formatDate(m.joined_at) },
            ...(role === "admin" ? [{ key: "x", header: "", render: (m: { student_id: string }) => (<button onClick={(e) => { e.stopPropagation(); removeMember(group.id, m.student_id).then(() => { members.reload(); onChanged(); toast.success("Guruhdan chiqarildi."); }).catch((er: Error) => toast.error(er.message)); }} className="text-xs text-red font-semibold">Chiqarish</button>) }] : []),
          ]}
        />
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Guruhga o'quvchi qo'shish" footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Bekor qilish</Button><Button onClick={add} disabled={chosen.length === 0}>{chosen.length} ta qo&apos;shish</Button></>}>
        {everyone.loading ? <Spinner /> : candidates.length === 0 ? <p className="text-sm text-muted">Qo&apos;shiladigan faol o&apos;quvchi yo&apos;q.</p> : (
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border divide-y divide-border">
            {candidates.map((p) => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded accent-[var(--brand-dark)] cursor-pointer" checked={chosen.includes(p.id)} onChange={(e) => setChosen((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)))} />
                {p.full_name} <span className="text-muted text-xs">{displayLogin(p.username)}</span>
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function GroupHomeworkTab({ role, group }: { role: StaffRole; group: GroupFull }) {
  const base = baseOf(role);
  const hw = useLoad(() => listHomework([group.id]), [group.id]);
  const [form, setForm] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end"><Button onClick={() => setForm(true)}><Plus size={16} /> Yangi vazifa</Button></div>
      {hw.loading ? <Spinner /> : (hw.data ?? []).length === 0 ? <EmptyState title="Vazifa yo'q" /> : (hw.data ?? []).map((h: Homework) => (
        <Link key={h.id} href={`${base}/homework/${h.id}`} className="flex items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-sm)] transition-all">
          <div className="min-w-0 flex-1"><p className="font-semibold text-sm truncate">{h.title}</p><p className="text-xs text-muted">{HOMEWORK_TYPES[h.type]} · {h.points} ball</p></div>
          <span className="text-xs font-semibold text-muted rounded-full bg-black/[0.05] dark:bg-white/10 px-2.5 py-1 whitespace-nowrap">{deadlineHint(h.due_at)}</span>
        </Link>
      ))}
      <HomeworkFormModal open={form} groups={[group]} groupId={group.id} onClose={() => setForm(false)} onSaved={hw.reload} />
    </div>
  );
}

function GradesTab({ group }: { group: GroupFull }) {
  const members = useLoad(() => listMembers(group.id), [group.id]);
  const hw = useLoad(() => listHomework([group.id]), [group.id]);
  const subs = useLoad(() => listSubmissions((hw.data ?? []).map((h) => h.id)), [(hw.data ?? []).length]);
  if (members.loading || hw.loading) return <Spinner />;
  const homework = [...(hw.data ?? [])].reverse().slice(-8);
  if (homework.length === 0) return <EmptyState title="Baho yo'q" text="Vazifa berilgach baholar jadvali shu yerda ko'rinadi." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border bg-background/70"><th className="px-4 py-3 font-semibold">O&apos;quvchi</th>{homework.map((h) => <th key={h.id} className="px-3 py-3 font-semibold whitespace-nowrap max-w-[8rem] truncate" title={h.title}>{h.title}</th>)}<th className="px-4 py-3 font-semibold">O&apos;rtacha</th></tr></thead>
        <tbody>
          {(members.data ?? []).map((m) => {
            const mine = homework.map((h) => (subs.data ?? []).find((s) => s.homework_id === h.id && s.student_id === m.student_id));
            const scored = mine.filter((s) => s?.status === "graded" && s.score !== null);
            const avg = scored.length ? Math.round(scored.reduce((a, s) => a + ((s?.score ?? 0) / (homework[mine.indexOf(s)]?.points || 100)) * 100, 0) / scored.length) : null;
            return (
              <tr key={m.student_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{m.profile?.full_name}</td>
                {mine.map((s, i) => <td key={homework[i].id} className="px-3 py-3 text-center">{s ? (s.status === "graded" ? <b>{s.score}</b> : <span className="text-xs text-muted">{s.status === "draft" ? "—" : "kutilmoqda"}</span>) : <span className="text-muted-soft">—</span>}</td>)}
                <td className="px-4 py-3 font-bold">{avg === null ? "—" : `${avg}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleTab({ group }: { group: GroupFull }) {
  const { user } = useAuth();
  const toast = useToast();
  const today = tashkentDateKey();
  const to = shiftDateKey(today, 28);
  const lessons = useLoad(() => listLessons([group.id], today, to), [group.id]);
  const dates = [...new Set([...lessonDatesInRange(group, today, to), ...(lessons.data ?? []).map((l) => l.lesson_date)])].sort();
  const byDate = new Map((lessons.data ?? []).map((l) => [l.lesson_date, l]));
  const [topics, setTopics] = useState<Record<string, string>>({});
  if (lessons.loading) return <Spinner />;
  if (dates.length === 0) return <EmptyState icon={CalendarDays} title="Yaqin darslar yo'q" text="Guruhga dars kunlari belgilanmagan." />;

  const saveTopic = async (date: string) => {
    if (!user || topics[date] === undefined) return;
    try { await setLessonTopic(group, date, topics[date], user.id); toast.success("Mavzu saqlandi."); lessons.reload(); } catch (e) { toast.error((e as Error).message); }
  };
  const cancel = async (date: string, cancelled: boolean) => {
    if (!user) return;
    try { await setLessonStatus(group, date, cancelled ? "planned" : "cancelled", user.id); lessons.reload(); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Panel title="Keyingi 4 hafta: mavzularni belgilang">
      <div className="flex flex-col">
        {dates.map((d) => {
          const l = byDate.get(d);
          const cancelled = l?.status === "cancelled";
          return (
            <div key={d} className="flex flex-wrap items-center gap-3 py-3 border-b border-border last:border-0">
              <span className={`w-28 shrink-0 text-sm font-bold ${cancelled ? "line-through text-muted" : ""}`}>{formatDate(d)}</span>
              <input
                value={topics[d] ?? l?.topic ?? ""}
                onChange={(e) => setTopics((p) => ({ ...p, [d]: e.target.value }))}
                onBlur={() => saveTopic(d)}
                disabled={cancelled}
                placeholder="Dars mavzusi"
                className="flex-1 basis-48 h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none transition-all hover:border-border-strong focus:border-brand-dark focus:ring-4 focus:ring-brand/25 disabled:opacity-50"
              />
              <button onClick={() => cancel(d, cancelled)} className="text-xs font-semibold text-muted hover:text-foreground">{cancelled ? "Qaytarish" : "Bekor qilish"}</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function MaterialsTab({ group }: { group: GroupFull }) {
  const { user } = useAuth();
  const toast = useToast();
  const items = useLoad(() => listMaterials({ groupId: group.id }), [group.id]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<FileRef[]>([]);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user) return;
    if (!title.trim() || (!url.trim() && files.length === 0)) return toast.error("Nom va havola yoki fayl kiriting.");
    setBusy(true);
    try {
      if (url.trim()) await addMaterial({ group_id: group.id, title: title.trim(), kind: "link", url: url.trim() }, user.id);
      for (const f of files) await addMaterial({ group_id: group.id, title: files.length > 1 ? `${title.trim()} — ${f.name}` : title.trim(), kind: "file", path: f.path }, user.id);
      toast.success("Material qo'shildi.");
      setOpen(false); setTitle(""); setUrl(""); setFiles([]);
      items.reload();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4"><Button onClick={() => setOpen(true)}><Plus size={16} /> Material qo&apos;shish</Button></div>
      {items.loading ? <Spinner /> : (items.data ?? []).length === 0 ? <EmptyState icon={FileText} title="Material yo'q" text="Havola yoki fayl qo'shing, o'quvchilar ko'radi." /> : (
        <div className="flex flex-col gap-2">
          {(items.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-xs)] hover:border-border-strong transition-colors">
              <span className="h-9 w-9 rounded-lg bg-brand-soft text-brand-darker flex items-center justify-center shrink-0">{m.kind === "link" ? <LinkIcon size={17} /> : <FileText size={17} />}</span>
              <button className="flex-1 min-w-0 text-left text-sm font-semibold truncate" onClick={() => (m.kind === "link" && m.url ? window.open(m.url, "_blank", "noopener") : m.path ? openStoredFile(m.path) : undefined)}>{m.title}</button>
              <button aria-label="O'chirish" onClick={() => deleteMaterial(m.id).then(items.reload).catch((e: Error) => toast.error(e.message))} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Material qo'shish" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button><Button onClick={save} disabled={busy}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button></>}>
        <div className="grid gap-4">
          <Field label="Nomi"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: 4-dars slayd" /></Field>
          <Field label="Havola (ixtiyoriy)"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
          <div><p className="text-xs font-semibold text-muted mb-2">Fayl (ixtiyoriy)</p><FileUploader value={files} onChange={setFiles} prefix={`mat/g/${group.id}`} /></div>
        </div>
      </Modal>
    </div>
  );
}

void User; void uploadFiles;
