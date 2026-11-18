import { generatePassword, jsonResponse, requireTeacher } from "@/lib/server/supabaseAdmin";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/utils/passwords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gives a student a new password: the one the teacher typed, or a generated
// one (students have no email to reset by). Only student accounts can be reset
// here — never a teacher's.
export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  let body: { studentId?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }
  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  const requested = typeof body.password === "string" ? body.password.trim() : "";

  if (requested && (requested.length < MIN_PASSWORD_LENGTH || requested.length > MAX_PASSWORD_LENGTH)) {
    return jsonResponse(400, { error: `Parol ${MIN_PASSWORD_LENGTH} dan ${MAX_PASSWORD_LENGTH} belgigacha bo'lsin.` });
  }

  const { data: target } = await admin
    .from("profiles")
    .select("id, role, username, full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!target) return jsonResponse(404, { error: "O'quvchi topilmadi." });
  if (target.role !== "student") return jsonResponse(403, { error: "Faqat o'quvchi parolini tiklash mumkin." });

  // Keep the existing account data and ask the student to pick their own password again.
  const { data: existing } = await admin.auth.admin.getUserById(studentId);
  const metadata = { ...(existing?.user?.user_metadata ?? {}), must_change_password: true };

  const password = requested || generatePassword();
  const { error } = await admin.auth.admin.updateUserById(studentId, { password, user_metadata: metadata });
  if (error) return jsonResponse(500, { error: error.message });

  return jsonResponse(200, { username: target.username, fullName: target.full_name, password });
}
