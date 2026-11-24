"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/client";
import { useAuth } from "../auth/AuthProvider";

export interface Settings {
  platform_name: string;
  logo_url: string;
  accent_color: string;
  contact_phone: string;
  contact_address: string;
  contact_telegram: string;
  payment_due_day: number;
  default_lesson_minutes: number;
  teacher_announcements: boolean;
  teacher_view_payments: boolean;
  notify_homework: boolean;
  notify_grade: boolean;
  notify_announcement: boolean;
  notify_payment: boolean;
  notify_group_change: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  platform_name: "Korean Center",
  logo_url: "",
  accent_color: "#FEDD00",
  contact_phone: "",
  contact_address: "",
  contact_telegram: "",
  payment_due_day: 5,
  default_lesson_minutes: 90,
  teacher_announcements: true,
  teacher_view_payments: false,
  notify_homework: true,
  notify_grade: true,
  notify_announcement: true,
  notify_payment: true,
  notify_group_change: true,
};

const SettingsContext = createContext<{ settings: Settings; reload: () => Promise<void> }>({
  settings: DEFAULT_SETTINGS,
  reload: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("key, value");
    if (!data) return;
    const next: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    data.forEach((row: { key: string; value: unknown }) => {
      if (row.key in DEFAULT_SETTINGS) next[row.key] = row.value;
    });
    setSettings(next as unknown as Settings);
  }, []);

  useEffect(() => {
    if (user) void reload();
  }, [user, reload]);

  // The accent colour chosen by the admin replaces the brand yellow everywhere.
  useEffect(() => {
    const accent = /^#[0-9a-fA-F]{6}$/.test(settings.accent_color) ? settings.accent_color : DEFAULT_SETTINGS.accent_color;
    document.documentElement.style.setProperty("--brand", accent);
  }, [settings.accent_color]);

  const value = useMemo(() => ({ settings, reload }), [settings, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
