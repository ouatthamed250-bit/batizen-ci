console.log("[DEBUG] check-admin route.ts module loaded at top-level");
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

// Whitelist d'UIDs admin — UNIQUEMENT côté serveur, jamais exposée au client
const ADMIN_UIDS = new Set([
  "p0dGVFkLRAOrWfGmq9hSBoZKXb22",
  "aaGhSvV60KTntvVaZxIT6AKfTD43",
]);

/**
 * GET /api/auth/check-admin
 *
 * Méthode de diagnostic/héritée : répond toujours 200, jamais 500.
 * La vérification réelle se fait via POST (utilisé par useAuth) ou le
 * Custom Claim Firebase (getIdTokenResult, infalsifiable).
 */
export async function GET(request: Request) {
  console.log("[DEBUG] check-admin GET handler called");
  console.log(`[check-admin] ${request.method} appelé à`, new Date().toISOString());
  console.log("[check-admin] handler appelé (GET)");
  try {
    const adminAuth = getFirebaseAdminAuth();

    // SDK Admin non initialisé → JSON explicite, jamais de page d'erreur HTML
    if (!adminAuth) {
      console.warn("[check-admin] Firebase Admin indisponible (env vars manquantes)");
      return NextResponse.json(
        { isAdmin: false, error: "Service admin indisponible" },
        { status: 503 }
      );
    }

    return NextResponse.json({ isAdmin: false, source: "no-token" });
  } catch (error) {
    // Ne JAMAIS renvoyer de HTML : échec silencieux → JSON
    console.error("[check-admin] Erreur GET:", error);
    return NextResponse.json({ isAdmin: false });
  }
}

/**
 * POST /api/auth/check-admin
 *
 * RÈGLE D'OR : cette route ne renvoie JAMAIS de 500. Quoi qu'il arrive
 * (body mal formé, SDK Admin non initialisé, token invalide), elle
 * répond 200 avec `{ isAdmin: false }` — jamais de statut d'erreur.
 */
export async function POST(request: Request) {
  console.log("[DEBUG] check-admin POST handler called");
  console.log(`[check-admin] ${request.method} appelé à`, new Date().toISOString());
  console.log("[check-admin] handler appelé (POST)");
  try {
    // Lecture sécurisée du body : ne throw JAMAIS (pas de request.json()).
    const bodyText = await request.text();
    let idToken: string | undefined;

    try {
      const parsed = bodyText ? JSON.parse(bodyText) : {};
      idToken = typeof parsed?.idToken === "string" ? parsed.idToken : undefined;
    } catch {
      idToken = undefined; // body invalide → non-admin silencieux
    }

    if (!idToken) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminAuth = getFirebaseAdminAuth();

    // SDK Admin non initialisé → JSON explicite, jamais de page d'erreur HTML
    if (!adminAuth) {
      console.warn("[check-admin] Firebase Admin indisponible (env vars manquantes)");
      return NextResponse.json(
        { isAdmin: false, error: "Service admin indisponible" },
        { status: 503 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    // Vérification 1 : Custom Claims Firebase
    if (decoded.role === "admin") {
      return NextResponse.json({ isAdmin: true, source: "claims" });
    }

    // Vérification 2 : Whitelist serveur
    if (ADMIN_UIDS.has(decoded.uid)) {
      return NextResponse.json({ isAdmin: true, source: "whitelist" });
    }

    return NextResponse.json({ isAdmin: false });
  } catch (error) {
    // Ne JAMAIS renvoyer de HTML : échec silencieux → JSON
    console.error("[check-admin] Erreur POST:", error);
    return NextResponse.json({ isAdmin: false });
  }
}