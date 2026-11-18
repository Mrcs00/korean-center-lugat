"use client";

import { useState } from "react";
import { Check, Copy, Dices, Eye, EyeOff, Plus, Printer, Trash2, Wand2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NewCredential, createStudents } from "@/lib/services/teacherService";
import { credentialsAsText, saveCredentials } from "@/lib/utils/credentialsPrint";
import { LOGIN_DOMAIN, USERNAME_PATTERN, displayLogin, loginToUsername, usernameBaseFromName } from "@/lib/utils/usernames";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, randomPassword } from "@/lib/utils/passwords";

const MAX_STUDENTS = 100;

interface Row {
  fullName: string;
  username: string; // the part before @kc.uz
  password: string;
}

const emptyRow = (): Row => ({ fullName: "", username: "", password: "" });
const isFilled = (r: Row) => Boolean(r.fullName.trim() || r.username.trim() || r.password.trim());

// Teacher creates student accounts: for each student type the name, choose a
// login (…@kc.uz) and a password — or leave login/password empty and let the
// site generate them. Passwords are shown only here, once.
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
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [showPasswords, setShowPasswords] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<number, string>>({});
  const [created, setCreated] = useState<NewCredential[] | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const effectiveGroup = groupId || defaultGroupId || groups[0]?.id || "";

  // ── validation (only rows the teacher actually filled in) ──
  const filled = rows.map((r, i) => ({ r, i })).filter(({ r }) => isFilled(r));
  const loginCounts = new Map<string, number>();
  filled.forEach(({ r }) => {
    const u = loginToUsername(r.username);
    if (u) loginCounts.set(u, (loginCounts.get(u) ?? 0) + 1);
  });

  const rowError = (r: Row): string | null => {
    if (!isFilled(r)) return null;
    if (r.fullName.trim().length < 2) return "Ism kiriting.";
    const u = loginToUsername(r.username);
    if (u && !USERNAME_PATTERN.test(u)) return "Login 3–30 belgi: a–z, 0–9, nuqta, tire, _";
    if (u && (loginCounts.get(u) ?? 0) > 1) return "Bu login takrorlangan.";
    const p = r.password.trim();
    if (p && (p.length < MIN_PASSWORD_LENGTH || p.length > MAX_PASSWORD_LENGTH)) {
      return `Parol kamida ${MIN_PASSWORD_LENGTH} belgi.`;
    }
    return null;
  };

  const hasInvalid = filled.some(({ r }) => rowError(r));
  const readyCount = filled.length;

  const update = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setServerErrors((prev) => {
      if (!(i in prev)) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [emptyRow()]));

  // Pasting several lines (from Excel, Telegram, Notes) fills several rows.
  // A line may be "Name", or "Name <tab> login <tab> password".
  const handlePaste = (i: number, text: string): boolean => {
    if (!text.includes("\n")) return false;
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return false;
    const parsed: Row[] = lines.map((line) => {
      const [fullName = "", username = "", password = ""] = line.split("\t").map((c) => c.trim());
      return { fullName, username: loginToUsername(username), password };
    });
    setRows((prev) => {
      const before = prev.slice(0, i);
      const after = prev.slice(i + 1);
      return [...before, ...parsed, ...after].slice(0, MAX_STUDENTS);
    });
    return true;
  };

  // Fill every empty login/password so the teacher can see (and change) them.
  const autoFill = () => {
    const used = new Set(rows.map((r) => loginToUsername(r.username)).filter(Boolean));
    setRows((prev) =>
      prev.map((r) => {
        if (!r.fullName.trim()) return r;
        let username = loginToUsername(r.username);
        if (!username) {
          const base = usernameBaseFromName(r.fullName);
          username = base;
          for (let n = 2; used.has(username); n++) username = `${base}${n}`;
          used.add(username);
        }
        return { ...r, username, password: r.password.trim() || randomPassword() };
      })
    );
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    setServerErrors({});
    try {
      const payload = filled.map(({ r }) => ({
        fullName: r.fullName.trim(),
        username: loginToUsername(r.username),
        password: r.password.trim(),
      }));
      const result = await createStudents(effectiveGroup, payload);

      // The server numbers rows by position in what we sent; map back to the table.
      const failedErrors: Record<number, string> = {};
      const failedRows = new Set<number>();
      result.failed.forEach((f) => {
        const tableIndex = filled[f.index]?.i;
        if (tableIndex !== undefined) {
          failedErrors[tableIndex] = f.error;
          failedRows.add(tableIndex);
        }
      });

      if (result.created.length > 0) {
        onCreated();
        setCreated(result.created);
      }
      // Keep only the rows that failed so they can be corrected and retried.
      setRows(failedRows.size > 0 ? rows.filter((_, i) => failedRows.has(i)) : [emptyRow(), emptyRow(), emptyRow()]);
      const remapped: Record<number, string> = {};
      [...failedRows].sort((a, b) => a - b).forEach((oldIndex, newIndex) => (remapped[newIndex] = failedErrors[oldIndex]));
      setServerErrors(remapped);
      if (result.created.length === 0) setError("Hech qaysi akkaunt yaratilmadi. Xatolarni tuzating.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setCreated(null);
    setServerErrors({});
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

  const inputCls =
    "h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <Card elevation="lg" className="p-6 max-w-3xl w-full my-auto animate-rise">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {created && rows.every((r) => !isFilled(r)) ? "Akkauntlar yaratildi" : "O'quvchi qo'shish"}
          </h3>
          <button onClick={close} aria-label="Yopish" className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {created && (
          <div className="flex flex-col gap-3 mb-5">
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
                      <td className="px-3 py-2 font-mono">{displayLogin(c.username)}</td>
                      <td className="px-3 py-2 font-mono font-bold">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyAll}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Nusxalandi" : "Hammasini nusxalash"}
              </Button>
              <Button variant="secondary" onClick={printSlips}>
                <Printer size={15} /> Chop etish
              </Button>
            </div>
          </div>
        )}

        {(!created || rows.some((r) => isFilled(r))) && (
          <div className="flex flex-col gap-4">
            {created && <p className="text-sm font-semibold text-red">Yaratilmaganlar (xatoni tuzatib, qayta urining):</p>}

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[12rem]">
                <label className="text-xs font-semibold text-muted">Guruh</label>
                <select
                  value={effectiveGroup}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-brand"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" size="sm" onClick={autoFill}>
                <Wand2 size={14} /> Avtomatik to&apos;ldirish
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowPasswords((v) => !v)}>
                {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />} Parollar
              </Button>
            </div>

            <div className="hidden md:grid grid-cols-[1.3fr_1.4fr_1fr_2.25rem] gap-2 text-xs font-semibold text-muted px-1">
              <span>Ism</span>
              <span>Login</span>
              <span>Parol</span>
              <span />
            </div>

            <div className="flex flex-col gap-2.5">
              {rows.map((r, i) => {
                const err = rowError(r) ?? serverErrors[i] ?? null;
                return (
                  <div key={i}>
                    <div
                      className={`grid grid-cols-1 md:grid-cols-[1.3fr_1.4fr_1fr_2.25rem] gap-2 rounded-xl ${
                        err ? "ring-1 ring-red/50 p-1.5 -m-1.5" : ""
                      }`}
                    >
                      <input
                        value={r.fullName}
                        onChange={(e) => update(i, { fullName: e.target.value })}
                        onPaste={(e) => {
                          if (handlePaste(i, e.clipboardData.getData("text"))) e.preventDefault();
                        }}
                        placeholder="Ism familiya"
                        autoCapitalize="words"
                        className={inputCls}
                      />
                      <div className="flex">
                        <input
                          value={r.username}
                          onChange={(e) => update(i, { username: e.target.value.toLowerCase() })}
                          placeholder="login (bo'sh = avtomatik)"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          className={`${inputCls} rounded-r-none border-r-0 min-w-0`}
                        />
                        <span className="h-10 px-2.5 flex items-center rounded-r-lg border border-border bg-black/[0.04] text-sm text-muted whitespace-nowrap">
                          {LOGIN_DOMAIN}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={r.password}
                          onChange={(e) => update(i, { password: e.target.value })}
                          placeholder="parol (bo'sh = avtomatik)"
                          autoComplete="new-password"
                          className={`${inputCls} font-mono min-w-0`}
                        />
                        <button
                          type="button"
                          title="Parol yaratish"
                          aria-label="Parol yaratish"
                          onClick={() => update(i, { password: randomPassword() })}
                          className="h-10 w-10 shrink-0 rounded-lg border border-border hover:bg-black/[0.04] flex items-center justify-center"
                        >
                          <Dices size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Qatorni o'chirish"
                        onClick={() => removeRow(i)}
                        className="h-10 w-9 rounded-lg text-muted hover:text-red hover:bg-red-soft flex items-center justify-center md:justify-self-end"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {err && <p className="text-xs text-red mt-1 px-1">{err}</p>}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= MAX_STUDENTS}
              className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-border text-sm font-semibold text-muted hover:text-foreground hover:border-border-strong"
            >
              <Plus size={15} /> Qator qo&apos;shish
            </button>

            <p className="text-xs text-muted">
              Ismlarni ro&apos;yxat qilib (Excel, Telegram) birinchi katakka tashlasangiz, qatorlar o&apos;zi to&apos;ladi. Login yoki
              parolni bo&apos;sh qoldirsangiz, sayt o&apos;zi yaratadi. Login haqiqiy pochta emas, faqat kirish nomi.
            </p>

            {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}

            <Button size="lg" disabled={busy || readyCount === 0 || hasInvalid || !effectiveGroup} onClick={handleCreate}>
              {busy ? "Yaratilmoqda..." : `${readyCount} ta akkaunt yaratish`}
            </Button>
          </div>
        )}

        {created && !rows.some((r) => isFilled(r)) && (
          <Button className="w-full mt-2" onClick={close}>
            Tayyor
          </Button>
        )}
        {created && rows.some((r) => isFilled(r)) && (
          <Button variant="secondary" className="w-full mt-2" onClick={close}>
            Yopish
          </Button>
        )}
      </Card>
    </div>
  );
}
