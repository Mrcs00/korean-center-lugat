"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { Badge, EmptyState, ErrorNote, Field, Input, Modal, Page, PageHeader, Panel, Select, Spinner, Textarea, useLoad } from "@/components/platform/ui";
import { FileUploader, openStoredFile } from "@/components/platform/FileUploader";
import { useToast } from "@/components/platform/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";
import { addMaterial, deleteCourse, deleteMaterial, listCourses, listGroups, listMaterials, saveCourse } from "@/lib/platform/api";
import { formatMoney } from "@/lib/platform/format";
import type { Course, FileRef } from "@/lib/platform/types";

const BOOKS = ["1a", "1b", "2a", "2b", "3a", "3b"];

export function CoursesView() {
  const courses = useLoad(() => listCourses(), []);
  const groups = useLoad(() => listGroups(), []);
  const [form, setForm] = useState<{ open: boolean; course: Course | null }>({ open: false, course: null });

  return (
    <Page wide>
      <PageHeader title="Kurslar" subtitle="O'quv markazidagi kurslar" actions={<Button onClick={() => setForm({ open: true, course: null })}><Plus size={16} /> Kurs qo&apos;shish</Button>} />
      {courses.error && <ErrorNote message={courses.error} onRetry={courses.reload} />}
      {courses.loading ? <Spinner /> : (courses.data ?? []).length === 0 ? <EmptyState icon={BookOpen} title="Kurs yo'q" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(courses.data ?? []).map((c) => {
            const used = (groups.data ?? []).filter((g) => g.course_id === c.id);
            return (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="group rounded-2xl bg-surface border border-border overflow-hidden shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-24 bg-gradient-to-br from-brand to-brand-soft relative">{c.image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}</div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2"><p className="font-extrabold text-lg tracking-tight">{c.name}</p><Badge tone={c.active ? "green" : "gray"}>{c.active ? "Faol" : "Nofaol"}</Badge></div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{c.description || "Tavsif yo'q"}</p>
                  <p className="text-xs text-muted mt-3">{used.length} ta guruh · {c.monthly_price ? `${formatMoney(c.monthly_price)} / oy` : "narx belgilanmagan"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <CourseFormModal open={form.open} course={form.course} onClose={() => setForm({ open: false, course: null })} onSaved={courses.reload} />
    </Page>
  );
}

export function CourseFormModal({ open, course, onClose, onSaved }: { open: boolean; course: Course | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: "", level: "", description: "", duration_weeks: "", image_url: "", monthly_price: "", vocab_book: "", active: true });
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);
  const key = open ? course?.id ?? "new" : null;
  if (key !== seed) {
    setSeed(key);
    if (open) setF({ name: course?.name ?? "", level: course?.level ?? "", description: course?.description ?? "", duration_weeks: course?.duration_weeks ? String(course.duration_weeks) : "", image_url: course?.image_url ?? "", monthly_price: course?.monthly_price ? String(course.monthly_price) : "", vocab_book: course?.vocab_book ?? "", active: course?.active ?? true });
  }
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const problem = f.name.trim().length < 2 ? "Kurs nomini kiriting." : f.monthly_price && Number.isNaN(Number(f.monthly_price)) ? "Narx raqam bo'lsin." : f.duration_weeks && Number.isNaN(Number(f.duration_weeks)) ? "Davomiylik raqam bo'lsin." : null;

  const save = async () => {
    if (problem) return;
    setBusy(true);
    try {
      await saveCourse({ id: course?.id, name: f.name.trim(), level: f.level.trim() || null, description: f.description.trim() || null, duration_weeks: f.duration_weeks ? Number(f.duration_weeks) : null, image_url: f.image_url.trim() || null, monthly_price: f.monthly_price ? Number(f.monthly_price) : 0, vocab_book: f.vocab_book || null, active: f.active });
      toast.success("Saqlandi.");
      onSaved();
      onClose();
    } catch (e) {
      const m = (e as Error).message;
      toast.error(/duplicate|unique/i.test(m) ? "Bu nomli kurs bor." : m);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={course ? "Kursni tahrirlash" : "Yangi kurs"} footer={<><Button variant="secondary" onClick={onClose}>Bekor qilish</Button><Button onClick={save} disabled={busy || Boolean(problem)}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Kurs nomi"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Daraja"><Input value={f.level} onChange={(e) => set("level", e.target.value)} placeholder="1A" /></Field>
        <Field label="Tavsif" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} /></Field>
        <Field label="Davomiyligi (hafta)"><Input inputMode="numeric" value={f.duration_weeks} onChange={(e) => set("duration_weeks", e.target.value)} /></Field>
        <Field label="Oylik narx (so'm)"><Input inputMode="numeric" value={f.monthly_price} onChange={(e) => set("monthly_price", e.target.value)} /></Field>
        <Field label="Lug'at kitobi" hint="O'quvchilar shu kitob lug'atlarini kursda ko'radi."><Select value={f.vocab_book} onChange={(e) => set("vocab_book", e.target.value)}><option value="">Yo&apos;q</option>{BOOKS.map((b) => <option key={b} value={b}>서울대 한국어 {b.toUpperCase()}</option>)}</Select></Field>
        <Field label="Rasm havolasi"><Input value={f.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="h-4 w-4 rounded accent-[var(--brand-dark)] cursor-pointer" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Kurs faol</label>
        {problem && <p className="sm:col-span-2 text-xs text-red">{problem}</p>}
      </div>
    </Modal>
  );
}

export function CourseDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const courses = useLoad(() => listCourses(), []);
  const groups = useLoad(() => listGroups(), []);
  const materials = useLoad(() => listMaterials({ courseId: id }), [id]);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<FileRef[]>([]);
  const c = (courses.data ?? []).find((x) => x.id === id);

  if (courses.loading) return <Page><Spinner /></Page>;
  if (!c) return <Page><EmptyState title="Kurs topilmadi" action={<Link href="/admin/courses" className="text-sm font-semibold text-brand-darker">← Kurslarga qaytish</Link>} /></Page>;
  const used = (groups.data ?? []).filter((g) => g.course_id === id);

  const addMat = async () => {
    if (!user) return;
    if (!title.trim() || (!url.trim() && files.length === 0)) return toast.error("Nom va havola yoki fayl kiriting.");
    try {
      if (url.trim()) await addMaterial({ course_id: id, title: title.trim(), kind: "link", url: url.trim() }, user.id);
      for (const f of files) await addMaterial({ course_id: id, title: files.length > 1 ? `${title.trim()} — ${f.name}` : title.trim(), kind: "file", path: f.path }, user.id);
      setOpen(false); setTitle(""); setUrl(""); setFiles([]);
      materials.reload();
      toast.success("Material qo'shildi.");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Page>
      <PageHeader
        back={<Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> Kurslar</Link>}
        title={c.name}
        subtitle={`${c.level ?? ""}${c.duration_weeks ? ` · ${c.duration_weeks} hafta` : ""}${c.monthly_price ? ` · ${formatMoney(c.monthly_price)} / oy` : ""}`}
        actions={<><Button variant="secondary" size="sm" onClick={() => setEdit(true)}><Pencil size={14} /> Tahrirlash</Button><Button variant="danger" size="sm" onClick={() => setDel(true)}><Trash2 size={14} /> O&apos;chirish</Button></>}
      />
      <div className="grid md:grid-cols-2 gap-6">
        <Panel title="Tavsif"><p className="text-sm whitespace-pre-line text-muted">{c.description || "Tavsif yo'q."}</p>{c.vocab_book && <p className="text-xs mt-3"><Badge tone="brand">Lug&apos;at: 서울대 {c.vocab_book.toUpperCase()}</Badge></p>}</Panel>
        <Panel title={`Guruhlar (${used.length})`}>
          {used.length === 0 ? <p className="text-sm text-muted">Bu kursda guruh yo&apos;q.</p> : used.map((g) => <Link key={g.id} href={`/admin/groups/${g.id}`} className="flex justify-between py-2 border-b border-border last:border-0 text-sm"><span className="font-semibold">{g.name}</span><span className="text-muted">{g.memberCount} ta</span></Link>)}
        </Panel>
        <Panel title="Kurs materiallari" className="md:col-span-2" action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={14} /> Qo&apos;shish</Button>}>
          {(materials.data ?? []).length === 0 ? <p className="text-sm text-muted">Material yo&apos;q. Kursdagi barcha o&apos;quvchilar ko&apos;radi.</p> : (materials.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              {m.kind === "link" ? <LinkIcon size={16} className="text-muted" /> : <FileText size={16} className="text-muted" />}
              <button className="flex-1 min-w-0 text-left text-sm font-semibold truncate" onClick={() => (m.kind === "link" && m.url ? window.open(m.url, "_blank", "noopener") : m.path ? openStoredFile(m.path) : undefined)}>{m.title}</button>
              <button aria-label="O'chirish" onClick={() => deleteMaterial(m.id).then(materials.reload)} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button>
            </div>
          ))}
        </Panel>
      </div>
      <CourseFormModal open={edit} course={c} onClose={() => setEdit(false)} onSaved={courses.reload} />
      <ConfirmDialog open={del} title="Kursni o'chirish" confirmLabel="O'chirish" onCancel={() => setDel(false)} onConfirm={async () => { try { await deleteCourse(id); toast.success("Kurs o'chirildi."); router.push("/admin/courses"); } catch (e) { toast.error((e as Error).message); } }}>
        <p><b className="text-foreground">{c.name}</b> kursi o&apos;chadi. Guruhlar saqlanadi, lekin kurssiz qoladi.</p>
      </ConfirmDialog>
      <Modal open={open} onClose={() => setOpen(false)} title="Kurs materiali" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button><Button onClick={addMat}>Saqlash</Button></>}>
        <div className="grid gap-4">
          <Field label="Nomi"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Havola (ixtiyoriy)"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
          <div><p className="text-xs font-semibold text-muted mb-2">Fayl (ixtiyoriy)</p><FileUploader value={files} onChange={setFiles} prefix={`mat/c/${id}`} /></div>
        </div>
      </Modal>
    </Page>
  );
}
