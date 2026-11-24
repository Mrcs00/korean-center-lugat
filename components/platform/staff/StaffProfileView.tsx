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
      <PageHeader title="Profil" />
      <div className="max-w-xl flex flex-col gap-6">
        <Panel>
          <div className="flex items-center gap-4">
            <Avatar name={profile.full_name} size={64} />
            <div>
              <p className="text-xl font-extrabold">{profile.full_name}</p>
              <p className="text-sm text-muted">{displayLogin(profile.username)}</p>
              <div className="flex gap-2 mt-2">
                <Badge tone="brand">{ROLE_LABEL[profile.role]}</Badge>
                <Badge tone="gray">{formatDate(profile.created_at)} dan beri</Badge>
              </div>
            </div>
          </div>
        </Panel>
        <PasswordCard />
      </div>
    </Page>
  );
}
