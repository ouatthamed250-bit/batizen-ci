/**
 * POST /api/auth/make-admin
 *
 * ✅ Vérifie un code secret (MAKE_ME_ADMIN_SECRET) côté serveur
 * ✅ Vérifie l'idToken Firebase
 * ✅ Définit le custom claim { role: 'admin' } + synchronise RTDB
 * ✅ Anti-brute-force par IP (5 tentatives échouées en 10 min → 429)
 */

console.log("[DEBUG] make-admin route.ts module loaded at top-level");
import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { timingSafeEqualString } from "@/lib/security";
import { makeAdminSchema } from "@/lib/validation";

// ---- Anti-brute-force : Map<IP, { count, firstAttempt }> ----
const ipAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);

  if (!entry) {
    ipAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Si la fenêtre est expirée, on réinitialise
  if (now - entry.firstAttempt > WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  // Si la fenêtre est active et le seuil dépassé, on bloque
  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  // Sinon on incrémente
  entry.count += 1;
  return true;
}

function resetRateLimit(ip: string): void {
  ipAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  console.log("[DEBUG] make-admin POST handler called");
  try {
    // 1. Récupération IP (headers proxy ou direct)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // 2. Vérification anti-brute-force
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 10 minutes." },
        { status: 429 }
      );
    }

    // 3. Parsing du body avec validation Zod
    const body = await request.json();
    const parseResult = makeAdminSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { idToken, secret: code } = parseResult.data;

    if (!idToken || !code) {
      return NextResponse.json(
        { error: "idToken et code requis." },
        { status: 400 }
      );
    }

    // 4. Vérification du code secret (côté serveur uniquement)
    const secret = process.env.MAKE_ME_ADMIN_SECRET;
    if (!secret) {
      console.error("❌ MAKE_ME_ADMIN_SECRET non défini dans .env.local");
      return NextResponse.json(
        { error: "Erreur de configuration serveur." },
        { status: 500 }
      );
    }

    if (!timingSafeEqualString(code, secret)) {
      return NextResponse.json(
        { error: "Code secret invalide." },
        { status: 403 }
      );
    }

    // 5. Vérification de l'idToken Firebase
    const adminAuth = getFirebaseAdminAuth();
    // SDK Admin non initialisé → JSON explicite (jamais de HTML/500)
    if (!adminAuth) {
      console.warn("[make-admin] Firebase Admin indisponible (env vars manquantes)");
      return NextResponse.json(
        { error: "Service admin indisponible." },
        { status: 503 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Token invalide ou expiré." },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // 6. Définition du custom claim { role: 'admin' }
    try {
      await adminAuth.setCustomUserClaims(uid, { role: "admin" });
    } catch (err) {
      console.error("❌ Erreur setCustomUserClaims:", err);
      return NextResponse.json(
        { error: "Erreur lors de la définition du rôle admin." },
        { status: 500 }
      );
    }

    // 7. Synchronisation du rôle dans la Realtime Database
    try {
      const { getDatabase } = await import("firebase-admin/database");
      const adminDb = getDatabase();
      await adminDb.ref(`users/${uid}/role`).set("admin");
    } catch (err) {
      console.error("❌ Erreur synchronisation RTDB:", err);
      // On continue car le custom claim est l'essentiel
    }

    // 8. Succès : on réinitialise le compteur de l'IP
    resetRateLimit(ip);

    return NextResponse.json({
      success: true,
      message: "✅ Tu es admin. Déconnecte-toi et reconnecte-toi.",
      uid,
    });
  } catch (err) {
    // Ne JAMAIS renvoyer de HTML : erreur → JSON explicite
    console.error("❌ Erreur make-admin:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}