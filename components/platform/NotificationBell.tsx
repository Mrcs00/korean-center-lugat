"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listNotifications, markNotificationsRead } from "@/lib/platform/api";
import type { AppNotification } from "@/lib/platform/types";
import { formatDateTime } from "@/lib/platform/format";

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setItems(await listNotifications(user.id));
    } catch {
      // the bell simply stays as it was
    }
  }, [user]);

  useEffect(() => {
    void load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => !i.read).length;

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read && user) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
      void markNotificationsRead(user.id, [n.id]);
    }
    if (n.link) router.push(n.link);
  };

  const readAll = async () => {
    if (!user) return;
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await markNotificationsRead(user.id);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
        aria-label="Bildirishnomalar"
        className="relative h-10 w-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
      >
        {unread > 0 ? <BellRing size={19} /> : <Bell size={19} />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-12 sm:right-0 sm:w-[22rem] z-50 rounded-2xl bg-surface border border-border shadow-[var(--shadow-lg)] overflow-hidden animate-rise">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-bold text-sm">Bildirishnomalar</p>
            {unread > 0 && (
              <button onClick={readAll} className="text-xs font-semibold text-brand-darker flex items-center gap-1">
                <CheckCheck size={14} /> Hammasini o&apos;qildi
              </button>
            )}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-muted text-center py-10">Hozircha yangi xabar yo&apos;q.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] flex gap-3 ${n.read ? "" : "bg-brand-tint"}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-brand-dark"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                    {n.body && <span className="block text-xs text-muted mt-0.5 line-clamp-2">{n.body}</span>}
                    <span className="block text-[11px] text-muted-soft mt-1">{formatDateTime(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
