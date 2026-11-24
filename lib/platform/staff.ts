"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useLoad } from "@/components/platform/ui";
import { listGroups } from "./api";
import type { Role } from "./types";

export type StaffRole = Exclude<Role, "student">;

/** Base URL of a staff panel. */
export const baseOf = (role: StaffRole): string => (role === "admin" ? "/admin" : "/teacher");

/** Groups the signed-in staff member works with: all for the admin, own for a teacher. */
export function useStaffGroups() {
  const { user, profile } = useAuth();
  const q = useLoad(() => listGroups(), []);
  const all = q.data ?? [];
  const groups = profile?.role === "admin" ? all : all.filter((g) => g.teacher_id === user?.id);
  return { ...q, groups, all };
}
