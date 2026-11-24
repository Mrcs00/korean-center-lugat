"use client";

import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/teacher/ConfirmDialog";
import { EmptyState, ErrorNote, Field, Input, Modal, Page, PageHeader, Panel, Select, Spinner, Textarea, Badge, useLoad } from "@/components/platform/ui";
import { useToast } from "@/components/platform/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSettings } from "@/lib/platform/settings";
import { addAnnouncement, deleteAnnouncement, listAnnouncements, type GroupFull } from "@/lib/platform/api";
import { formatDateTime } from "@/lib/platform/format";
import type { Announcement, AnnouncementAudience } from "@/lib/platform/types";
import type { StaffRole } from "@/lib/platform/staff";

const AUDIENCE: Record<AnnouncementAudience, string> = {
  all_students: "Barcha o'quvchilar",
  group: "Guruh",
  teachers: "Ustozlar",
  everyone: "Hamma",
};

// Panel with the list + the "new announcement" form (used on its own page and inside a group).
export function AnnouncementsPanel({ role, groups, fixedGroupId }: { role: StaffRole; groups: GroupFull[]; fixedGroupId?: string }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const list = useLoad(() => listAnnouncements(100), []);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>(role === "admin" && !fixedGroupId ? "all_students" : "group");
  const [groupId, setGroupId] = useState(fixedGroupId ?? groups[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const canTeacherPost = role === "admin" || settings.teacher_announcements;
  const rows = (list.data ?? []).filter((a) => !fixedGroupId || a.group_id === fixedGroupId);

  const create = async () => {
    if (!user) return;
    if (title.trim().length < 2 || body.trim().length < 2) return toast.error("Sarlavha va matnni kiriting.");
    if (audience === "group" && !groupId) return toast.error("Guruhni tanlang.");
    setBusy(true);
    try {
      await addAnnouncement({ title: title.trim(), body: body.trim(), image_url: image.trim() || null, audience, group_id: audience === "group" ? groupId : null }, user.id);
      toast.success("E'lon yuborildi.");
      setOpen(false); setTitle(""); setBody(""); setImage("");
      list.reload();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {canTeacherPost ? <Button onClick={() => setOpen(true)}><Plus size={16} /> Yangi e&apos;lon</Button> : <p className="text-xs text-muted">Admin e&apos;lon berishni o&apos;chirib qo&apos;ygan.</p>}
      </div>
      {list.error && <ErrorNote message={list.error} />}
      {list.loading ? <Spinner /> : rows.length === 0 ? <EmptyState icon={Megaphone} title="E'lon yo'q" /> : (
        <div className="flex flex-col gap-3">
          {rows.map((a) => (
            <Panel key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{a.title}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDateTime(a.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone="brand">{a.audience === "group" ? groups.find((g) => g.id === a.group_id)?.name ?? "Guruh" : AUDIENCE[a.audience]}</Badge>
                  {(role === "admin" || a.created_by === user?.id) && (
                    <button aria-label="O'chirish" onClick={() => setToDelete(a)} className="h-8 w-8 rounded-lg hover:bg-red-soft hover:text-red flex items-center justify-center text-muted"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
              <p className="text-sm mt-3 whitespace-pre-line">{a.body}</p>
              {a.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.image_url} alt="" className="mt-3 rounded-xl max-h-64 object-cover" />
              )}
            </Panel>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi e'lon" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Bekor qilish</Button><Button onClick={create} disabled={busy}>{busy ? "Yuborilmoqda..." : "Yuborish"}</Button></>}>
        <div className="grid gap-4">
          <Field label="Kimga">
            <Select value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)} disabled={role !== "admin" || Boolean(fixedGroupId)}>
              {role === "admin" && <><option value="all_students">Barcha o&apos;quvchilar</option><option value="teachers">Ustozlar</option><option value="everyone">Hamma</option></>}
              <option value="group">Bitta guruh</option>
            </Select>
          </Field>
          {audience === "group" && (
            <Field label="Guruh">
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={Boolean(fixedGroupId)}>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Sarlavha"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Matn"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} /></Field>
          <Field label="Rasm havolasi (ixtiyoriy)"><Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." /></Field>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="E'lonni o'chirish" confirmLabel="O'chirish" onCancel={() => setToDelete(null)}
        onConfirm={async () => { if (!toDelete) return; try { await deleteAnnouncement(toDelete.id); setToDelete(null); list.reload(); toast.success("O'chirildi."); } catch (e) { toast.error((e as Error).message); } }}>
        <p>“{toDelete?.title}” e&apos;loni o&apos;chadi.</p>
      </ConfirmDialog>
    </div>
  );
}

export function AnnouncementsView({ role, groups }: { role: StaffRole; groups: GroupFull[] }) {
  return (
    <Page>
      <PageHeader title="E'lonlar" subtitle={role === "admin" ? "Markaz e'lonlari" : "Guruhlaringizga e'lon bering"} />
      <AnnouncementsPanel role={role} groups={groups} />
    </Page>
  );
}
