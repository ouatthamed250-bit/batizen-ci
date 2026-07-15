import { rtdbGet } from "./rtdb";

// Code admin par défaut - devrait être remplacé par une variable d'environnement en production
const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "BATIZEN2026";
const COOKIE_NAME = "batizen_admin";
const SESSION_KEY = "batizen_admin_session";
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

/** Lit le code secret depuis la collection admin_config (fallback local). */
export async function getAdminCode(): Promise<string> {
  const cfg = await rtdbGet<{ code_secret?: string }>("admin_config");
  return cfg?.code_secret || ADMIN_CODE;
}

/** Vérifie les tentatives de connexion pour prévenir les attaques par force brute */
function checkLoginAttempts(): boolean {
  if (typeof window === "undefined") return false;
  
  const attempts = parseInt(localStorage.getItem("admin_attempts") || "0");
  const lastAttempt = parseInt(localStorage.getItem("admin_last_attempt") || "0");
  const now = Date.now();
  
  // Réinitialiser si le délai de verrouillage est passé
  if (now - lastAttempt > LOCKOUT_TIME) {
    localStorage.removeItem("admin_attempts");
    localStorage.removeItem("admin_last_attempt");
    return true;
  }
  
  // Vérifier si trop de tentatives
  if (attempts >= MAX_ATTEMPTS) {
    return false;
  }
  
  return true;
}

/** Enregistre une tentative de connexion échouée */
function recordFailedAttempt(): void {
  if (typeof window === "undefined") return;
  
  const attempts = parseInt(localStorage.getItem("admin_attempts") || "0");
  localStorage.setItem("admin_attempts", String(attempts + 1));
  localStorage.setItem("admin_last_attempt", String(Date.now()));
}

/** Réinitialise les tentatives après une connexion réussie */
function resetAttempts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_attempts");
  localStorage.removeItem("admin_last_attempt");
}

/** Vérifie un code saisi et ouvre la session admin si correct. */
export async function verifyAdminCode(code: string): Promise<boolean> {
  // Vérifier les tentatives de connexion
  if (!checkLoginAttempts()) {
    throw new Error("Trop de tentatives. Réessayez dans 15 minutes.");
  }
  
  const expected = await getAdminCode();
  if (code.trim().toUpperCase() === expected.toUpperCase()) {
    // Cookie avec sécurités supplémentaires
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
    localStorage.setItem(SESSION_KEY, "1");
    resetAttempts();
    return true;
  }
  
  // Enregistrer la tentative échouée
  recordFailedAttempt();
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