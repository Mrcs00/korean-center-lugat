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
