"use client";

import { MapPin, MessageCircle, Phone, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Page, PageHeader, Panel } from "@/components/platform/ui";
import { useSettings } from "@/lib/platform/settings";
import { useMyGroups } from "@/lib/platform/hooks";

export default function StudentContactPage() {
  const { settings } = useSettings();
  const { groups } = useMyGroups();
  const teachers = [...new Map(groups.filter((g) => g.teacher).map((g) => [g.teacher!.id, g.teacher!.full_name])).values()];
  const telegram = settings.contact_telegram.replace(/^@/, "");

  const rows = [
    { icon: Phone, label: "Telefon", value: settings.contact_phone, href: settings.contact_phone ? `tel:${settings.contact_phone.replace(/\s/g, "")}` : undefined },
    { icon: MessageCircle, label: "Telegram", value: settings.contact_telegram, href: telegram ? `https://t.me/${telegram}` : undefined },
    { icon: MapPin, label: "Manzil", value: settings.contact_address, href: undefined },
  ];

  return (
    <AppShell>
      <Page>
        <PageHeader title="Aloqa" subtitle="Markaz bilan bog'lanish" />
        <div className="grid md:grid-cols-2 gap-6">
          <Panel title={settings.platform_name}>
            <div className="flex flex-col gap-4">
              {rows.map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-darker flex items-center justify-center shrink-0">
                    <r.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{r.label}</p>
                    {r.value ? (
                      r.href ? (
                        <a href={r.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-brand-darker hover:underline break-words">
                          {r.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-sm break-words">{r.value}</p>
                      )
                    ) : (
                      <p className="text-sm text-muted-soft">Kiritilmagan</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Ustozlarim">
            {teachers.length === 0 ? (
              <p className="text-sm text-muted">Ustoz belgilanmagan.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {teachers.map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-black/[0.05] flex items-center justify-center">
                      <User size={18} className="text-muted" />
                    </div>
                    <p className="font-semibold text-sm">{t}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-soft mt-4">Savollaringiz bo&apos;lsa, darsda ustozingizga yoki yuqoridagi aloqa vositalari orqali yozing.</p>
          </Panel>
        </div>
      </Page>
    </AppShell>
  );
}
