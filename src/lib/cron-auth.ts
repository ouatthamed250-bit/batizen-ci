import { timingSafeEqualString } from "@/lib/security";

const failedAttempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Vérifie le secret CRON avec :
 * - Timing-safe comparison
 * - Rate limiting par IP (5 tentatives / 10 min)
 * - Logging des échecs
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const path = new URL(request.url).pathname;

  if (!secret || !expectedSecret || !timingSafeEqualString(secret, expectedSecret)) {
    console.error(`[CRON] 🚫 Tentative non autorisée | IP: ${ip} | Path: ${path} | Heure: ${new Date().toISOString()}`);

    const now = Date.now();
    const attempt = failedAttempts.get(ip);

    if (attempt && attempt.count >= 5 && now < attempt.resetAt) {
      return false;
    }

    failedAttempts.set(ip, {
      count: attempt ? attempt.count + 1 : 1,
      resetAt: now + 10 * 60 * 1000, // 10 minutes
    });

    return false;
  }

  // Succès : reset du compteur pour cette IP
  failedAttempts.delete(ip);
  return true;
}

// Nettoyage périodique de la Map (évite la fuite mémoire)
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of failedAttempts.entries()) {
    if (now > attempt.resetAt) {
      failedAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);