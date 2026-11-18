import type { SupabaseClient } from "@supabase/supabase-js";
import { USERNAME_PATTERN, loginToUsername, usernameBaseFromName, usernameToEmail } from "../utils/usernames";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, randomPassword } from "../utils/passwords";

export const MAX_STUDENTS = 100;

export interface StudentInput {
  fullName?: unknown;
  username?: unknown;
  password?: unknown;
}

export interface BatchResult {
  created: { index: number; fullName: string; username: string; password: string; group: string }[];
  failed: { index: number; fullName: string; error: string }[];
}

/**
 * Creates the accounts one by one. Each student gets a login and password:
 * the teacher's choice if given, otherwise generated. A problem with one
 * student never stops the others; it is reported in `failed`.
 */
export async function createStudentsBatch(
  admin: SupabaseClient,
  groupId: string,
  students: StudentInput[]
): Promise<BatchResult | { error: string }> {
  const { data: group } = await admin.from("groups").select("id, name").eq("id", groupId).maybeSingle();
  if (!group) return { error: "Guruh topilmadi." };

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  // Usernames already taken: the ones asked for, plus every one that starts
  // like a name we may have to generate (so we can add 2, 3, ...).
  const taken = new Set<string>();
  const probes = new Set<string>();
  students.forEach((s) => {
    const explicit = loginToUsername(str(s.username));
    probes.add(explicit || usernameBaseFromName(str(s.fullName)));
  });
  for (const probe of probes) {
    if (!probe) continue;
    const { data } = await admin.from("profiles").select("username").ilike("username", `${probe}%`);
    (data ?? []).forEach((r) => taken.add(String(r.username).toLowerCase()));
  }

  const created: { index: number; fullName: string; username: string; password: string; group: string }[] = [];
  const failed: { index: number; fullName: string; error: string }[] = [];

  for (let index = 0; index < students.length; index++) {
    const s = students[index];
    const fullName = str(s.fullName).replace(/\s+/g, " ");
    const fail = (error: string) => failed.push({ index, fullName: fullName || `${index + 1}-qator`, error });

    if (fullName.length < 2 || fullName.length > 60) {
      fail("Ism 2 dan 60 belgigacha bo'lsin.");
      continue;
    }

    // Login: the teacher's choice, or generated from the name.
    const requested = loginToUsername(str(s.username));
    let username = requested;
    if (requested) {
      if (!USERNAME_PATTERN.test(requested)) {
        fail("Login 3–30 belgi bo'lsin: faqat a–z, 0–9, nuqta, tire, pastki chiziq.");
        continue;
      }
      if (taken.has(requested)) {
        fail(`"${requested}" logini band. Boshqa login tanlang.`);
        continue;
      }
    } else {
      const base = usernameBaseFromName(fullName);
      username = base;
      for (let n = 2; taken.has(username); n++) username = `${base}${n}`;
    }
    taken.add(username);

    // Password: the teacher's choice, or generated.
    const requestedPassword = str(s.password);
    if (requestedPassword && (requestedPassword.length < MIN_PASSWORD_LENGTH || requestedPassword.length > MAX_PASSWORD_LENGTH)) {
      fail(`Parol ${MIN_PASSWORD_LENGTH} dan ${MAX_PASSWORD_LENGTH} belgigacha bo'lsin.`);
      taken.delete(username);
      continue;
    }
    const password = requestedPassword || randomPassword();

    const { error } = await admin.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      // must_change_password makes the student see a "choose your own password" reminder
      user_metadata: {
        username,
        full_name: fullName,
        role: "student",
        group_id: group.id,
        must_change_password: true,
      },
    });

    if (error) {
      taken.delete(username);
      fail(error.message);
    } else {
      created.push({ index, fullName, username, password, group: group.name });
    }
  }

  return { created, failed };
}
