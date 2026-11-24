"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useLoad } from "@/components/platform/ui";
import { listAttendance, listHomework, listLessons, listPayments, mySubmissions, myGroups } from "./api";
import type { GroupFull } from "./api";

/** The signed-in student's groups (with course and teacher). */
export function useMyGroups() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const q = useLoad(() => (uid ? myGroups(uid) : Promise.resolve([] as (GroupFull & { joined_at: string })[])), [uid]);
  return { ...q, groups: q.data ?? [], uid };
}

export function useMyHomework(groupIds: string[]) {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const key = groupIds.join(",");
  const hw = useLoad(() => listHomework(groupIds), [key]);
  const subs = useLoad(() => (uid ? mySubmissions(uid) : Promise.resolve([])), [uid]);
  return { homework: hw.data ?? [], submissions: subs.data ?? [], loading: hw.loading || subs.loading, error: hw.error ?? subs.error, reload: () => { hw.reload(); subs.reload(); } };
}

export function useMyAttendance() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const q = useLoad(() => (uid ? listAttendance({ studentId: uid }) : Promise.resolve([])), [uid]);
  return { ...q, rows: q.data ?? [] };
}

export function useMyPayments() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const q = useLoad(() => (uid ? listPayments(uid) : Promise.resolve([])), [uid]);
  return { ...q, payments: q.data ?? [] };
}

export function useLessons(groupIds: string[], from: string, to: string) {
  const key = groupIds.join(",");
  const q = useLoad(() => listLessons(groupIds, from, to), [key, from, to]);
  return { ...q, lessons: q.data ?? [] };
}
