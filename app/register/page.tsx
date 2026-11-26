import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Public sign-up is closed: random people (and bots) were creating accounts.
// Teachers create student accounts from the teacher panel instead.
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <Card elevation="md" className="animate-page max-w-sm w-full p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand-soft text-brand-darker flex items-center justify-center mx-auto mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight mb-2">Ro&apos;yxatdan o&apos;tish yopiq</h1>
        <p className="text-sm text-muted mb-6">
          Akkauntni o&apos;qituvchingiz yaratib beradi. Login va parolni undan oling, keyin shu yerdan kiring.
        </p>
        <Link href="/login" className="text-sm font-extrabold text-brand-darker hover:underline">
          Kirish sahifasiga o&apos;tish →
        </Link>
      </Card>
    </div>
  );
}
