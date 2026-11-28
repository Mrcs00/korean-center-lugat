"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Modal, Select, Textarea } from "@/components/platform/ui";
import { FileUploader } from "@/components/platform/FileUploader";
import { useToast } from "@/components/platform/Toast";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listMembers, saveHomework, type GroupFull, type Member } from "@/lib/platform/api";
import { HOMEWORK_TYPES } from "@/lib/platform/labels";
import { isoToTashkentInput, tashkentInputToIso } from "@/lib/platform/format";
import type { FileRef, Homework, HomeworkType } from "@/lib/platform/types";
import { groupLabeler } from "@/lib/platform/groupLabel";

export function HomeworkFormModal({
  open,
  groups,
  groupId,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean;
  groups: GroupFull[];
  groupId?: string;
  existing?: Homework | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [group, setGroup] = useState(groupId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<HomeworkType>("written");
  const [points, setPoints] = useState("100");
  const [due, setDue] = useState("");
  const [files, setFiles] = useState<FileRef[]>([]);
  const [targeted, setTargeted] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);

  // load the form each time it opens
  useEffect(() => {
    if (!open) return;
    setGroup(existing?.group_id ?? groupId ?? groups[0]?.id ?? "");
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setType(existing?.type ?? "written");
    setPoints(String(existing?.points ?? 100));
    setDue(isoToTashkentInput(existing?.due_at));
    setFiles(existing?.attachments ?? []);
    setTargeted(Boolean(existing?.student_ids));
    setChosen(existing?.student_ids ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  useEffect(() => {
    if (!open || !group) return;
    let cancelled = false;
    listMembers(group).then((m) => !cancelled && setMembers(m)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, group]);

  const pts = Number(points);
  const problem = !group ? "Guruhni tanlang." : title.trim().length < 2 ? "Sarlavha kiriting." : !(pts > 0 && pts <= 1000) ? "Ball 1 dan 1000 gacha bo'lsin." : targeted && chosen.length === 0 ? "Kamida bitta o'quvchini tanlang." : null;

  const save = async () => {
    if (problem || !user) return;
    setBusy(true);
    try {
      await saveHomework(
        {
          id: existing?.id,
          group_id: group,
          title: title.trim(),
          description: description.trim() || null,
          type,
          points: pts,
          due_at: tashkentInputToIso(due),
          attachments: files,
          student_ids: targeted ? chosen : null,
        },
        user.id
      );
      toast.success(existing ? "Vazifa yangilandi." : "Vazifa yuborildi.");
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
      title={existing ? "Vazifani tahrirlash" : "Yangi vazifa"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={save} disabled={busy || Boolean(problem)}>{busy ? "Saqlanmoqda..." : existing ? "Saqlash" : "Vazifa berish"}</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Guruh">
          <Select value={group} onChange={(e) => { setGroup(e.target.value); setChosen([]); }} disabled={Boolean(existing)}>
            {groups.map((g, _i, all) => (
              <option key={g.id} value={g.id}>{groupLabeler(all)(g)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vazifa turi">
          <Select value={type} onChange={(e) => setType(e.target.value as HomeworkType)}>
            {(Object.keys(HOMEWORK_TYPES) as HomeworkType[]).map((t) => (
              <option key={t} value={t}>{HOMEWORK_TYPES[t]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Sarlavha" className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: 3-dars grammatikasi" />
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Vazifa shartlari..." />
        </Field>
        <Field label="Muddat (Toshkent vaqti)">
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Maksimal ball">
          <Input inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
        </Field>

        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-muted mb-2">Kimga?</p>
          <div className="flex gap-2 mb-2">
            {[false, true].map((t) => (
              <button
                key={String(t)}
                type="button"
                onClick={() => setTargeted(t)}
                className={`px-3.5 py-2 rounded-xl border-2 text-xs font-semibold ${targeted === t ? "border-brand bg-brand-soft" : "border-border"}`}
              >
                {t ? "Tanlangan o'quvchilar" : "Butun guruh"}
              </button>
            ))}
          </div>
          {targeted && (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border">
              {members.length === 0 && <p className="text-sm text-muted p-3">Guruhda o&apos;quvchi yo&apos;q.</p>}
              {members.map((m) => (
                <label key={m.student_id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-[var(--brand-dark)] cursor-pointer"
                    checked={chosen.includes(m.student_id)}
                    onChange={(e) => setChosen((prev) => (e.target.checked ? [...prev, m.student_id] : prev.filter((x) => x !== m.student_id)))}
                  />
                  {m.profile?.full_name ?? m.student_id}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <p className="text-xs font-semibold text-muted mb-2">Fayllar (ixtiyoriy)</p>
          <FileUploader value={files} onChange={setFiles} prefix={`hw/${group}`} disabled={!group} />
        </div>

        {problem && <p className="sm:col-span-2 text-xs text-red">{problem}</p>}
      </div>
    </Modal>
  );
}
