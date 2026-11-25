"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, Dices, KeyRound, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { AddAccountsDialog } from "@/components/platform/AddAccountsDialog";
import { PasswordResultDialog } from "@/components/platform/PasswordResultDialog";
import { DataTable } from "@/components/platform/DataTable";
import { useToast } from "@/components/platform/Toast";
import { Avatar, Badge, EmptyState, ErrorNote, Field, FilterChips, Input, Modal, Page, PageHeader, Panel, Select, Spinner, StatCard, Tabs, Textarea, useLoad } from "@/components/platform/ui";
import { BarChart, Donut } from "@/components/platform/charts";
import { EditProfileModal } from "./StudentViews";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSettings, type Settings } from "@/lib/platform/settings";
import {
  addPayment, allMemberships, deleteBranch, deletePayment, deleteUsers, getDetailsMap, getProfile, listBranches, listProfiles, resetPassword,
  saveBranch, saveSettings, setUserActive, listAttendance, attendanceRate, type GroupFull,
} from "@/lib/platform/api";
import { loadDebtors } from "@/lib/platform/debtors";
import { groupPrice } from "@/lib/platform/billingFor";
import { GROUP_STATUS, MONTHS_UZ, PAYMENT_METHODS, WEEKDAYS_SHORT } from "@/lib/platform/labels";
import { formatDate, formatMoney, formatPeriod, timeRange } from "@/lib/platform/format";
import { monthOfKey, shiftMonth, tashkentDateKey } from "@/lib/utils/dates";
import { displayLogin } from "@/lib/utils/usernames";
import { randomPassword } from "@/lib/utils/passwords";
import type { Branch, Payment, PaymentMethod, Profile } from "@/lib/platform/types";

// ── teachers ────────────────────────────────────────────────────────────────
export function TeachersListView({ groups }: { groups: GroupFull[] }) {
  const router = useRouter();
  const teachers = useLoad(() => listProfiles("teacher"), []);
  const details = useLoad(() => getDetailsMap(), []);
  const [adding, setAdding] = useState(false);
  const taught = (id: string) => groups.filter((g) => g.teacher_id === id);

  return (
    <Page wide>
      <PageHeader title="Ustozlar" subtitle="Markaz ustozlari" actions={<Button onClick={() => setAdding(true)}><Plus size={16} /> Ustoz qo&apos;shish</Button>} />
      {teachers.error && <ErrorNote message={teachers.error} onRetry={teachers.reload} />}
      {teachers.loading ? <Spinner /> : (
        <DataTable<Profile>
          rows={teachers.data ?? []}
          rowKey={(p) => p.id}
          searchText={(p) => `${p.full_name} ${p.username} ${details.data?.[p.id]?.phone ?? ""}`}
          onRowClick={(p) => router.push(`/admin/teachers/${p.id}`)}
          empty={<EmptyState title="Ustoz yo'q" text="“Ustoz qo'shish” tugmasi bilan yangi ustoz akkauntini yarating." />}
          columns={[
            { key: "name", header: "Ustoz", sortValue: (p) => p.full_name, render: (p) => <div className="flex items-center gap-3 min-w-0"><Avatar name={p.full_name} size={36} /><div className="min-w-0"><p className="font-semibold truncate">{p.full_name}</p><p className="text-xs text-muted truncate">{displayLogin(p.username)}</p></div></div> },
            { key: "phone", header: "Telefon", render: (p) => details.data?.[p.id]?.phone || <span className="text-muted-soft">—</span> },
            { key: "groups", header: "Guruhlar", render: (p) => taught(p.id).length },
            { key: "students", header: "O'quvchilar", render: (p) => taught(p.id).reduce((s, g) => s + g.memberCount, 0) },
            { key: "status", header: "Holat", render: (p) => <Badge tone={p.status === "active" ? "green" : "red"}>{p.status === "active" ? "Faol" : "Nofaol"}</Badge> },
          ]}
        />
      )}
      <AddAccountsDialog open={adding} role="teacher" onClose={() => setAdding(false)} onCreated={() => { teachers.reload(); details.reload(); }} />
    </Page>
  );
}

export function TeacherDetailView({ id, groups, reloadGroups }: { id: string; groups: GroupFull[]; reloadGroups: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const profile = useLoad(() => getProfile(id), [id]);
  const details = useLoad(() => getDetailsMap([id]), [id]);
  const branches = useLoad(() => listBranches(), []);
  const att = useLoad(() => listAttendance({ groupIds: groups.filter((g) => g.teacher_id === id).map((g) => g.id) }), [id, groups.length]);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "toggle" | "reset">(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState<{ fullName: string; username: string; password: string } | null>(null);

  if (profile.loading) return <Page><Spinner /></Page>;
  const p = profile.data;
  if (!p || p.role !== "teacher") return <Page><EmptyState title="Ustoz topilmadi" action={<Link href="/admin/teachers" className="text-sm font-semibold text-brand-darker">← Ustozlarga qaytish</Link>} /></Page>;
  const mine = groups.filter((g) => g.teacher_id === id);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Page>
      <PageHeader
        back={<Link href="/admin/teachers" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Ustozlar</Link>}
        title={p.full_name}
        subtitle={`${displayLogin(p.username)}${details.data?.[id]?.phone ? ` · ${details.data[id].phone}` : ""}`}
        actions={<><Badge tone={p.status === "active" ? "green" : "red"}>{p.status === "active" ? "Faol" : "Nofaol"}</Badge><Button variant="secondary" size="sm" onClick={() => setEdit(true)}><Pencil size={14} /> Tahrirlash</Button></>}
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Wallet} label="Guruhlar" value={mine.length} tone="brand" />
        <StatCard icon={Wallet} label="O'quvchilar" value={mine.reduce((s, g) => s + g.memberCount, 0)} tone="blue" />
        <StatCard icon={Wallet} label="Davomat" value={(att.data ?? []).length ? `${attendanceRate(att.data ?? [])}%` : "—"} tone="green" />
      </div>
      <div className="flex flex-col gap-6">
        <Panel title="Guruhlari">
          {mine.length === 0 ? <p className="text-sm text-muted">Guruh biriktirilmagan. Guruh sahifasida “Tahrirlash” orqali ustozni tanlang.</p> : mine.map((g) => (
            <Link key={g.id} href={`/admin/groups/${g.id}`} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
              <div className="min-w-0"><p className="font-semibold text-sm truncate">{g.name}</p><p className="text-xs text-muted">{g.lesson_days.map((d) => WEEKDAYS_SHORT[d - 1]).join(", ")} {timeRange(g.start_time, g.end_time)} · {g.memberCount} ta o&apos;quvchi</p></div>
              <Badge tone={GROUP_STATUS[g.status].tone}>{GROUP_STATUS[g.status].label}</Badge>
            </Link>
          ))}
        </Panel>
        <Panel title="Akkaunt">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { setTyped(""); setConfirm("reset"); }}><KeyRound size={15} /> Parolni tiklash</Button>
            <Button variant="secondary" onClick={() => setConfirm("toggle")}>{p.status === "active" ? <><Ban size={15} /> Bloklash</> : <><CheckCircle2 size={15} /> Faollashtirish</>}</Button>
            <Button variant="danger" onClick={() => setConfirm("delete")}><Trash2 size={15} /> O&apos;chirish</Button>
          </div>
        </Panel>
      </div>

      <EditProfileModal open={edit} profile={p} phone={details.data?.[id]?.phone ?? ""} birth={details.data?.[id]?.birth_date ?? ""} branches={branches.data ?? []} onClose={() => setEdit(false)} onSaved={() => { profile.reload(); details.reload(); }} />
      <ConfirmDialog open={confirm === "delete"} title="Ustozni o'chirish" confirmLabel="O'chirish" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => run(async () => { await deleteUsers([id]); reloadGroups(); router.push("/admin/teachers"); }, "Ustoz o'chirildi.")}>
        <p><b className="text-foreground">{p.full_name}</b> akkaunti o&apos;chadi. Uning guruhlari ustozsiz qoladi (guruh va o&apos;quvchilar saqlanadi).</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "toggle"} title={p.status === "active" ? "Bloklash" : "Faollashtirish"} confirmLabel={p.status === "active" ? "Bloklash" : "Faollashtirish"} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => run(async () => { await setUserActive(id, p.status !== "active"); setConfirm(null); profile.reload(); }, "Bajarildi.")}>
        <p>{p.status === "active" ? "Ustoz tizimga kira olmaydi." : "Ustoz yana tizimga kira oladi."}</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "reset"} title="Parolni tiklash" confirmLabel="Parolni qo'yish" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => run(async () => { setPw(await resetPassword(id, typed.trim() || undefined)); setConfirm(null); setTyped(""); }, "Parol o'zgartirildi.")}>
        <p>{p.full_name} uchun yangi parol qo&apos;yiladi.</p>
        <div className="flex gap-1.5 mt-3"><input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Parol (bo'sh = avtomatik)" autoComplete="off" className="h-10 flex-1 min-w-0 rounded-lg border border-border bg-background px-2.5 text-sm font-mono text-foreground outline-none" /><button type="button" aria-label="Parol yaratish" onClick={() => setTyped(randomPassword())} className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-foreground"><Dices size={16} /></button></div>
      </ConfirmDialog>
      <PasswordResultDialog result={pw} groupName="" onClose={() => setPw(null)} />
    </Page>
  );
}

// ── payments ────────────────────────────────────────────────────────────────
type PayTab = "history" | "debtors" | "reports";

export function PaymentsView({ groups }: { groups: GroupFull[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const today = tashkentDateKey();
  const [tab, setTab] = useState<PayTab>("history");
  const students = useLoad(() => listProfiles("student"), []);
  const members = useLoad(() => allMemberships(), []);
  const debt = useLoad(() => loadDebtors(settings.payment_due_day), [settings.payment_due_day]);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Payment | null>(null);
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");

  const payments = debt.data?.payments ?? [];
  const nameOf = (id: string) => (students.data ?? []).find((s) => s.id === id)?.full_name ?? "—";
  const paid = payments.filter((p) => p.status === "paid");
  const sum = (list: Payment[]) => list.reduce((s, p) => s + Number(p.amount), 0);
  const todayTotal = sum(paid.filter((p) => p.paid_at === today));
  const monthTotal = sum(paid.filter((p) => p.paid_at.slice(0, 7) === monthOfKey(today)));
  const yearTotal = sum(paid.filter((p) => p.paid_at.slice(0, 4) === today.slice(0, 4)));
  const months = Array.from({ length: 12 }, (_, i) => shiftMonth(monthOfKey(today), i - 11));
  const monthly = months.map((m) => ({ label: MONTHS_UZ[Number(m.slice(5)) - 1].slice(0, 3), value: sum(paid.filter((p) => p.paid_at.slice(0, 7) === m)) }));
  const byMethod = (Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m, i) => ({ label: PAYMENT_METHODS[m], value: paid.filter((p) => p.method === m).length, color: ["var(--green)", "var(--blue)", "var(--amber)", "var(--brand-darker)", "var(--muted-soft)"][i] })).filter((x) => x.value > 0);

  const rows = payments.filter((p) => (methodFilter === "all" || p.method === methodFilter) && (statusFilter === "all" || p.status === statusFilter));

  return (
    <Page wide>
      <PageHeader title="To'lovlar" subtitle="To'lovlarni kiriting, qarzdorlarni kuzating" actions={<Button onClick={() => setAdding(true)}><Plus size={16} /> To&apos;lov qo&apos;shish</Button>} />
      {(debt.error || students.error) && <ErrorNote message={(debt.error ?? students.error) as string} onRetry={debt.reload} />}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Wallet} label="Bugun" value={formatMoney(todayTotal)} tone="green" />
        <StatCard icon={Wallet} label="Shu oy" value={formatMoney(monthTotal)} tone="brand" />
        <StatCard icon={Wallet} label="Shu yil" value={formatMoney(yearTotal)} tone="blue" />
        <StatCard icon={Wallet} label="Qarzdorlik" value={formatMoney((debt.data?.debtors ?? []).reduce((s, d) => s + d.debt, 0))} hint={`${debt.data?.debtors.length ?? 0} ta o'quvchi`} tone="red" />
      </div>
      <Tabs<PayTab> value={tab} onChange={setTab} tabs={[{ id: "history", label: "Tarix", count: payments.length }, { id: "debtors", label: "Qarzdorlar", count: debt.data?.debtors.length }, { id: "reports", label: "Hisobotlar" }]} />

      {debt.loading ? <Spinner /> : tab === "history" ? (
        <>
          <div className="flex flex-col gap-3 mb-4">
            <FilterChips value={methodFilter} onChange={setMethodFilter} options={[{ id: "all" as const, label: "Barcha usullar" }, ...(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => ({ id: m, label: PAYMENT_METHODS[m] }))]} />
            <FilterChips value={statusFilter} onChange={setStatusFilter} options={[{ id: "all", label: "Hammasi" }, { id: "paid", label: "To'langan" }, { id: "pending", label: "Kutilmoqda" }]} />
          </div>
          <DataTable<Payment>
            rows={rows}
            rowKey={(p) => p.id}
            searchText={(p) => `${nameOf(p.student_id)} ${p.note ?? ""}`}
            searchPlaceholder="O'quvchi bo'yicha qidirish..."
            empty={<EmptyState icon={Wallet} title="To'lov yo'q" />}
            columns={[
              { key: "date", header: "Sana", sortValue: (p) => p.paid_at, render: (p) => formatDate(p.paid_at) },
              { key: "student", header: "O'quvchi", render: (p) => <Link href={`/admin/students/${p.student_id}`} className="font-semibold hover:underline">{nameOf(p.student_id)}</Link> },
              { key: "period", header: "Oy", render: (p) => formatPeriod(p.period) },
              { key: "method", header: "Usul", render: (p) => PAYMENT_METHODS[p.method] },
              { key: "amount", header: "Summa", sortValue: (p) => Number(p.amount), render: (p) => <b>{formatMoney(p.amount)}</b> },
              { key: "status", header: "Holat", render: (p) => <Badge tone={p.status === "paid" ? "green" : "amber"}>{p.status === "paid" ? "To'langan" : "Kutilmoqda"}</Badge> },
              { key: "x", header: "", render: (p) => <button aria-label="O'chirish" onClick={() => setToDelete(p)} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button> },
            ]}
          />
        </>
      ) : tab === "debtors" ? (
        <DataTable
          rows={debt.data?.debtors ?? []}
          rowKey={(d) => d.profile.id}
          searchText={(d) => d.profile.full_name}
          onRowClick={(d) => router.push(`/admin/students/${d.profile.id}`)}
          empty={<EmptyState title="Qarzdor yo'q 🎉" />}
          columns={[
            { key: "name", header: "O'quvchi", render: (d) => <span className="font-semibold">{d.profile.full_name}</span> },
            { key: "groups", header: "Guruh", render: (d) => d.groups.join(", ") },
            { key: "last", header: "Oxirgi to'lov", render: (d) => formatDate(d.lastPaid) },
            { key: "debt", header: "Qarz", sortValue: (d) => d.debt, render: (d) => <b className="text-red">{formatMoney(d.debt)}</b> },
          ]}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Oylik tushum (12 oy)"><BarChart data={monthly} format={formatMoney} /></Panel>
          <Panel title="To'lov usullari">{byMethod.length === 0 ? <p className="text-sm text-muted">To&apos;lov yo&apos;q.</p> : <Donut data={byMethod} />}</Panel>
        </div>
      )}

      <AddPaymentModal open={adding} students={(students.data ?? []).filter((s) => s.status === "active")} members={members.data ?? []} groups={groups} userId={user?.id ?? ""} onClose={() => setAdding(false)} onSaved={debt.reload} />
      <ConfirmDialog open={Boolean(toDelete)} title="To'lovni o'chirish" confirmLabel="O'chirish" onCancel={() => setToDelete(null)} onConfirm={async () => { if (!toDelete) return; try { await deletePayment(toDelete.id); setToDelete(null); debt.reload(); toast.success("O'chirildi."); } catch (e) { toast.error((e as Error).message); } }}>
        <p>{toDelete && `${nameOf(toDelete.student_id)} — ${formatMoney(toDelete.amount)} (${formatPeriod(toDelete.period)}) to'lovi o'chadi.`}</p>
      </ConfirmDialog>
    </Page>
  );
}

function AddPaymentModal({ open, students, members, groups, userId, onClose, onSaved }: { open: boolean; students: Profile[]; members: { group_id: string; student_id: string; joined_at: string }[]; groups: GroupFull[]; userId: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const today = tashkentDateKey();
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [period, setPeriod] = useState(monthOfKey(today));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const myGroups = groups.filter((g) => members.some((m) => m.student_id === studentId && m.group_id === g.id));
  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 50);
  const amt = Number(amount.replace(/\s/g, ""));
  const problem = !studentId ? "O'quvchini tanlang." : !(amt > 0) ? "Summani kiriting." : !/^\d{4}-\d{2}$/.test(period) ? "Oyni tanlang." : null;

  const pickStudent = (id: string) => {
    setStudentId(id);
    const gs = groups.filter((g) => members.some((m) => m.student_id === id && m.group_id === g.id));
    setGroupId(gs[0]?.id ?? "");
    if (gs[0] && !amount) setAmount(String(groupPrice(gs[0]) || ""));
  };

  const save = async () => {
    if (problem) return;
    setBusy(true);
    try {
      await addPayment({ student_id: studentId, group_id: groupId || null, amount: amt, paid_at: date, method, status, period, note: note.trim() || null }, userId);
      toast.success("To'lov qo'shildi.");
      onSaved();
      setAmount(""); setNote("");
      onClose();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="To'lov qo'shish" footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={save} disabled={busy || Boolean(problem)}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="O'quvchi" className="sm:col-span-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ism bo'yicha qidirish..." />
          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
            {filtered.map((s) => <button key={s.id} type="button" onClick={() => pickStudent(s.id)} className={`w-full text-left px-3 py-2 text-sm ${studentId === s.id ? "bg-brand-soft font-bold" : "hover:bg-black/[0.03]"}`}>{s.full_name}</button>)}
            {filtered.length === 0 && <p className="p-3 text-sm text-muted">Topilmadi.</p>}
          </div>
        </Field>
        <Field label="Guruh"><Select value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="">Guruhsiz</option>{myGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
        <Field label="Qaysi oy uchun"><Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} /></Field>
        <Field label="Summa (so'm)"><Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500000" /></Field>
        <Field label="To'lov sanasi"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Usul"><Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_METHODS[m]}</option>)}</Select></Field>
        <Field label="Holat"><Select value={status} onChange={(e) => setStatus(e.target.value as "paid" | "pending")}><option value="paid">To&apos;langan</option><option value="pending">Kutilmoqda</option></Select></Field>
        <Field label="Izoh" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="min-h-[44px]" /></Field>
        {problem && <p className="sm:col-span-2 text-xs text-red">{problem}</p>}
      </div>
    </Modal>
  );
}

// ── branches ────────────────────────────────────────────────────────────────
export function BranchesView({ groups }: { groups: GroupFull[] }) {
  const toast = useToast();
  const branches = useLoad(() => listBranches(), []);
  const students = useLoad(() => listProfiles("student"), []);
  const [form, setForm] = useState<{ open: boolean; branch: Branch | null }>({ open: false, branch: null });
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  return (
    <Page>
      <PageHeader title="Filiallar" subtitle="Markaz filiallari" actions={<Button onClick={() => setForm({ open: true, branch: null })}><Plus size={16} /> Filial qo&apos;shish</Button>} />
      {branches.error && <ErrorNote message={branches.error} onRetry={branches.reload} />}
      {branches.loading ? <Spinner /> : (branches.data ?? []).length === 0 ? <EmptyState title="Filial yo'q" text="Bitta filial bo'lsa, qo'shish shart emas." /> : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(branches.data ?? []).map((b) => (
            <Panel key={b.id}>
              <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{b.name}</p><p className="text-xs text-muted mt-0.5">{b.address || "Manzil yo'q"}{b.phone ? ` · ${b.phone}` : ""}</p></div><Badge tone={b.active ? "green" : "gray"}>{b.active ? "Faol" : "Nofaol"}</Badge></div>
              <p className="text-xs text-muted mt-3">{groups.filter((g) => g.branch_id === b.id).length} ta guruh · {(students.data ?? []).filter((s) => s.branch_id === b.id).length} ta o&apos;quvchi</p>
              <div className="flex gap-2 mt-3"><Button size="sm" variant="secondary" onClick={() => setForm({ open: true, branch: b })}><Pencil size={13} /> Tahrirlash</Button><Button size="sm" variant="danger" onClick={() => setToDelete(b)}><Trash2 size={13} /> O&apos;chirish</Button></div>
            </Panel>
          ))}
        </div>
      )}
      <BranchForm open={form.open} branch={form.branch} onClose={() => setForm({ open: false, branch: null })} onSaved={branches.reload} />
      <ConfirmDialog open={Boolean(toDelete)} title="Filialni o'chirish" confirmLabel="O'chirish" onCancel={() => setToDelete(null)} onConfirm={async () => { if (!toDelete) return; try { await deleteBranch(toDelete.id); setToDelete(null); branches.reload(); toast.success("O'chirildi."); } catch (e) { toast.error((e as Error).message); } }}>
        <p>“{toDelete?.name}” filiali o&apos;chadi. Guruh va o&apos;quvchilar saqlanadi.</p>
      </ConfirmDialog>
    </Page>
  );
}

function BranchForm({ open, branch, onClose, onSaved }: { open: boolean; branch: Branch | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", address: "", phone: "", active: true });
  const [seed, setSeed] = useState<string | null>(null);
  const key = open ? branch?.id ?? "new" : null;
  if (key !== seed) { setSeed(key); if (open) setF({ name: branch?.name ?? "", address: branch?.address ?? "", phone: branch?.phone ?? "", active: branch?.active ?? true }); }
  const save = async () => {
    if (f.name.trim().length < 2) return toast.error("Filial nomini kiriting.");
    try { await saveBranch({ id: branch?.id, name: f.name.trim(), address: f.address.trim() || null, phone: f.phone.trim() || null, active: f.active }); toast.success("Saqlandi."); onSaved(); onClose(); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <Modal open={open} onClose={onClose} title={branch ? "Filialni tahrirlash" : "Yangi filial"} footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={save}>Saqlash</Button></>}>
      <div className="grid gap-4">
        <Field label="Nomi"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Manzil"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 rounded accent-[var(--brand-dark)] cursor-pointer" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Faol</label>
      </div>
    </Modal>
  );
}

// ── settings ────────────────────────────────────────────────────────────────
function Toggle<K extends keyof Settings>({ s, set, k, label, hint }: { s: Settings; set: (k: K, v: Settings[K]) => void; k: K; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0 cursor-pointer">
      <span><span className="text-sm font-semibold block">{label}</span>{hint && <span className="text-xs text-muted">{hint}</span>}</span>
      <input type="checkbox" className="mt-1 h-5 w-5 rounded accent-[var(--brand-dark)] cursor-pointer" checked={Boolean(s[k])} onChange={(e) => set(k, e.target.checked as Settings[K])} />
    </label>
  );
}

export function SettingsView() {
  const toast = useToast();
  const { settings, reload } = useSettings();
  const [s, setS] = useState<Settings>(settings);
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState(settings);
  if (settings !== seed) { setSeed(settings); setS(settings); }
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(s.accent_color)) return toast.error("Rang #RRGGBB ko'rinishida bo'lsin (masalan #FEDD00).");
    const day = Number(s.payment_due_day);
    if (!(day >= 1 && day <= 28)) return toast.error("To'lov kuni 1 dan 28 gacha bo'lsin.");
    setBusy(true);
    try { await saveSettings({ ...s, payment_due_day: day, default_lesson_minutes: Number(s.default_lesson_minutes) || 90 }); await reload(); toast.success("Sozlamalar saqlandi."); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Page>
      <PageHeader title="Sozlamalar" actions={<Button onClick={save} disabled={busy}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button>} />
      <div className="flex flex-col gap-6">
        <Panel title="Platforma">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Platforma nomi"><Input value={s.platform_name} onChange={(e) => set("platform_name", e.target.value)} /></Field>
            <Field label="Logo havolasi" hint="Bo'sh bo'lsa, standart belgi ko'rinadi."><Input value={s.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." /></Field>
            <Field label="Asosiy rang (sariq)" hint="Tugmalar va belgilar rangi."><div className="flex items-center gap-3"><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(s.accent_color) ? s.accent_color : "#FEDD00"} onChange={(e) => set("accent_color", e.target.value.toUpperCase())} className="h-11 w-14 rounded-lg border border-border bg-transparent" /><Input value={s.accent_color} onChange={(e) => set("accent_color", e.target.value)} /></div></Field>
          </div>
        </Panel>
        <Panel title="Aloqa ma'lumotlari (o'quvchilar ko'radi)">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Telefon"><Input value={s.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} inputMode="tel" /></Field>
            <Field label="Telegram"><Input value={s.contact_telegram} onChange={(e) => set("contact_telegram", e.target.value)} placeholder="@koreancenter_kc" /></Field>
            <Field label="Manzil" className="sm:col-span-2"><Input value={s.contact_address} onChange={(e) => set("contact_address", e.target.value)} /></Field>
          </div>
        </Panel>
        <Panel title="To'lov va darslar">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Oylik to'lov kuni" hint="Shu kundan keyin to'lanmagan oy qarz hisoblanadi."><Input inputMode="numeric" value={String(s.payment_due_day)} onChange={(e) => set("payment_due_day", e.target.value as never)} /></Field>
            <Field label="Standart dars davomiyligi (daqiqa)"><Input inputMode="numeric" value={String(s.default_lesson_minutes)} onChange={(e) => set("default_lesson_minutes", e.target.value as never)} /></Field>
          </div>
        </Panel>
        <Panel title="Rol huquqlari">
          <Toggle s={s} set={set} k="teacher_announcements" label="Ustozlar o'z guruhiga e'lon bera oladi" />
          <Toggle s={s} set={set} k="teacher_view_payments" label="Ustozlar o'z o'quvchilarining to'lovlarini ko'ra oladi" hint="Odatda o'chiq: to'lov ma'lumoti faqat admin uchun." />
        </Panel>
        <Panel title="Bildirishnomalar">
          <Toggle s={s} set={set} k="notify_homework" label="Yangi vazifa haqida" />
          <Toggle s={s} set={set} k="notify_grade" label="Vazifa baholanganda" />
          <Toggle s={s} set={set} k="notify_announcement" label="Yangi e'lon haqida" />
          <Toggle s={s} set={set} k="notify_payment" label="To'lov qabul qilinganda" />
          <Toggle s={s} set={set} k="notify_group_change" label="Guruh o'zgarganda" />
        </Panel>
      </div>
    </Page>
  );
}
