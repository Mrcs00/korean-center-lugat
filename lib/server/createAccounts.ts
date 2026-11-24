import type { SupabaseClient } from "@supabase/supabase-js";
import { USERNAME_PATTERN, loginToUsername, usernameBaseFromName, usernameToEmail } from "../utils/usernames";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, randomPassword } from "../utils/passwords";

export const MAX_ACCOUNTS = 100;

export interface AccountInput {
  fullName?: unknown;
  username?: unknown;
  password?: unknown;
  phone?: unknown;
  birthDate?: unknown;
}

export interface BatchResult {
  created: { index: number; fullName: string; username: string; password: string; group: string }[];
  failed: { index: number; fullName: string; error: string }[];
}

/**
 * Creates the accounts one by one. Each gets a login and password: the admin's
 * choice if given, otherwise generated. A problem with one person never stops
 * the others; it is reported in `failed`.
 *
 * Every new account is first created as a student by the database; teachers are
 * promoted right after (only the server key can set a role).
 */
export async function createAccountsBatch(
  admin: SupabaseClient,
  role: "student" | "teacher",
  groupId: string | null,
  accounts: AccountInput[]
): Promise<BatchResult | { error: string }> {
  let groupName = "";
  if (role === "student" && groupId) {
    const { data: group } = await admin.from("groups").select("id, name").eq("id", groupId).maybeSingle();
    if (!group) return { error: "Guruh topilmadi." };
    groupName = group.name;
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  // Usernames already taken: the ones asked for, plus every one that starts
  // like a name we may have to generate (so we can add 2, 3, ...).
  const taken = new Set<string>();
  const probes = new Set<string>();
  accounts.forEach((s) => {
    const explicit = loginToUsername(str(s.username));
    probes.add(explicit || usernameBaseFromName(str(s.fullName)));
  });
  for (const probe of probes) {
    if (!probe) continue;
    const { data } = await admin.from("profiles").select("username").ilike("username", `${probe}%`);
    (data ?? []).forEach((r) => taken.add(String(r.username).toLowerCase()));
  }

  const created: BatchResult["created"] = [];
  const failed: BatchResult["failed"] = [];

  for (let index = 0; index < accounts.length; index++) {
    const s = accounts[index];
    const fullName = str(s.fullName).replace(/\s+/g, " ");
    const fail = (error: string) => failed.push({ index, fullName: fullName || `${index + 1}-qator`, error });

    if (fullName.length < 2 || fullName.length > 60) {
      fail("Ism 2 dan 60 belgigacha bo'lsin.");
      continue;
    }

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

    const requestedPassword = str(s.password);
    if (requestedPassword && (requestedPassword.length < MIN_PASSWORD_LENGTH || requestedPassword.length > MAX_PASSWORD_LENGTH)) {
      fail(`Parol ${MIN_PASSWORD_LENGTH} dan ${MAX_PASSWORD_LENGTH} belgigacha bo'lsin.`);
      taken.delete(username);
      continue;
    }
    const password = requestedPassword || randomPassword();

    const phone = str(s.phone);
    const birthDate = /^\d{4}-\d{2}-\d{2}$/.test(str(s.birthDate)) ? str(s.birthDate) : "";

    const { data, error } = await admin.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        role: "student", // the database makes every new account a student anyway
        ...(role === "student" && groupId ? { group_id: groupId } : {}),
        ...(phone ? { phone } : {}),
        ...(birthDate ? { birth_date: birthDate } : {}),
        must_change_password: true, // shows the "choose your own password" reminder
      },
    });

    if (error || !data.user) {
      taken.delete(username);
      fail(error?.message ?? "Akkaunt yaratilmadi.");
      continue;
    }

    if (role === "teacher") {
      const { error: roleError } = await admin.from("profiles").update({ role: "teacher" }).eq("id", data.user.id);
      if (roleError) {
        // do not leave a half-made account behind
        await admin.auth.admin.deleteUser(data.user.id);
        taken.delete(username);
        fail(`Ustoz roli berilmadi: ${roleError.message}`);
        continue;
      }
    }

    created.push({ index, fullName, username, password, group: groupName });
  }

  return { created, failed };
}
