"use client";

import { useEffect, useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import { NewCredential, clearCredentials, loadCredentials } from "@/lib/utils/credentialsPrint";
import { displayLogin } from "@/lib/utils/usernames";

// Cut-out slips with each student's login and password. The data comes from
// the tab that just created the accounts (sessionStorage), nothing is stored.
export default function CredentialsPrintPage() {
  const [list, setList] = useState<NewCredential[] | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setList(loadCredentials());
    setOrigin(window.location.origin);
  }, []);

  if (list === null) return null;

  if (list.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center text-sm text-muted">
        Chop etiladigan ma&apos;lumot yo&apos;q. Akkaunt yaratilgan oynadan &quot;Chop etish&quot; ni bosing.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-xl font-extrabold">Login va parol varaqlari ({list.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand text-foreground text-sm font-semibold"
          >
            <Printer size={16} /> Chop etish
          </button>
          <button
            onClick={() => {
              clearCredentials();
              setList([]);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold"
          >
            <Trash2 size={16} /> Tozalash
          </button>
        </div>
      </div>
      <p className="text-xs text-muted mb-4 print:hidden">
        Chop etgach &quot;Tozalash&quot; ni bosing, parollar shu oynadan o&apos;chadi. Varaqlarni kesib o&apos;quvchilarga bering.
      </p>

      <div className="grid grid-cols-2 gap-3 print:gap-2">
        {list.map((c) => (
          <div
            key={c.username}
            className="break-inside-avoid rounded-xl border-2 border-dashed border-gray-400 p-4 text-black bg-white"
          >
            <p className="text-sm font-extrabold">Korean Center — Lug&apos;at</p>
            <p className="text-[11px] text-gray-600 mb-3">{origin}</p>
            <p className="text-xs text-gray-600">Ism</p>
            <p className="text-sm font-bold mb-1.5">{c.fullName}</p>
            <p className="text-xs text-gray-600">Guruh: {c.group}</p>
            <div className="mt-2 rounded-lg bg-gray-100 px-3 py-2">
              <p className="text-[11px] text-gray-600">Login</p>
              <p className="font-mono text-base font-bold">{displayLogin(c.username)}</p>
              <p className="text-[11px] text-gray-600 mt-1.5">Parol</p>
              <p className="font-mono text-lg font-extrabold tracking-wider">{c.password}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
