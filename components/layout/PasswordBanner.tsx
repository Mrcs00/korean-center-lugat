"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Shown to a student whose password was set by the teacher. It disappears
// as soon as the student chooses their own password (the flag lives on the
// account, so it works on any phone).
export function PasswordBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user?.user_metadata?.must_change_password === true) setShow(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-amber-soft px-4 py-3 mb-6">
      <KeyRound size={18} className="text-amber shrink-0" />
      <p className="text-sm flex-1">
        {"O'qituvchi bergan parolni o'zingiz o'ylab topgan parolga almashtiring, shunda akkauntingiz faqat sizniki bo'ladi."}
      </p>
      <Link href="/profile#parol" className="text-sm font-bold text-brand-dark whitespace-nowrap">
        {"O'zgartirish →"}
      </Link>
    </div>
  );
}
