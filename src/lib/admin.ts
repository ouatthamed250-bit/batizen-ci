import { rtdbGet } from "./rtdb";

const ADMIN_CODE = "BATIZEN2026";
const COOKIE_NAME = "batizen_admin";
const SESSION_KEY = "batizen_admin_session";

/** Lit le code secret depuis la collection admin_config (fallback local). */
export async function getAdminCode(): Promise<string> {
  const cfg = await rtdbGet<{ code_secret?: string }>("admin_config");
  return cfg?.code_secret || ADMIN_CODE;
}

/** Vérifie un code saisi et ouvre la session admin si correct. */
export async function verifyAdminCode(code: string): Promise<boolean> {
  const expected = await getAdminCode();
  if (code.trim().toUpperCase() === expected.toUpperCase()) {
    // Cookie lisible par le middleware (non httpOnly volontairement).
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 7}`;
    localStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  localStorage.removeItem(SESSION_KEY);
}