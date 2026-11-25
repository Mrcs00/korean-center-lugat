"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings as SettingsIcon, UserCircle, X } from "lucide-react";
import { useAuth, homeFor } from "@/lib/auth/AuthProvider";
import { useSettings } from "@/lib/platform/settings";
import type { Role } from "@/lib/platform/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NAV, ROLE_LABEL, isActive } from "./nav";
import { NotificationBell } from "./NotificationBell";
import { Avatar, Spinner } from "./ui";

// Redirects people who are signed out, or who opened the wrong section.
function useRoleGuard(allow: Role[]): "loading" | "ok" | "redirecting" {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) router.replace("/login");
    else if (!allow.includes(profile.role)) router.replace(homeFor(profile.role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile, router]);

  if (loading) return "loading";
  if (!user || !profile || !allow.includes(profile.role)) return "redirecting";
  return "ok";
}

export function PanelShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const guard = useRoleGuard([role]);
  const pathname = usePathname();
  const { settings } = useSettings();
  const [drawer, setDrawer] = useState(false);
  const items = NAV[role];

  // close the phone drawer on navigation
  useEffect(() => setDrawer(false), [pathname]);

  if (guard !== "ok") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Spinner label={guard === "loading" ? "Yuklanmoqda..." : "Yo'naltirilmoqda..."} />
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item, items);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
              active
                ? "bg-brand-soft text-foreground font-bold shadow-[var(--shadow-xs)]"
                : "text-muted font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground"
            }`}
          >
            {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-brand" />}
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? "bg-brand text-[#0f1d33]" : "group-hover:bg-black/[0.04] dark:group-hover:bg-white/[0.06]"}`}>
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href={homeFor(role)} className="flex items-center gap-3 px-2">
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logo_url} alt="" className="h-11 w-11 rounded-2xl object-cover" />
      ) : (
        <div className="h-11 w-11 rounded-2xl bg-brand flex items-center justify-center font-kr font-extrabold text-xl text-[#0f1d33] shadow-[var(--shadow-brand)]">K</div>
      )}
      <div className="min-w-0">
        <p className="font-extrabold leading-tight truncate tracking-tight">{settings.platform_name}</p>
        <p className="text-[10px] text-muted font-bold uppercase tracking-[0.12em] mt-0.5">{ROLE_LABEL[role]} paneli</p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-page text-foreground">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-surface border-r border-border px-3 py-5 overflow-y-auto">
        <div className="mb-7">{brand}</div>
        {nav}
      </aside>

      {/* phone drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-surface px-3 py-5 overflow-y-auto animate-rise">
            <div className="flex items-center justify-between mb-5">
              {brand}
              <button onClick={() => setDrawer(false)} aria-label="Yopish" className="h-9 w-9 rounded-lg flex items-center justify-center text-muted">
                <X size={18} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 h-16 bg-surface/85 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label="Menyu" className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center text-muted hover:bg-black/[0.05]">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <ThemeToggle />
            <ProfileMenu role={role} />
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] pb-24 lg:pb-0">{children}</main>
      </div>

      {/* phone bottom bar (students and teachers use it most) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border grid grid-cols-5 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-10px_rgba(15,29,51,0.18)]">
        {items
          .filter((i) => i.primary)
          .slice(0, 4)
          .map((item) => {
            const active = isActive(pathname, item, items);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "text-foreground" : "text-muted"}`}>
                <span className={`h-7 w-12 rounded-full flex items-center justify-center transition-colors ${active ? "bg-brand text-[#0f1d33]" : ""}`}>
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-muted">
          <span className="h-7 w-12 rounded-full flex items-center justify-center">
            <Menu size={18} />
          </span>
          Menyu
        </button>
      </nav>
    </div>
  );
}

function ProfileMenu({ role }: { role: Role }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!profile) return null;
  const profileHref = role === "student" ? "/profile" : `/${role}/profile`;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 rounded-xl pl-1.5 pr-2 py-1.5 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors">
        <Avatar name={profile.full_name} size={34} />
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-bold max-w-[10rem] truncate">{profile.full_name}</span>
          <span className="block text-[11px] text-muted">{ROLE_LABEL[role]}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-2xl bg-surface border border-border shadow-[var(--shadow-lg)] py-1.5 z-50 animate-rise">
          <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
            <UserCircle size={16} /> Profil
          </Link>
          {role === "admin" && (
            <Link href="/admin/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
              <SettingsIcon size={16} /> Sozlamalar
            </Link>
          )}
          <button
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red hover:bg-red-soft"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}
