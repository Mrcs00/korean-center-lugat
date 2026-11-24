"use client";

import { PanelShell } from "@/components/platform/PanelShell";

// The student shell. Every student page (the new ones and the older vocabulary
// pages) is wrapped in it, so they all share the same sidebar and top bar.
export function AppShell({ children }: { children: React.ReactNode }) {
  return <PanelShell role="student">{children}</PanelShell>;
}
