"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase, usernameToEmail } from "@/lib/supabase/client";
import { useStore } from "@/lib/store/progressStore";

export default function LoginPage() {
  const router = useRouter();
  const { syncAuthProfile } = useStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = usernameToEmail(username);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Foydalanuvchi nomi yoki parol noto'g'ri.");
      setLoading(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    syncAuthProfile({ fullName: profileRow?.full_name ?? username, email });
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
            <label className="text-xs font-semibold text-muted">Foydalanuvchi nomi</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ali_valiyev"
              className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Parol</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          Hisobingiz yo'qmi?{" "}
          <Link href="/register" className="font-semibold text-foreground">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </Card>
    </div>
  );
}
