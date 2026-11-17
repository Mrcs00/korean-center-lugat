"use client";

import { useState } from "react";
import { Check, Copy, Printer, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { saveCredentials } from "@/lib/utils/credentialsPrint";

// Shows a freshly generated password once, with copy / print.
export function PasswordResultDialog({
  result,
  groupName,
  onClose,
}: {
  result: { fullName: string; username: string; password: string } | null;
  groupName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${result.fullName} — login: ${result.username} — parol: ${result.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // the password is on screen, the teacher can copy it by hand
    }
  };

  const print = () => {
    saveCredentials([{ ...result, group: groupName }]);
    window.open("/teacher/credentials", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <Card elevation="lg" className="p-6 max-w-sm w-full animate-rise">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Yangi parol</h3>
          <button onClick={onClose} aria-label="Yopish" className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-3">{result.fullName}</p>
        <div className="rounded-2xl bg-background px-4 py-3 text-center mb-2">
          <p className="text-xs text-muted">Login</p>
          <p className="font-mono text-base font-semibold">{result.username}</p>
          <p className="text-xs text-muted mt-2">Parol</p>
          <p className="font-mono text-2xl font-extrabold tracking-wider">{result.password}</p>
        </div>
        <p className="text-xs text-amber mb-4">Parol faqat bir marta ko&apos;rsatiladi. Eski parol endi ishlamaydi.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={print}>
            <Printer size={15} /> Chop etish
          </Button>
        </div>
        <Button className="w-full mt-2" onClick={onClose}>
          Tayyor
        </Button>
      </Card>
    </div>
  );
}
