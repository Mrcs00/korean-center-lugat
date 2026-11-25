"use client";

import { Page, PageHeader, Panel, Avatar, Badge } from "@/components/platform/ui";
import { PasswordCard } from "@/components/platform/PasswordCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABEL } from "@/components/platform/nav";
import { displayLogin } from "@/lib/utils/usernames";
import { formatDate } from "@/lib/platform/format";

export function StaffProfileView() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <Page>
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlar va parol" />
      <div className="max-w-xl flex flex-col gap-6">
        <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-[var(--shadow-xs)]">
          <div className="h-20 bg-gradient-to-r from-brand to-brand-soft" />
          <div className="px-5 pb-5 -mt-9">
            <div className="rounded-full ring-4 ring-surface w-fit">
              <Avatar name={profile.full_name} size={72} />
            </div>
            <p className="text-xl font-extrabold tracking-tight mt-3">{profile.full_name}</p>
            <p className="text-sm text-muted">{displayLogin(profile.username)}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge tone="brand">{ROLE_LABEL[profile.role]}</Badge>
              <Badge tone="gray">{formatDate(profile.created_at)} dan beri</Badge>
            </div>
          </div>
        </div>
        <PasswordCard />
      </div>
    </Page>
  );
}

void Panel;
