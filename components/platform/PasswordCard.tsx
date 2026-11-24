"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

// Students pick their own password after the teacher hands them the first one.
export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // The banner on the dashboard links here (#parol): open the card straight away.
  useEffect(() => {
    if (window.location.hash === "#parol") setOpen(true);
  }, []);

  const save = async () => {
    if (password.length < 6) return setMessage({ kind: "err", text: "Parol kamida 6 belgi bo'lsin." });
    if (password !== repeat) return setMessage({ kind: "err", text: "Ikkala parol bir xil emas." });
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setBusy(false);
    if (error) return setMessage({ kind: "err", text: error.message });
    setMessage({ kind: "ok", text: "Parol o'zgartirildi." });
    setPassword("");
    setRepeat("");
  };

  const input =
    "w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <Card className="p-5 mb-6" id="parol">
      <button className="w-full flex items-center justify-between text-left" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm font-semibold">Parolni o&apos;zgartirish</span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 mt-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Yangi parol"
            autoComplete="new-password"
            className={input}
          />
          <input
            type="password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            placeholder="Yangi parolni takrorlang"
            autoComplete="new-password"
            className={input}
          />
          {message && (
            <p
              className={`text-xs rounded-lg px-3 py-2 ${
                message.kind === "ok" ? "bg-green-soft text-green" : "bg-red-soft text-red"
              }`}
            >
              {message.text}
            </p>
          )}
          <Button onClick={save} disabled={busy || !password}>
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      )}
    </Card>
  );
}
