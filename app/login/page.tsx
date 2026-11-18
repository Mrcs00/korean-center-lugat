"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { supabase, usernameToEmail } from "@/lib/supabase/client";
import { LOGIN_DOMAIN, loginToUsername } from "@/lib/utils/usernames";
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
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    syncAuthProfile({ fullName: profileRow?.full_name ?? cleanUsername, email });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-2xl bg-brand flex items-center justify-center font-black">
            토
          </div>
          <span className="font-bold text-lg">Korean Center Lug'at</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Xush kelibsiz</h1>
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
                className="min-w-0 flex-1 h-12 rounded-l-xl border border-border bg-background px-3.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <span className="h-12 px-3 flex items-center rounded-r-xl border border-l-0 border-border bg-black/[0.04] text-sm text-muted whitespace-nowrap">
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
                className="w-full h-12 rounded-xl border border-border bg-background pl-3.5 pr-12 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}

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
