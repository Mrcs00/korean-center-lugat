import { usernameBaseFromName, usernameToEmail } from "@/lib/utils/usernames";
import { generatePassword, jsonResponse, requireTeacher } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NAMES = 100;

// Creates student accounts for a teacher: one username + password per name,
// all placed in the chosen group. Passwords are returned once and never stored
// in readable form anywhere.
export async function POST(request: Request) {
  const auth = await requireTeacher(request);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  let body: { names?: unknown; groupId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: "So'rov noto'g'ri." });
  }

  const names = Array.isArray(body.names)
    ? body.names.map((n) => String(n).trim().replace(/\s+/g, " ")).filter(Boolean)
    : [];
  const groupId = typeof body.groupId === "string" ? body.groupId : "";

  if (names.length === 0) return jsonResponse(400, { error: "Kamida bitta ism kiriting." });
  if (names.length > MAX_NAMES) return jsonResponse(400, { error: `Bir marta ko'pi bilan ${MAX_NAMES} ta.` });
  if (names.some((n) => n.length < 2 || n.length > 60)) {
    return jsonResponse(400, { error: "Har bir ism 2 dan 60 belgigacha bo'lsin." });
  }

  const { data: group } = await admin.from("groups").select("id, name").eq("id", groupId).maybeSingle();
  if (!group) return jsonResponse(400, { error: "Guruh topilmadi." });

  // Usernames already taken (so we can add 2, 3, ... where needed).
  const taken = new Set<string>();
  const bases = [...new Set(names.map(usernameBaseFromName))];
  for (const base of bases) {
    const { data } = await admin.from("profiles").select("username").ilike("username", `${base}%`);
    (data ?? []).forEach((r) => taken.add(String(r.username).toLowerCase()));
  }

  const created: { fullName: string; username: string; password: string; group: string }[] = [];
  const failed: { fullName: string; error: string }[] = [];

  for (const fullName of names) {
    const base = usernameBaseFromName(fullName);
    let username = base;
    for (let n = 2; taken.has(username); n++) username = `${base}${n}`;
    taken.add(username);

    const password = generatePassword();
    const { error } = await admin.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName, role: "student", group_id: group.id },
    });

    if (error) failed.push({ fullName, error: error.message });
    else created.push({ fullName, username, password, group: group.name });
  }

  return jsonResponse(200, { created, failed });
}
