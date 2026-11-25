"use client";

import { AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Small confirmation modal used before destructive teacher actions.
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 backdrop-blur-[2px] px-5"
      onClick={busy ? undefined : onCancel}
    >
      <Card elevation="lg" className="p-6 max-w-sm w-full animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-10 w-10 rounded-xl bg-red-soft text-red flex items-center justify-center shrink-0">
              <AlertTriangle size={19} />
            </span>
            <h3 className="font-extrabold text-lg tracking-tight">{title}</h3>
          </div>
          <button onClick={onCancel} disabled={busy} aria-label="Yopish" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10 shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-muted leading-relaxed">{children}</div>
        {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2 mt-3">{error}</p>}
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" size="lg" className="flex-1" disabled={busy} onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button variant="danger" size="lg" className="flex-1" disabled={busy} onClick={onConfirm}>
            {busy ? "Bajarilmoqda..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
