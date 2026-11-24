import { jsonResponse, requireAdmin } from "@/lib/server/supabaseAdmin";
import { MAX_ACCOUNTS, AccountInput, createAccountsBatch } from "@/lib/server/createAccounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin creates student or teacher accounts.
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: { role?: unknown; groupId?: unknown; accounts?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }

  const role = body.role === "teacher" ? "teacher" : "student";
  const groupId = typeof body.groupId === "string" && body.groupId ? body.groupId : null;
  const accounts = Array.isArray(body.accounts) ? (body.accounts as AccountInput[]) : [];

  if (accounts.length === 0) return jsonResponse(400, { error: "Kamida bitta ism kiriting." });
  if (accounts.length > MAX_ACCOUNTS) return jsonResponse(400, { error: `Bir marta ko'pi bilan ${MAX_ACCOUNTS} ta.` });

  const result = await createAccountsBatch(auth.admin, role, groupId, accounts);
  if ("error" in result) return jsonResponse(400, { error: result.error });
  return jsonResponse(200, result);
}
