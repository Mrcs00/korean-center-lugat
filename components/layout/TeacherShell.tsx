"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, UsersRound, Target, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/teacher", label: "Umumiy", icon: LayoutGrid },
  { href: "/teacher/students", label: "O'quvchilar", icon: Users },
  { href: "/teacher/groups", label: "Guruhlar", icon: UsersRound },
  { href: "/teacher/exams", label: "Imtihonlar", icon: Target },
  { href: "/teacher/analytics", label: "Analitika", icon: BarChart3 },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/teacher" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-surface px-4 py-6">
        <div className="flex items-center justify-between gap-2 px-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-brand flex items-center justify-center font-black shrink-0">토</div>
            <span className="font-bold text-lg tracking-tight truncate">Korean Center Lug'at</span>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
        <p className="px-2 mb-7 text-xs font-semibold text-muted uppercase tracking-wide">Teacher panel</p>
        <nav className="flex-1 flex flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                isActive(href) ? "bg-brand-soft text-foreground" : "text-muted hover:bg-black/[0.04] hover:text-foreground"
              }`}
            >
              <Icon size={18} strokeWidth={2.25} />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="text-xs text-muted px-3 hover:text-foreground">
          ← Student rejimiga qaytish
        </Link>
      </aside>

      <div className="flex-1 lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border px-5 py-3 flex items-center gap-2">
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
                  isActive(href) ? "bg-brand text-foreground" : "bg-black/[0.04] text-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
        {children}
      </div>
    </div>
  );
}
