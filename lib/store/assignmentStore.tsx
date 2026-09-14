"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Assignment } from "../types";

const STORAGE_KEY = "topik-trainer-assignments-v1";

interface AssignmentApi {
  assignments: Assignment[];
  addAssignment: (a: Omit<Assignment, "id">) => void;
  removeAssignment: (id: string) => void;
}

const AssignmentContext = createContext<AssignmentApi | null>(null);

export function AssignmentProvider({ children }: { children: React.ReactNode }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setAssignments(JSON.parse(raw));
    } catch {
      // ignore corrupt state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments, hydrated]);

  const addAssignment = useCallback((a: Omit<Assignment, "id">) => {
    setAssignments((prev) => [{ ...a, id: `assignment-${Date.now()}` }, ...prev]);
  }, []);

  const removeAssignment = useCallback((id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AssignmentApi>(
    () => ({ assignments, addAssignment, removeAssignment }),
    [assignments, addAssignment, removeAssignment]
  );

  return <AssignmentContext.Provider value={value}>{children}</AssignmentContext.Provider>;
}

export function useAssignments(): AssignmentApi {
  const ctx = useContext(AssignmentContext);
  if (!ctx) throw new Error("useAssignments must be used within AssignmentProvider");
  return ctx;
}
