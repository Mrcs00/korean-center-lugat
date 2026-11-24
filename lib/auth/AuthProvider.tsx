"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import type { Profile, Role } from "../platform/types";

interface AuthValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export const homeFor = (role: Role | undefined): string =>
  role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";

const PROFILE_COLUMNS = "id, username, full_name, role, status, branch_id, created_at";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", u.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user ?? null);
      void loadProfile(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // never await Supabase calls inside this callback — defer them
      setTimeout(() => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        void loadProfile(session?.user ?? null);
      }, 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user ?? null);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ user, profile, loading, refresh, signOut }), [user, profile, loading, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
