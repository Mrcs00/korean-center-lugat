// Shared by the browser and the server. Students sign in with a username;
// behind the scenes it becomes a stable fake email (no inbox involved).

export function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  return `${normalized}@users.korean-center-lugat.local`;
}

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/** "Nurjahon Mahmudova" -> "nurjahon.mahmudova" (Latin or Cyrillic names). */
export function usernameBaseFromName(fullName: string): string {
  const latin = fullName
    .toLowerCase()
    .split("")
    .map((ch) => (ch in CYRILLIC ? CYRILLIC[ch] : ch))
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/['’ʻʼ`‘]/g, ""); // Uzbek apostrophes: o'g'il -> ogil
  const words = latin
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  let base = words.slice(0, 2).join(".");
  if (base.length < 3) base = (base + "kc").slice(0, 3).padEnd(3, "0");
  return base.slice(0, 30);
}

// ── How logins look to people ────────────────────────────────────────────
// Students see and type logins like "nurjahon@kc.uz". "@kc.uz" is only a
// label: it is NOT a real mailbox. Underneath, the username ("nurjahon") is
// still turned into the hidden email above, so existing accounts keep working.

export const LOGIN_DOMAIN = "@kc.uz";

/** What a person typed -> the stored username ("Nurjahon@KC.uz " -> "nurjahon"). */
export function loginToUsername(input: string): string {
  let value = input.trim().toLowerCase();
  if (value.endsWith(LOGIN_DOMAIN)) value = value.slice(0, -LOGIN_DOMAIN.length);
  return value;
}

/** The stored username as people should see it ("nurjahon" -> "nurjahon@kc.uz"). */
export function displayLogin(username: string): string {
  const clean = username.replace(/^@+/, "");
  // Older accounts whose login already is an email address keep it as it is.
  return clean.includes("@") ? clean : `${clean}${LOGIN_DOMAIN}`;
}

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
