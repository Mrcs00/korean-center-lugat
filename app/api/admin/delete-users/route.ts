import { jsonResponse, requireAdmin } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DELETE = 100;

// Permanently deletes student/teacher accounts and everything that belongs to
// them. Admin accounts and the caller's own account are never deleted.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { admin, callerId } = auth;

  let body: { userIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }
  const ids = Array.isArray(body.userIds) ? body.userIds.filter((v): v is string => typeof v === "string") : [];
  if (ids.length === 0) return jsonResponse(400, { error: "O'chiriladigan akkaunt tanlanmagan." });
  if (ids.length > MAX_DELETE) return jsonResponse(400, { error: `Bir marta ko'pi bilan ${MAX_DELETE} ta.` });

  const { data: targets } = await admin.from("profiles").select("id, role").in("id", ids);
  const deletable = (targets ?? []).filter((t) => t.role !== "admin" && t.id !== callerId);

  let deleted = 0;
  for (const t of deletable) {
    const { error } = await admin.auth.admin.deleteUser(t.id);
    if (!error) deleted++;
  }
  return jsonResponse(200, { deleted });
}
