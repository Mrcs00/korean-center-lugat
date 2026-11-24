import { jsonResponse, requireAdmin } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deactivating blocks the person from signing in (their data stays); activating undoes it.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { admin, callerId } = auth;

  let body: { userId?: unknown; active?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  const active = body.active === true;

  if (userId === callerId) return jsonResponse(400, { error: "O'zingizni bloklab bo'lmaydi." });

  const { data: target } = await admin.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (!target) return jsonResponse(404, { error: "Foydalanuvchi topilmadi." });
  if (target.role === "admin") return jsonResponse(403, { error: "Admin akkauntini bloklab bo'lmaydi." });

  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
  if (error) return jsonResponse(500, { error: error.message });

  await admin.from("profiles").update({ status: active ? "active" : "inactive" }).eq("id", userId);
  return jsonResponse(200, { ok: true });
}
