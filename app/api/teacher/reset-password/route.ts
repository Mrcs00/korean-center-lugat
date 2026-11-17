import { generatePassword, jsonResponse, requireTeacher } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gives a student a new random password (students have no email to reset by).
// Only student accounts can be reset here — never a teacher's.
export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  let body: { studentId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }
  const studentId = typeof body.studentId === "string" ? body.studentId : "";

  const { data: target } = await admin
    .from("profiles")
    .select("id, role, username, full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!target) return jsonResponse(404, { error: "O'quvchi topilmadi." });
  if (target.role !== "student") return jsonResponse(403, { error: "Faqat o'quvchi parolini tiklash mumkin." });

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(studentId, { password });
  if (error) return jsonResponse(500, { error: error.message });

  return jsonResponse(200, { username: target.username, fullName: target.full_name, password });
}
