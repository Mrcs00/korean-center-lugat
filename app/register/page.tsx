"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase, usernameToEmail } from "@/lib/supabase/client";
import { useStore } from "@/lib/store/progressStore";

interface GroupOption {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { syncAuthProfile } = useStore();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("groups")
      .select("id, name")
      .order("name")
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(
            "Guruhlar ro'yxatini yuklab bo'lmadi. docs/auth-schema.sql ishga tushirilganini tekshiring."
          );
          return;
        }
        setGroups(data ?? []);
        if (data && data.length > 0) setGroupId(data[0].id);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          role: "student",
          group_id: groupId || null,
        },
      },
    });

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Bu foydalanuvchi nomi band. Boshqasini tanlang."
          : signUpError.message
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Ro'yxatdan o'tildi, lekin sessiya ochilmadi. Supabase'da 'Confirm email' o'chirilganini tekshiring.");
      setLoading(false);
      return;
    }

    syncAuthProfile({ fullName: fullName.trim(), email: usernameToEmail(username) });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-10">
      <Card className="w-full max-w-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-2xl bg-brand flex items-center justify-center font-black">
            토
          </div>
          <span className="font-bold text-lg">Korean Center Lug'at</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ro'yxatdan o'tish</h1>
        <p className="text-sm text-muted mt-1 mb-6">Bepul hisob yarating</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-muted">To'liq ism</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ali Valiyev"
              className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Foydalanuvchi nomi</label>
            <input
              required
              minLength={3}
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Guruh</label>
            <select
              required
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1.5 w-full h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            >
              {groups.length === 0 && <option value="">Guruhlar yuklanmoqda...</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red bg-red-soft rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
            {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-semibold text-foreground">
            Kirish
          </Link>
        </p>
      </Card>
    </div>
  );
}
