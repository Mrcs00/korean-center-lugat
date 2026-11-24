"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { SettingsView } from "@/components/platform/staff/AdminViews";

export default function RoutePage() {
  return (
    <AdminShell>
      <SettingsView />
    </AdminShell>
  );
}
