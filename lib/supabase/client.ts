import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A single shared client for the whole app. Session (access token) is
// persisted to localStorage automatically by supabase-js, so the person
// stays logged in across page reloads.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Auth is email/password only — we don't collect real emails for
// this "username + password" flow, so we synthesize a stable, invalid-TLD
// email from the username. It never leaves the project and is never
// emailed anywhere (email confirmation is disabled in the dashboard).
export function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  return `${normalized}@users.korean-center-lugat.local`;
}
