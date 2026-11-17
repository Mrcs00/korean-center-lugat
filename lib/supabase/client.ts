import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A single shared client for the whole app. Session (access token) is
// persisted to localStorage automatically by supabase-js, so the person
// stays logged in across page reloads.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Auth is email/password only — we don't collect real emails for
// this "username + password" flow, so a username is turned into a stable
// fake email (see lib/utils/usernames.ts). It never leaves the project and is
// never emailed anywhere.
export { usernameToEmail } from "../utils/usernames";
