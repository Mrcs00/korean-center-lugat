"use client";

import { useState } from "react";
import { Check, Copy, Dices, Eye, EyeOff, Plus, Printer, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, Select } from "./ui";
import { CreatedAccount, createAccounts } from "@/lib/platform/api";
import { NewCredential, credentialsAsText, saveCredentials } from "@/lib/utils/credentialsPrint";
import { LOGIN_DOMAIN, USERNAME_PATTERN, displayLogin, loginToUsername, usernameBaseFromName } from "@/lib/utils/usernames";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, randomPassword } from "@/lib/utils/passwords";

const MAX_ROWS = 100;

interface Row {
  fullName: string;
  username: string; // the part before @kc.uz
  password: string;
  phone: string;
}

const emptyRow = (): Row => ({ fullName: "", username: "", password: "", phone: "" });
const isFilled = (r: Row) => Boolean(r.fullName.trim() || r.username.trim() || r.password.trim() || r.phone.trim());
const blankRows = () => [emptyRow(), emptyRow(), emptyRow()];

// Admin creates student or teacher accounts: type the name, choose a login
// (…@kc.uz) and a password — or leave them empty and the site generates them.
// Passwords are shown only here, once.
export function AddAccountsDialog({
  open,
  role,
  groups = [],
  defaultGroupId,
  onClose,
  onCreated,
}: {
  open: boolean;
  role: "student" | "teacher";
  groups?: { id: string; name: string }[];
  defaultGroupId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(blankRows());
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [showPasswords, setShowPasswords] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<number, string>>({});
  const [created, setCreated] = useState<(CreatedAccount & { group: string })[] | null>(null);
  const [copied, setCopied] = useState(false);

  const word = role === "teacher" ? "ustoz" : "o'quvchi";
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
    if (p && (p.length < MIN_PASSWORD_LENGTH || p.length > MAX_PASSWORD_LENGTH)) return `Parol kamida ${MIN_PASSWORD_LENGTH} belgi.`;
    return null;
  };

  const hasInvalid = filled.some(({ r }) => rowError(r));

  const update = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setServerErrors((prev) => {
      if (!(i in prev)) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  };

  const removeRow = (i: number) => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [emptyRow()]));

  // Pasting several lines (Excel, Telegram) fills several rows.
  // A line may be "Name" or "Name <tab> login <tab> password <tab> phone".
  const handlePaste = (i: number, text: string): boolean => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;
    const parsed: Row[] = lines.map((line) => {
      const [fullName = "", username = "", password = "", phone = ""] = line.split("\t").map((c) => c.trim());
      return { fullName, username: loginToUsername(username), password, phone };
    });
    setRows((prev) => [...prev.slice(0, i), ...parsed, ...prev.slice(i + 1)].slice(0, MAX_ROWS));
    return true;
  };

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

  const reset = () => {
    setRows(blankRows());
    setCreated(null);
    setServerErrors({});
    setError(null);
    setCopied(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    setServerErrors({});
    try {
      const result = await createAccounts(
        role,
        filled.map(({ r }) => ({ fullName: r.fullName.trim(), username: loginToUsername(r.username), password: r.password.trim(), phone: r.phone.trim() })),
        role === "student" ? groupId || defaultGroupId || undefined : undefined
      );

      const failedErrors = new Map<number, string>();
      result.failed.forEach((f) => {
        const tableIndex = filled[f.index]?.i;
        if (tableIndex !== undefined) failedErrors.set(tableIndex, f.error);
      });

      if (result.created.length > 0) {
        onCreated();
        setCreated((prev) => [...(prev ?? []), ...result.created]);
      }
      const keep = rows.map((r, i) => ({ r, i })).filter(({ i }) => failedErrors.has(i));
      setRows(keep.length > 0 ? keep.map(({ r }) => r) : blankRows());
      setServerErrors(Object.fromEntries(keep.map(({ i }, n) => [n, failedErrors.get(i) as string])));
      if (result.created.length === 0) setError("Hech qaysi akkaunt yaratilmadi. Xatolarni tuzating.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const credentials: NewCredential[] = (created ?? []).map((c) => ({ fullName: c.fullName, username: c.username, password: c.password, group: c.group }));

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(credentialsAsText(credentials));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nusxalab bo'lmadi. Jadvaldan qo'lda ko'chiring.");
    }
  };

  const printSlips = () => {
    saveCredentials(credentials);
    window.open("/teacher/credentials", "_blank");
  };

  const cell =
    "h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40";
  const stillEditing = rows.some(isFilled);

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={created && !stillEditing ? "Akkauntlar yaratildi" : role === "teacher" ? "Ustoz qo'shish" : "O'quvchi qo'shish"}
      footer={
        stillEditing || !created ? (
          <Button size="lg" disabled={busy || filled.length === 0 || hasInvalid} onClick={handleCreate}>
            {busy ? "Yaratilmoqda..." : `${filled.length} ta akkaunt yaratish`}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={reset}>
              <Plus size={15} /> Yana qo&apos;shish
            </Button>
            <Button onClick={close}>Tayyor</Button>
          </>
        )
      }
    >
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

      {(!created || stillEditing) && (
        <div className="flex flex-col gap-4">
          {created && <p className="text-sm font-semibold text-red">Yaratilmaganlar (xatoni tuzatib, qayta urining):</p>}

          <div className="flex flex-wrap items-end gap-3">
            {role === "student" && (
              <div className="flex-1 min-w-[12rem]">
                <label className="text-xs font-semibold text-muted">Guruh (ixtiyoriy)</label>
                <Select className="mt-1.5 h-10" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">Guruhsiz</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={autoFill}>
              <Wand2 size={14} /> Avtomatik to&apos;ldirish
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPasswords((v) => !v)}>
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />} Parollar
            </Button>
          </div>

          <div className="hidden md:grid grid-cols-[1.3fr_1.4fr_1fr_1fr_2.25rem] gap-2 text-xs font-semibold text-muted px-1">
            <span>Ism familiya</span>
            <span>Login</span>
            <span>Parol</span>
            <span>Telefon</span>
            <span />
          </div>

          <div className="flex flex-col gap-3">
            {rows.map((r, i) => {
              const err = rowError(r) ?? serverErrors[i] ?? null;
              return (
                <div key={i}>
                  <div className={`grid grid-cols-1 md:grid-cols-[1.3fr_1.4fr_1fr_1fr_2.25rem] gap-2 rounded-xl ${err ? "ring-1 ring-red/50 p-1.5 -m-1.5" : ""}`}>
                    <input
                      value={r.fullName}
                      onChange={(e) => update(i, { fullName: e.target.value })}
                      onPaste={(e) => {
                        if (handlePaste(i, e.clipboardData.getData("text"))) e.preventDefault();
                      }}
                      placeholder="Ism familiya"
                      autoCapitalize="words"
                      className={cell}
                    />
                    <div className="flex">
                      <input
                        value={r.username}
                        onChange={(e) => update(i, { username: e.target.value.toLowerCase() })}
                        placeholder="login (bo'sh = avtomatik)"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className={`${cell} rounded-r-none border-r-0 min-w-0`}
                      />
                      <span className="h-10 px-2.5 flex items-center rounded-r-lg border border-border bg-black/[0.04] dark:bg-white/10 text-sm text-muted whitespace-nowrap">
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
                        className={`${cell} font-mono min-w-0`}
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
                    <input
                      value={r.phone}
                      onChange={(e) => update(i, { phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      inputMode="tel"
                      className={cell}
                    />
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
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            disabled={rows.length >= MAX_ROWS}
            className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-border text-sm font-semibold text-muted hover:text-foreground hover:border-border-strong"
          >
            <Plus size={15} /> Qator qo&apos;shish
          </button>

          <p className="text-xs text-muted">
            Ismlarni ro&apos;yxat qilib (Excel, Telegram) birinchi katakka tashlasangiz, qatorlar o&apos;zi to&apos;ladi. Login yoki parolni
            bo&apos;sh qoldirsangiz, sayt o&apos;zi yaratadi. Login haqiqiy pochta emas, faqat kirish nomi. Yangi {word} birinchi kirishda
            parolini o&apos;zgartirish haqida eslatma ko&apos;radi.
          </p>
          {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
