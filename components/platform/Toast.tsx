"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastContext = createContext<{ success: (t: string) => void; error: (t: string) => void }>({
  success: () => {},
  error: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), kind === "error" ? 6000 : 3500);
  }, []);

  const api = {
    success: (t: string) => push("success", t),
    error: (t: string) => push("error", t),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto flex flex-col gap-2 items-end pointer-events-none">
        {items.map((i) => (
          <div
            key={i.id}
            className={`pointer-events-auto animate-rise flex items-start gap-2.5 max-w-sm w-full sm:w-auto rounded-2xl px-4 py-3 text-sm shadow-[var(--shadow-lg)] border ${
              i.kind === "success" ? "bg-surface border-green/30" : "bg-surface border-red/40"
            }`}
          >
            {i.kind === "success" ? (
              <CheckCircle2 size={18} className="text-green shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{i.text}</span>
            <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))} aria-label="Yopish" className="text-muted">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
