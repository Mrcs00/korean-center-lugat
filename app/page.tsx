"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarCheck, ClipboardList, Languages, LineChart, Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth, homeFor } from "@/lib/auth/AuthProvider";
import { useSettings } from "@/lib/platform/settings";

const FEATURES = [
  { icon: BookOpen, title: "Kurslar", text: "Guruhingiz, ustozingiz va darslaringiz bir joyda." },
  { icon: ClipboardList, title: "Uy vazifalari", text: "Vazifani topshiring, baho va izohni oling." },
  { icon: CalendarCheck, title: "Davomat va jadval", text: "Dars kunlari va qatnashishingizni kuzating." },
  { icon: Languages, title: "Lug'at mashqlari", text: "Flashcard, takrorlash va imtihonlar." },
  { icon: LineChart, title: "Natijalar", text: "Rivojlanishingiz grafiklar bilan ko'rinadi." },
  { icon: Wallet, title: "To'lovlar", text: "To'lov holati va tarixi doim ochiq." },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  // signed-in people go straight to their own panel
  useEffect(() => {
    if (!loading && user && profile) router.replace(homeFor(profile.role));
  }, [loading, user, profile, router]);

  return (
    <div className="relative min-h-screen bg-page overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute top-[28rem] -left-40 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
      <header className="relative max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-brand flex items-center justify-center font-extrabold text-xl text-[#0f1d33] shadow-[var(--shadow-brand)]">K</div>
          <span className="font-extrabold text-lg tracking-tight">{settings.platform_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="h-10 px-5 rounded-xl bg-brand text-[#0f1d33] text-sm font-bold flex items-center hover:bg-brand-dark transition-colors shadow-[var(--shadow-brand)]">
            Kirish
          </Link>
        </div>
      </header>

      <main className="animate-page relative max-w-6xl mx-auto px-6 pt-12 pb-20">
        <div className="max-w-2xl">
          <p className="inline-block rounded-full bg-brand-soft text-brand-darker border border-brand/30 text-xs font-bold px-3.5 py-1.5 mb-6">O&apos;quv markazi platformasi</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Koreys tilini o&apos;rganish,<br />
            <span className="bg-brand px-2 rounded-lg text-[#0f1d33]">bir joyda.</span>
          </h1>
          <p className="text-lg text-muted mt-5">
            Darslar, uy vazifalari, davomat, lug&apos;at mashqlari va natijalar. Akkauntni o&apos;qituvchingiz beradi.
          </p>
          <Link href="/login" className="mt-8 inline-flex h-12 px-7 rounded-xl bg-brand text-[#0f1d33] font-bold items-center hover:bg-brand-dark transition-colors shadow-[var(--shadow-brand)]">
            Hisobga kirish
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl bg-surface border border-border p-6 shadow-[var(--shadow-xs)] hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-200">
              <div className="h-12 w-12 rounded-2xl bg-brand text-[#0f1d33] flex items-center justify-center mb-4 shadow-[var(--shadow-brand)]">
                <f.icon size={20} />
              </div>
              <p className="font-extrabold tracking-tight">{f.title}</p>
              <p className="text-sm text-muted mt-1">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
