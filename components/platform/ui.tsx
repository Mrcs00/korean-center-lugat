"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { Tone } from "@/lib/platform/labels";
import { initials } from "@/lib/platform/format";

// ── Badge ───────────────────────────────────────────────────────────────────
const TONES: Record<Tone, string> = {
  green: "bg-green-soft text-green",
  amber: "bg-amber-soft text-amber",
  red: "bg-red-soft text-red",
  blue: "bg-blue-soft text-blue",
  gray: "bg-black/[0.06] text-muted dark:bg-white/10",
  brand: "bg-brand-soft text-brand-darker",
};

export function Badge({ tone = "gray", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Standard page width + padding for every panel page. */
export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-8 lg:pb-12 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>{children}</div>;
}

// ── Stat card ───────────────────────────────────────────────────────────────
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const toneBg: Record<Tone, string> = {
    brand: "bg-brand-soft text-brand-darker",
    green: "bg-green-soft text-green",
    amber: "bg-amber-soft text-amber",
    red: "bg-red-soft text-red",
    blue: "bg-blue-soft text-blue",
    gray: "bg-black/[0.06] text-muted",
  };
  const inner = (
    <div className="rounded-2xl bg-surface border border-border p-4 sm:p-5 h-full transition-all hover:border-border-strong hover:shadow-[var(--shadow-sm)]">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${toneBg[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="text-xs text-muted mt-2">{label}</p>
      {hint && <p className="text-[11px] text-muted-soft mt-1">{hint}</p>}
    </div>
  );
  return href ? (
    <a href={href} className="block h-full">
      {inner}
    </a>
  ) : (
    inner
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-surface border border-border p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-bold text-base">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ── States ──────────────────────────────────────────────────────────────────
export function Spinner({ label = "Yuklanmoqda..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div className="h-14 w-14 rounded-2xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted" />
      </div>
      <p className="font-bold">{title}</p>
      {text && <p className="text-sm text-muted mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl bg-red-soft text-red text-sm px-4 py-3 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline shrink-0">
          Qayta urinish
        </button>
      )}
    </div>
  );
}

export function Avatar({ name, size = 40, tone }: { name: string; size?: number; tone?: string }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold shrink-0 bg-brand-soft text-brand-darker"
      style={{ width: size, height: size, fontSize: size * 0.42, ...(tone ? { background: tone } : {}) }}
    >
      {initials(name)}
    </div>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────────
export const inputCls =
  "w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-2 focus:ring-brand/40 disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? <span className="block text-xs text-red mt-1">{error}</span> : hint ? <span className="block text-xs text-muted-soft mt-1">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} h-auto py-2.5 min-h-[96px] ${props.className ?? ""}`} />;
}

export function SearchInput({ value, onChange, placeholder = "Qidirish..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-soft" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-10`} />
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border mb-5 -mx-1 px-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 px-3.5 py-2.5 text-sm font-semibold transition-colors ${value === t.id ? "text-foreground" : "text-muted hover:text-foreground"}`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-[11px] text-muted-soft">{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
            value === o.id ? "bg-foreground text-background border-foreground" : "bg-surface text-muted border-border hover:border-border-strong hover:text-foreground"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="opacity-60">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/45" onMouseDown={onClose}>
      <div
        className={`w-full ${width} max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-surface shadow-[var(--shadow-lg)] animate-rise`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Yopish" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:bg-black/[0.05]">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-border flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────
export function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted">
        {page} / {pageCount}
      </span>
      <div className="flex gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Oldingi"
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:bg-black/[0.04]"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          aria-label="Keyingi"
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:bg-black/[0.04]"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Data hook ───────────────────────────────────────────────────────────────
/** Loads data with loading/error state and a reload() function. */
export function useLoad<T>(load: () => Promise<T>, deps: React.DependencyList): {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as { message?: string })?.message ?? "Ma'lumotni yuklab bo'lmadi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}
