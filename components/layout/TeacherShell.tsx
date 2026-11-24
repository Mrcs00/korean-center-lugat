"use client";

import { PanelShell } from "@/components/platform/PanelShell";

// Used by the staff pages. Admin pages use the admin shell (see app/admin).
export function TeacherShell({ children }: { children: React.ReactNode }) {
  return <PanelShell role="teacher">{children}</PanelShell>;
}
