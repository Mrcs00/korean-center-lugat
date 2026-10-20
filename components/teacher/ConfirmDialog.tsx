"use client";

import { X } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      onClick={busy ? undefined : onCancel}
    >
      <Card elevation="lg" className="p-6 max-w-sm w-full animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onCancel} disabled={busy} aria-label="Yopish" className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-muted">{children}</div>
        {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2 mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" size="lg" className="flex-1" disabled={busy} onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button variant="danger" size="lg" className="flex-1" disabled={busy} onClick={onConfirm}>
            {busy ? "O'chirilmoqda..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
