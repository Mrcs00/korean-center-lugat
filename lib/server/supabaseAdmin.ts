import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

// Server-only helpers for the teacher's account tools. The service-role key
// bypasses all security rules, so it must only ever live in a server
// environment variable (Vercel → Settings → Environment Variables) and is
// never sent to the browser.

export class ConfigError extends Error {}

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ConfigError(
      "SUPABASE_SERVICE_ROLE_KEY o'rnatilmagan. Vercel → Settings → Environment Variables ga qo'shib, qayta deploy qiling."
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Only a signed-in teacher gets through. Returns the admin client, or an error response. */
export async function requireTeacher(
  request: Request
): Promise<{ admin: SupabaseClient } | { error: Response }> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: jsonResponse(401, { error: "Kirish kerak." }) };

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: jsonResponse(500, { error: (e as Error).message }) };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: jsonResponse(401, { error: "Sessiya yaroqsiz. Qayta kiring." }) };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "teacher") return { error: jsonResponse(403, { error: "Faqat o'qituvchi uchun." }) };

  return { admin };
}

// No look-alike characters (0/o, 1/l/i) so passwords can be read off paper.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  return out;
}
