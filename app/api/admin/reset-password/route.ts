import { generatePassword, jsonResponse, requireAdmin } from "@/lib/server/supabaseAdmin";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/utils/passwords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gives a student or teacher a new password (there is no email to reset by).
// Admin accounts cannot be reset here.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  let body: { userId?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  const requested = typeof body.password === "string" ? body.password.trim() : "";

  if (requested && (requested.length < MIN_PASSWORD_LENGTH || requested.length > MAX_PASSWORD_LENGTH)) {
    return jsonResponse(400, { error: `Parol ${MIN_PASSWORD_LENGTH} dan ${MAX_PASSWORD_LENGTH} belgigacha bo'lsin.` });
  }

  const { data: target } = await admin.from("profiles").select("id, role, username, full_name").eq("id", userId).maybeSingle();
  if (!target) return jsonResponse(404, { error: "Foydalanuvchi topilmadi." });
  if (target.role === "admin") return jsonResponse(403, { error: "Admin parolini bu yerdan o'zgartirib bo'lmaydi." });

  // Keep the existing account data and ask the person to pick their own password again.
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const metadata = { ...(existing?.user?.user_metadata ?? {}), must_change_password: true };

  const password = requested || generatePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password, user_metadata: metadata });
  if (error) return jsonResponse(500, { error: error.message });

  return jsonResponse(200, { username: target.username, fullName: target.full_name, password });
}
