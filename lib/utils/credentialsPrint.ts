import { displayLogin } from "./usernames";

export interface NewCredential {
  fullName: string;
  username: string;
  password: string;
  group: string;
}

// The print page needs the passwords that were just created. They are never
// stored on the server in readable form, so they are handed over through
// sessionStorage (this browser tab only) and removed when the teacher is done.
const KEY = "kc-credentials-to-print";

export function saveCredentials(list: NewCredential[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadCredentials(): NewCredential[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NewCredential[]) : [];
  } catch {
    return [];
  }
}

export function clearCredentials(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function credentialsAsText(list: NewCredential[]): string {
  return list.map((c) => `${c.fullName} — login: ${displayLogin(c.username)} — parol: ${c.password}`).join("\n");
}
