import { jsonResponse, requireTeacher } from "@/lib/server/supabaseAdmin";
import { MAX_STUDENTS, StudentInput, createStudentsBatch } from "@/lib/server/createStudents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Creates student accounts for a teacher. For each student the teacher may
// choose the login and password; anything left empty is generated. All are
// placed in the chosen group. Passwords are never stored in readable form.
export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if ("error" in auth) return auth.error;

  let body: { students?: unknown; groupId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }

  const students = Array.isArray(body.students) ? (body.students as StudentInput[]) : [];
  const groupId = typeof body.groupId === "string" ? body.groupId : "";

  if (students.length === 0) return jsonResponse(400, { error: "Kamida bitta o'quvchi kiriting." });
  if (students.length > MAX_STUDENTS) return jsonResponse(400, { error: `Bir marta ko'pi bilan ${MAX_STUDENTS} ta.` });

  const result = await createStudentsBatch(auth.admin, groupId, students);
  if ("error" in result) return jsonResponse(400, { error: result.error });
  return jsonResponse(200, result);
}
