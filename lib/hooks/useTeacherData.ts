"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { fetchRealStudents, fetchRealGroups, RealStudent } from "../services/teacherService";

type Status = "loading" | "unauthenticated" | "not-teacher" | "ready" | "error";

interface TeacherDataState {
  status: Status;
  students: RealStudent[];
  groups: { id: string; name: string }[];
  errorMessage: string | null;
  refresh: () => void;
}

export function useTeacherData(): TeacherDataState {
  const [status, setStatus] = useState<Status>("loading");
  const [students, setStudents] = useState<RealStudent[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      const { data: profileRow } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileRow?.role !== "teacher") {
        if (!cancelled) setStatus("not-teacher");
        return;
      }

      try {
        const [studentsData, groupsData] = await Promise.all([fetchRealStudents(), fetchRealGroups()]);
        if (cancelled) return;
        setStudents(studentsData);
        setGroups(groupsData);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Noma'lum xato");
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { status, students, groups, errorMessage, refresh: () => setReloadKey((k) => k + 1) };
}
