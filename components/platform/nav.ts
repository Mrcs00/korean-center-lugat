import {
  BarChart3, BookOpen, Building2, CalendarCheck, CalendarDays, ClipboardCheck, ClipboardList, GraduationCap,
  LayoutDashboard, Languages, Megaphone, MessageCircle, Repeat, Settings, Users, UsersRound, Wallet, School, UserCircle,
} from "lucide-react";
import type { Role } from "@/lib/platform/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  /** Other path prefixes that keep this item highlighted. */
  also?: string[];
  /** Shown in the phone bottom bar. */
  primary?: boolean;
}

export const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: "/student", label: "Bosh sahifa", icon: LayoutDashboard, primary: true },
    { href: "/student/courses", label: "Mening kurslarim", icon: BookOpen, primary: true },
    { href: "/vocabulary", label: "Lug'at", icon: Languages, also: ["/flashcards", "/quiz", "/exam", "/write", "/random-test", "/wrong-words", "/result"], primary: true },
    { href: "/review", label: "Takrorlash", icon: Repeat },
    { href: "/student/homework", label: "Uy vazifalari", icon: ClipboardList, primary: true },
    { href: "/student/attendance", label: "Davomat", icon: CalendarCheck },
    { href: "/student/schedule", label: "Dars jadvali", icon: CalendarDays },
    { href: "/student/payments", label: "To'lovlar", icon: Wallet },
    { href: "/statistics", label: "Statistika", icon: BarChart3 },
    { href: "/student/contact", label: "Aloqa", icon: MessageCircle },
  ],
  teacher: [
    { href: "/teacher", label: "Bosh sahifa", icon: LayoutDashboard, primary: true },
    { href: "/teacher/groups", label: "Guruhlarim", icon: UsersRound, primary: true },
    { href: "/teacher/students", label: "O'quvchilar", icon: GraduationCap },
    { href: "/teacher/attendance", label: "Davomat", icon: CalendarCheck, primary: true },
    { href: "/teacher/homework", label: "Uy vazifalari", icon: ClipboardList, also: ["/teacher/exams"], primary: true },
    { href: "/teacher/grading", label: "Baholash", icon: ClipboardCheck },
    { href: "/teacher/schedule", label: "Dars jadvali", icon: CalendarDays },
    { href: "/teacher/announcements", label: "E'lonlar", icon: Megaphone },
    { href: "/teacher/statistics", label: "Statistika", icon: BarChart3, also: ["/teacher/analytics"] },
    { href: "/teacher/profile", label: "Profil", icon: UserCircle },
  ],
  admin: [
    { href: "/admin", label: "Bosh sahifa", icon: LayoutDashboard, primary: true },
    { href: "/admin/groups", label: "Guruhlar", icon: UsersRound, primary: true },
    { href: "/admin/students", label: "O'quvchilar", icon: GraduationCap, primary: true },
    { href: "/admin/teachers", label: "Ustozlar", icon: School },
    { href: "/admin/courses", label: "Kurslar", icon: BookOpen },
    { href: "/admin/attendance", label: "Davomat", icon: CalendarCheck },
    { href: "/admin/homework", label: "Uy vazifalari", icon: ClipboardList },
    { href: "/admin/payments", label: "To'lovlar", icon: Wallet, primary: true },
    { href: "/admin/statistics", label: "Statistika", icon: BarChart3 },
    { href: "/admin/announcements", label: "E'lonlar", icon: Megaphone },
    { href: "/admin/branches", label: "Filiallar", icon: Building2 },
    { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
  ],
};

export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", teacher: "Ustoz", student: "O'quvchi" };

export function isActive(pathname: string, item: NavItem, siblings: NavItem[]): boolean {
  const matches = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");
  const own = [item.href, ...(item.also ?? [])];
  if (!own.some(matches)) return false;
  // "/student" must not stay active on "/student/courses"
  const longer = siblings.some((s) => s !== item && s.href.length > item.href.length && s.href.startsWith(item.href) && [s.href, ...(s.also ?? [])].some(matches));
  return !longer;
}
// keep an unused import warning away for icons used only in some roles
void Users;
