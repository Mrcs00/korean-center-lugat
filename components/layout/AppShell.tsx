"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  RotateCw,
  Target,
  BarChart3,
  Users,
  User,
  Flame,
} from "lucide-react";
import { useStore } from "@/lib/store/progressStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DESKTOP_LINKS = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/vocabulary", label: "Lug'atlar", icon: BookOpen },
  { href: "/review", label: "Takrorlash", icon: RotateCw },
  { href: "/exam", label: "Imtihon", icon: Target },
  { href: "/statistics", label: "Statistika", icon: BarChart3 },
  { href: "/groups", label: "Guruhlar", icon: Users },
  { href: "/profile", label: "Profil", icon: User },
];

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/vocabulary", label: "Lug'atlar", icon: BookOpen },
  { href: "/review", label: "Takrorlash", icon: RotateCw },
  { href: "/exam", label: "Test", icon: Target },
  { href: "/groups", label: "Guruhlar", icon: Users },
  { href: "/profile", label: "Profil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-background bg-grain lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-surface px-4 py-6">
        <div className="flex items-center justify-between gap-2 px-2 mb-8">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center font-black text-foreground shadow-[var(--shadow-brand)] shrink-0">
              토
            </div>
            <span className="font-bold text-lg tracking-tight truncate">Korean Center Lug'at</span>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {DESKTOP_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "text-foreground"
                    : "text-muted hover:bg-black/[0.035] hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-2xl bg-brand-soft"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={18} strokeWidth={2.25} className="relative" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a17] to-[#2b2a24] border border-white/[0.06] px-4 py-4">
            <span className="font-kr absolute -right-2 -bottom-3 text-[64px] font-black text-white/[0.06] leading-none select-none">
              한
            </span>
            <p className="relative text-[10px] font-bold text-brand uppercase tracking-wider mb-1">
              TOPIK 3—6
            </p>
            <p className="relative text-white text-sm font-semibold leading-snug">
              Yuqori darajalar uchun professional tayyorgarlik
            </p>
          </div>

          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-black/[0.03]">
            <div className="h-9 w-9 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold">
              {profile.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{profile.fullName}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <Flame size={12} className="text-amber" /> {profile.streak} kun
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile floating theme toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-40">
        <ThemeToggle className="bg-surface border border-border shadow-[var(--shadow-sm)]" />
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-md border-t border-border px-2 py-2 flex items-center justify-around z-40">
        {MOBILE_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-medium min-w-[56px] transition-colors duration-200 ${
                active ? "text-foreground" : "text-muted"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={2.25}
                className={`transition-transform duration-200 ${active ? "text-brand-dark scale-110" : ""}`}
                fill={active ? "var(--brand)" : "none"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
