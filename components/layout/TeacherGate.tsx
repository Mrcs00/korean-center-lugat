"use client";

import Link from "next/link";
import { AlertCircle, LogIn, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Status = "loading" | "unauthenticated" | "not-teacher" | "ready" | "error";

export function TeacherGate({
  status,
  errorMessage,
  onRetry,
  children,
}: {
  status: Status;
  errorMessage?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (status === "ready") return <>{children}</>;

  if (status === "loading") {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-center text-sm text-muted">Yuklanmoqda...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <Card className="p-8">
          <LogIn size={28} className="mx-auto text-brand-darker mb-3" />
          <h2 className="font-bold text-lg mb-1">Kirish talab qilinadi</h2>
          <p className="text-sm text-muted mb-5">
            O'qituvchi panelidan foydalanish uchun avval hisobingizga kiring.
          </p>
          <Link href="/login">
            <Button>Kirish</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (status === "not-teacher") {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <Card className="p-8">
          <ShieldAlert size={28} className="mx-auto text-amber mb-3" />
          <h2 className="font-bold text-lg mb-1">Faqat o'qituvchilar uchun</h2>
          <p className="text-sm text-muted">
            Hisobingiz hozircha o'quvchi sifatida ro'yxatdan o'tgan. O'qituvchi huquqini olish uchun
            Supabase SQL Editor'da:
          </p>
          <code className="block text-xs bg-black/[0.04] rounded-lg px-3 py-2 mt-3 text-left overflow-x-auto">
            update profiles set role = 'teacher' where username = '...';
          </code>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <Card className="p-8">
        <AlertCircle size={28} className="mx-auto text-red mb-3" />
        <h2 className="font-bold text-lg mb-1">Xatolik yuz berdi</h2>
        <p className="text-sm text-muted mb-4">{errorMessage ?? "Ma'lumotlarni yuklab bo'lmadi."}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Qayta urinish
          </Button>
        )}
      </Card>
    </div>
  );
}
