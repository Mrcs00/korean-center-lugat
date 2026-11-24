"use client";

import { PanelShell } from "@/components/platform/PanelShell";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <PanelShell role="admin">{children}</PanelShell>;
}
