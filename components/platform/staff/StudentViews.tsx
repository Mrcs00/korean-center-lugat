"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, KeyRound, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { ExamHistory } from "@/components/teacher/ExamHistory";
import { AddAccountsDialog } from "@/components/platform/AddAccountsDialog";
import { PasswordResultDialog } from "@/components/platform/PasswordResultDialog";
import { DataTable } from "@/components/platform/DataTable";
import { useToast } from "@/components/platform/Toast";
import { Avatar, Badge, EmptyState, ErrorNote, Field, FilterChips, Input, Modal, Page, PageHeader, Panel, Select, Spinner, StatCard, Tabs, useLoad } from "@/components/platform/ui";
import { Dices } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  addMembers, allMemberships, attendanceRate, deleteUsers, getDetailsMap, getProfile, listAttendance, listBranches, listGroups, listHomework, listPayments, listProfiles,
  listSubmissions, mySubmissions, removeMember, resetPassword, saveDetails, setUserActive, updateProfile, type GroupFull,
} from "@/lib/platform/api";
import { fetchRealStudents } from "@/lib/services/teacherService";
import { baseOf, type StaffRole } from "@/lib/platform/staff";
import { ATTENDANCE, PAYMENT_METHODS, SUBMISSION } from "@/lib/platform/labels";
import { formatDate, formatMoney, formatPeriod, percent } from "@/lib/platform/format";
import { displayLogin } from "@/lib/utils/usernames";
import { randomPassword } from "@/lib/utils/passwords";
import { masteryColor } from "@/lib/utils/groupColor";
import type { Profile } from "@/lib/platform/types";
import { MonthlyReport } from "./MonthlyReport";
import { StudentVocabList } from "./StudentVocabList";

// ── students list ───────────────────────────────────────────────────────────
export function StudentsListView({ role, groups }: { role: StaffRole; groups: GroupFull[] }) {
  const router = useRouter();
  const base = baseOf(role);
  const profiles = useLoad(() => listProfiles("student"), []);
  const members = useLoad(() => allMemberships(), []);
  const details = useLoad(() => getDetailsMap(), []);
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "nogroup">("all");
  const [adding, setAdding] = useState(false);

  const groupsOf = (id: string) => (members.data ?? []).filter((m) => m.student_id === id).map((m) => groups.find((g) => g.id === m.group_id)?.name).filter(Boolean) as string[];
  const inGroup = (id: string, gid: string) => (members.data ?? []).some((m) => m.student_id === id && m.group_id === gid);

  const rows = (profiles.data ?? []).filter((p) => {
    if (groupFilter !== "all" && !inGroup(p.id, groupFilter)) return false;
    if (statusFilter === "active" && p.status !== "active") return false;
    if (statusFilter === "inactive" && p.status !== "inactive") return false;
    if (statusFilter === "nogroup" && groupsOf(p.id).length > 0) return false;
    return true;
  });
  const reload = () => { profiles.reload(); members.reload(); details.reload(); };

  return (
    <Page wide>
      <PageHeader
        title="O'quvchilar"
        subtitle={role === "admin" ? "Barcha o'quvchilar" : "Sizning guruhlaringiz o'quvchilari"}
        actions={role === "admin" && <Button onClick={() => setAdding(true)}><Plus size={16} /> O&apos;quvchi qo&apos;shish</Button>}
      />
      {profiles.error && <ErrorNote message={profiles.error} onRetry={reload} />}
      <div className="flex flex-col gap-3 mb-4">
        {groups.length > 1 && <FilterChips value={groupFilter} onChange={setGroupFilter} options={[{ id: "all", label: "Barcha guruhlar" }, ...groups.map((g) => ({ id: g.id, label: g.name }))]} />}
        {role === "admin" && (
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "Hammasi", count: (profiles.data ?? []).length },
              { id: "active", label: "Faol", count: (profiles.data ?? []).filter((p) => p.status === "active").length },
              { id: "inactive", label: "Nofaol", count: (profiles.data ?? []).filter((p) => p.status === "inactive").length },
              { id: "nogroup", label: "Guruhsiz", count: (profiles.data ?? []).filter((p) => groupsOf(p.id).length === 0).length },
            ]}
          />
        )}
      </div>

      {profiles.loading ? (
        <Spinner />
      ) : (
        <DataTable<Profile>
          rows={rows}
          rowKey={(p) => p.id}
          searchText={(p) => `${p.full_name} ${p.username} ${details.data?.[p.id]?.phone ?? ""}`}
          searchPlaceholder="Ism, login yoki telefon bo'yicha qidirish..."
          onRowClick={(p) => router.push(`${base}/students/${p.id}`)}
          pageSize={12}
          empty={<EmptyState title="O'quvchi topilmadi" text={role === "admin" ? "“O'quvchi qo'shish” tugmasi bilan yangi akkaunt yarating." : "Sizning guruhlaringizda hali o'quvchi yo'q."} />}
          columns={[
            { key: "name", header: "O'quvchi", sortValue: (p) => p.full_name, render: (p) => (
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={p.full_name} size={36} />
                <div className="min-w-0"><p className="font-semibold truncate">{p.full_name}</p><p className="text-xs text-muted truncate">{displayLogin(p.username)}</p></div>
              </div>
            ) },
            { key: "groups", header: "Guruh", render: (p) => groupsOf(p.id).join(", ") || <span className="text-muted-soft">Guruhsiz</span> },
            { key: "phone", header: "Telefon", render: (p) => details.data?.[p.id]?.phone || <span className="text-muted-soft">—</span> },
            { key: "status", header: "Holat", render: (p) => <Badge tone={p.status === "active" ? "green" : "red"}>{p.status === "active" ? "Faol" : "Nofaol"}</Badge> },
          ]}
        />
      )}

      <AddAccountsDialog open={adding} role="student" groups={groups} onClose={() => setAdding(false)} onCreated={reload} />
    </Page>
  );
}

// ── one student ─────────────────────────────────────────────────────────────
type Tab = "overview" | "attendance" | "homework" | "exams" | "words" | "payments" | "report";

export function StudentProfileView({ role, id }: { role: StaffRole; id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const base = baseOf(role);
  const [tab, setTab] = useState<Tab>("overview");

  const profile = useLoad(() => getProfile(id), [id]);
  const details = useLoad(() => getDetailsMap([id]), [id]);
  const groups = useLoad(() => listGroups(), []);
  const members = useLoad(() => allMemberships(), []);
  const learning = useLoad(async () => (await fetchRealStudents()).find((s) => s.id === id) ?? null, [id]);
  const att = useLoad(() => listAttendance({ studentId: id }), [id]);
  const subs = useLoad(() => mySubmissionsOf(id), [id]);
  const homework = useLoad(() => listHomework(), []);
  const payments = useLoad(() => listPayments(id), [id]);
  const branches = useLoad(() => listBranches(), []);

  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "toggle" | "reset">(null);
  const [typedPassword, setTypedPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState<{ fullName: string; username: string; password: string } | null>(null);
  const [addGroup, setAddGroup] = useState("");

  if (profile.loading) return <Page><Spinner /></Page>;
  const p = profile.data;
  if (!p || p.role !== "student") {
    return <Page><EmptyState title="O'quvchi topilmadi" action={<Link href={`${base}/students`} className="text-sm font-semibold text-brand-darker">← O&apos;quvchilarga qaytish</Link>} /></Page>;
  }

  const isAdmin = role === "admin";
  const myGroupIds = (members.data ?? []).filter((m) => m.student_id === id).map((m) => m.group_id);
  const myGroups = (groups.data ?? []).filter((g) => myGroupIds.includes(g.id));
  const phone = details.data?.[id]?.phone;
  const attRows = att.data ?? [];
  const subRows = subs.data ?? [];
  const hwTotal = (homework.data ?? []).filter((h) => myGroupIds.includes(h.group_id) && (!h.student_ids || h.student_ids.includes(id))).length;
  const hwDone = subRows.filter((s) => s.status !== "draft").length;
  const graded = subRows.filter((s) => s.status === "graded");
  const l = learning.data;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        back={<Link href={`${base}/students`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> O&apos;quvchilar</Link>}
        title={p.full_name}
        subtitle={`${displayLogin(p.username)}${phone ? ` · ${phone}` : ""}`}
        actions={
          <>
            <Badge tone={p.status === "active" ? "green" : "red"}>{p.status === "active" ? "Faol" : "Nofaol"}</Badge>
            {isAdmin && <Button variant="secondary" size="sm" onClick={() => setEdit(true)}><Pencil size={14} /> Tahrirlash</Button>}
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {myGroups.length === 0 ? <Badge tone="red">Guruhsiz</Badge> : myGroups.map((g) => <Badge key={g.id} tone="brand">{g.name}</Badge>)}
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Umumiy" },
          { id: "attendance", label: "Davomat", count: attRows.length },
          { id: "homework", label: "Vazifalar", count: subRows.length },
          { id: "exams", label: "Imtihonlar", count: l?.attempts.length },
          { id: "words", label: "Xato so'zlar" },
          { id: "payments", label: "To'lovlar" },
          { id: "report", label: "Oylik hisobot" },
        ]}
      />

      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={UserCog} label="Davomat" value={attRows.length ? `${attendanceRate(attRows)}%` : "—"} tone="green" />
            <StatCard icon={UserCog} label="Vazifalar" value={`${hwDone}/${hwTotal}`} tone="blue" />
            <StatCard icon={UserCog} label="Vazifa o'rtacha bali" value={graded.length ? `${Math.round(graded.reduce((s, x) => s + (x.score ?? 0), 0) / graded.length)}` : "—"} tone="amber" />
            <StatCard icon={UserCog} label="Lug'at (o'zlashtirilgan)" value={l ? l.totalMastered : "—"} hint={l ? `${l.masteryPercent}% progress` : undefined} tone="brand" />
          </div>
          {l && (
            <Panel title="Lug'at progressi">
              <div className="h-2.5 rounded-full bg-black/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${l.masteryPercent}%`, background: masteryColor(l.masteryPercent) }} /></div>
              <p className="text-xs text-muted mt-2">Oxirgi imtihon: {l.lastExamScore ?? "—"} · O&apos;rtacha: {l.avgExamScore !== null ? `${l.avgExamScore}%` : "—"}</p>
            </Panel>
          )}

          {isAdmin && (
            <Panel title="Guruhlar">
              <div className="flex flex-col gap-2 mb-4">
                {myGroups.length === 0 && <p className="text-sm text-muted">Hech qaysi guruhda emas.</p>}
                {myGroups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5">
                    <span className="text-sm font-semibold">{g.name}</span>
                    <button
                      className="text-xs text-red font-semibold"
                      onClick={() => run(async () => { await removeMember(g.id, id); members.reload(); }, "Guruhdan chiqarildi.")}
                    >
                      Chiqarish
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value={addGroup} onChange={(e) => setAddGroup(e.target.value)}>
                  <option value="">Guruhga qo&apos;shish...</option>
                  {(groups.data ?? []).filter((g) => !myGroupIds.includes(g.id)).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
                <Button disabled={!addGroup || busy} onClick={() => run(async () => { await addMembers(addGroup, [id]); setAddGroup(""); members.reload(); }, "Guruhga qo'shildi.")}>Qo&apos;shish</Button>
              </div>
            </Panel>
          )}

          {isAdmin && (
            <Panel title="Akkaunt">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => { setTypedPassword(""); setConfirm("reset"); }}><KeyRound size={15} /> Parolni tiklash</Button>
                <Button variant="secondary" onClick={() => setConfirm("toggle")}>
                  {p.status === "active" ? <><Ban size={15} /> Bloklash</> : <><CheckCircle2 size={15} /> Faollashtirish</>}
                </Button>
                <Button variant="danger" onClick={() => setConfirm("delete")}><Trash2 size={15} /> O&apos;chirish</Button>
              </div>
              <p className="text-xs text-muted mt-3">Bloklangan o&apos;quvchi tizimga kira olmaydi, lekin ma&apos;lumotlari saqlanadi. O&apos;chirish esa butunlay va qaytarib bo&apos;lmaydi.</p>
            </Panel>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <Panel>
          {attRows.length === 0 ? <EmptyState title="Davomat belgilanmagan" /> : [...attRows].sort((a, b) => (b.lesson?.lesson_date ?? "").localeCompare(a.lesson?.lesson_date ?? "")).map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <span className="w-24 text-sm font-bold">{formatDate(r.lesson?.lesson_date)}</span>
              <span className="flex-1 text-sm text-muted truncate">{(groups.data ?? []).find((g) => g.id === r.lesson?.group_id)?.name}{r.lesson?.topic ? ` · ${r.lesson.topic}` : ""}</span>
              <Badge tone={ATTENDANCE[r.status].tone}>{ATTENDANCE[r.status].label}</Badge>
            </div>
          ))}
        </Panel>
      )}

      {tab === "homework" && (
        <div className="flex flex-col gap-6">
        <Panel title="Uy vazifalari">
          {subRows.length === 0 ? <EmptyState title="Topshirilgan vazifa yo'q" /> : subRows.map((s) => {
            const h = (homework.data ?? []).find((x) => x.id === s.homework_id);
            return (
              <Link key={s.id} href={`${base}/homework/${s.homework_id}`} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                <span className="flex-1 min-w-0 text-sm font-semibold truncate">{h?.title ?? "Vazifa"}</span>
                {s.status === "graded" && <span className="font-bold text-green text-sm">{s.score ?? "—"}/{h?.points}</span>}
                <Badge tone={SUBMISSION[s.status].tone}>{SUBMISSION[s.status].label}</Badge>
              </Link>
            );
          })}
        </Panel>
        <StudentVocabList studentId={id} groups={myGroups} />
        </div>
      )}

      {tab === "exams" && (l ? <ExamHistory attempts={l.attempts} /> : <Spinner />)}

      {tab === "words" && (
        <Panel>
          {!l || l.wrongWords.length === 0 ? <EmptyState title="Xato qilingan so'z yo'q" /> : l.wrongWords.map((w) => (
            <div key={w.wordId} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
              <div><p className="font-kr font-semibold">{w.koreanWord}</p><p className="text-xs text-muted">{w.uzbekTranslation}</p></div>
              <Badge tone="red">{w.timesWrong} marta xato</Badge>
            </div>
          ))}
        </Panel>
      )}

      {tab === "payments" && (
        <Panel>
          {payments.error ? <p className="text-sm text-muted">To&apos;lov ma&apos;lumotlarini ko&apos;rish huquqi yo&apos;q.</p> : (payments.data ?? []).length === 0 ? <EmptyState title="To'lov kiritilmagan" /> : (payments.data ?? []).map((pay) => (
            <div key={pay.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <span className="w-24 text-sm font-bold">{formatDate(pay.paid_at)}</span>
              <span className="flex-1 text-sm text-muted">{PAYMENT_METHODS[pay.method]} · {formatPeriod(pay.period)}</span>
              <span className="font-bold text-sm">{formatMoney(pay.amount)}</span>
            </div>
          ))}
        </Panel>
      )}

      {tab === "report" && (groups.loading || members.loading ? <Spinner /> : <MonthlyReport studentId={id} studentName={p.full_name} groups={myGroups} />)}

      {isAdmin && (
        <EditProfileModal open={edit} profile={p} phone={phone ?? ""} birth={details.data?.[id]?.birth_date ?? ""} branches={branches.data ?? []} onClose={() => setEdit(false)} onSaved={() => { profile.reload(); details.reload(); }} />
      )}

      <ConfirmDialog
        open={confirm === "delete"} title="Akkauntni o'chirish" confirmLabel="O'chirish" busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(async () => { const r = await deleteUsers([id]); if (r.deleted < 1) throw new Error("Akkaunt o'chirilmadi."); router.push(`${base}/students`); }, "Akkaunt o'chirildi.")}
      >
        <p><b className="text-foreground">{p.full_name}</b> akkaunti va uning barcha ma&apos;lumotlari (progress, imtihon, vazifa, davomat, to&apos;lov) butunlay o&apos;chadi. Qaytarib bo&apos;lmaydi.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "toggle"} title={p.status === "active" ? "Bloklash" : "Faollashtirish"} confirmLabel={p.status === "active" ? "Bloklash" : "Faollashtirish"} busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(async () => { await setUserActive(id, p.status !== "active"); setConfirm(null); profile.reload(); }, p.status === "active" ? "Bloklandi." : "Faollashtirildi.")}
      >
        <p>{p.status === "active" ? `${p.full_name} tizimga kira olmaydi (ma'lumotlari saqlanadi).` : `${p.full_name} yana tizimga kira oladi.`}</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "reset"} title="Parolni tiklash" confirmLabel="Parolni qo'yish" busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run(async () => { setNewPassword(await resetPassword(id, typedPassword.trim() || undefined)); setConfirm(null); setTypedPassword(""); }, "Parol o'zgartirildi.")}
      >
        <p>{p.full_name} uchun yangi parol qo&apos;yiladi. Eski parol ishlamay qoladi.</p>
        <div className="flex gap-1.5 mt-3">
          <input value={typedPassword} onChange={(e) => setTypedPassword(e.target.value)} placeholder="Parol (bo'sh = avtomatik)" autoComplete="off" className="h-10 flex-1 min-w-0 rounded-lg border border-border bg-background px-2.5 text-sm font-mono text-foreground outline-none" />
          <button type="button" aria-label="Parol yaratish" onClick={() => setTypedPassword(randomPassword())} className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-foreground"><Dices size={16} /></button>
        </div>
      </ConfirmDialog>
      <PasswordResultDialog result={newPassword} groupName={myGroups[0]?.name ?? ""} onClose={() => setNewPassword(null)} />
      {void user}
    </Page>
  );
}

async function mySubmissionsOf(studentId: string) {
  // a staff member reads one student's submissions (the database limits it to students they may see)
  return mySubmissions(studentId);
}

// ── edit modal ──────────────────────────────────────────────────────────────
export function EditProfileModal({
  open, profile, phone, birth, branches, onClose, onSaved,
}: {
  open: boolean;
  profile: Profile;
  phone: string;
  birth: string;
  branches: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(profile.full_name);
  const [ph, setPh] = useState(phone);
  const [bd, setBd] = useState(birth);
  const [branch, setBranch] = useState(profile.branch_id ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return toast.error("Ism kiriting.");
    setBusy(true);
    try {
      await updateProfile(profile.id, { full_name: name.trim(), branch_id: branch || null });
      await saveDetails(profile.id, { phone: ph.trim() || null, birth_date: bd || null });
      toast.success("Saqlandi.");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ma'lumotlarni tahrirlash" footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={save} disabled={busy}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button></>}>
      <div className="grid gap-4">
        <Field label="Ism familiya"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Telefon"><Input value={ph} onChange={(e) => setPh(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" /></Field>
        <Field label="Tug'ilgan sana"><Input type="date" value={bd} onChange={(e) => setBd(e.target.value)} /></Field>
        {branches.length > 0 && (
          <Field label="Filial">
            <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Belgilanmagan</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}

void percent; void listSubmissions;
