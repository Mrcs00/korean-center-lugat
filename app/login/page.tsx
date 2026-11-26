"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { supabase, usernameToEmail } from "@/lib/supabase/client";
import { LOGIN_DOMAIN, loginToUsername } from "@/lib/utils/usernames";
import { homeFor } from "@/lib/auth/AuthProvider";
import { useStore } from "@/lib/store/progressStore";

export default function LoginPage() {
  const router = useRouter();
  const { syncAuthProfile } = useStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // "nurjahon", "Nurjahon@kc.uz" and "nurjahon@kc.uz " all mean the same login.
    const cleanUsername = loginToUsername(username);
    const email = usernameToEmail(cleanUsername);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Login yoki parol noto'g'ri. Yordam kerak bo'lsa o'qituvchingizga ayting.");
      setLoading(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, role, status")
      .eq("id", data.user.id)
      .single();

    if (profileRow?.status === "inactive") {
      await supabase.auth.signOut();
      setError("Akkauntingiz faol emas. Markaz bilan bog'laning.");
      setLoading(false);
      return;
    }

    syncAuthProfile({ fullName: profileRow?.full_name ?? cleanUsername, email });
    router.push(homeFor(profileRow?.role));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-page px-6 py-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <Card elevation="lg" className="animate-page relative w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-2xl bg-brand text-[#0f1d33] shadow-[var(--shadow-brand)] flex items-center justify-center font-black text-lg">
            토
          </div>
          <span className="font-extrabold text-lg tracking-tight">Korean Center</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Xush kelibsiz</h1>
        <p className="text-sm text-muted mt-1 mb-6">Hisobingizga kiring</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login" className="text-xs font-semibold text-muted">
              Login
            </label>
            <div className="mt-1.5 flex">
              <input
                id="login"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ali"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="min-w-0 flex-1 h-12 rounded-l-xl border border-border bg-background px-3.5 text-base outline-none transition-all hover:border-border-strong focus:border-brand-dark focus:ring-4 focus:ring-brand/25"
              />
              <span className="h-12 px-3 flex items-center rounded-r-xl border border-l-0 border-border bg-black/[0.04] dark:bg-white/[0.06] text-sm font-semibold text-muted whitespace-nowrap">
                {LOGIN_DOMAIN}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-muted">
              Parol
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-12 rounded-xl border border-border bg-background pl-3.5 pr-12 text-base outline-none transition-all hover:border-border-strong focus:border-brand-dark focus:ring-4 focus:ring-brand/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red bg-red-soft border border-red/20 rounded-xl px-3.5 py-2.5">{error}</p>}

          <Button type="submit" size="lg" className="w-full mt-2 h-12" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          {"Akkauntni o'qituvchingiz beradi. Login yoki parolni unutgan bo'lsangiz, o'qituvchingizga ayting, u yangisini beradi."}
        </p>
      </Card>
    </div>
  );
}
