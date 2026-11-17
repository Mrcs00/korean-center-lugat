"use client";

import { useState } from "react";
import { Check, Copy, Printer, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NewCredential, createStudents } from "@/lib/services/teacherService";
import { credentialsAsText, saveCredentials } from "@/lib/utils/credentialsPrint";

const MAX_NAMES = 100;

// Teacher creates student accounts: paste names (one per line), pick a group,
// get a login + password for each. Passwords are shown only here, once.
export function AddStudentsDialog({
  open,
  groups,
  defaultGroupId,
  onClose,
  onCreated,
}: {
  open: boolean;
  groups: { id: string; name: string }[];
  defaultGroupId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [text, setText] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<NewCredential[] | null>(null);
  const [failed, setFailed] = useState<{ fullName: string; error: string }[]>([]);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const names = text
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  const effectiveGroup = groupId || defaultGroupId || groups[0]?.id || "";

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await createStudents(effectiveGroup, names);
      setCreated(result.created);
      setFailed(result.failed);
      if (result.created.length > 0) onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setText("");
    setCreated(null);
    setFailed([]);
    setError(null);
    setCopied(false);
    onClose();
  };

  const copyAll = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(credentialsAsText(created));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nusxalab bo'lmadi. Jadvaldan qo'lda ko'chiring.");
    }
  };

  const printSlips = () => {
    if (!created) return;
    saveCredentials(created);
    window.open("/teacher/credentials", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 py-6 overflow-y-auto">
      <Card elevation="lg" className="p-6 max-w-xl w-full my-auto animate-rise">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{created ? "Akkauntlar yaratildi" : "O'quvchi qo'shish"}</h3>
          <button onClick={close} aria-label="Yopish" className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {!created ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-muted">Guruh</label>
              <select
                value={effectiveGroup}
                onChange={(e) => setGroupId(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted">Ismlar (har qatorda bitta)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder={"Nurjahon Mahmudova\nUlug'bek Madaminov"}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <p className="text-xs text-muted mt-1">
                {names.length} ta ism. Login ismdan avtomatik yaratiladi (masalan nurjahon.mahmudova), parolni sayt o&apos;zi
                tanlaydi.
              </p>
            </div>
            {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}
            <Button
              size="lg"
              disabled={busy || names.length === 0 || names.length > MAX_NAMES || !effectiveGroup}
              onClick={handleCreate}
            >
              {busy ? "Yaratilmoqda..." : `${names.length} ta akkaunt yaratish`}
            </Button>
            {names.length > MAX_NAMES && (
              <p className="text-xs text-red -mt-2">Bir marta ko&apos;pi bilan {MAX_NAMES} ta.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-amber bg-amber-soft rounded-xl px-3 py-2.5">
              Parollar faqat shu oynada ko&apos;rsatiladi. Oynani yopishdan oldin nusxalang yoki chop eting.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-left text-xs text-muted">
                    <th className="px-3 py-2 font-semibold">Ism</th>
                    <th className="px-3 py-2 font-semibold">Login</th>
                    <th className="px-3 py-2 font-semibold">Parol</th>
                  </tr>
                </thead>
                <tbody>
                  {created.map((c) => (
                    <tr key={c.username} className="border-t border-border">
                      <td className="px-3 py-2">{c.fullName}</td>
                      <td className="px-3 py-2 font-mono">{c.username}</td>
                      <td className="px-3 py-2 font-mono font-bold">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {failed.length > 0 && (
              <div className="text-xs text-red bg-red-soft rounded-xl px-3 py-2.5">
                <p className="font-semibold mb-1">Yaratilmadi ({failed.length}):</p>
                {failed.map((f) => (
                  <p key={f.fullName}>
                    {f.fullName}: {f.error}
                  </p>
                ))}
              </div>
            )}
            {error && <p className="text-xs text-red">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyAll} disabled={created.length === 0}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Nusxalandi" : "Hammasini nusxalash"}
              </Button>
              <Button variant="secondary" onClick={printSlips} disabled={created.length === 0}>
                <Printer size={15} /> Chop etish
              </Button>
              <Button className="ml-auto" onClick={close}>
                Tayyor
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
