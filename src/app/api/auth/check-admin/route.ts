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
 * Méthode de diagnostic/héritée : répond proprement (pas de 500/405)
 * pour ne jamais bloquer la connexion admin. La vérification réelle
 * se fait via POST (utilisé par useAuth) ou le Custom Claim Firebase.
 */
export async function GET() {
  try {
    const adminAuth = getFirebaseAdminAuth();

    if (!adminAuth) {
      return NextResponse.json({ isAdmin: false, source: "unavailable" });
    }

    return NextResponse.json({ isAdmin: false, source: "no-token" });
  } catch (error) {
    console.error("Erreur vérification admin (GET):", error);
    return NextResponse.json({ isAdmin: false });
  }
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const adminAuth = getFirebaseAdminAuth();

    // Si le SDK Admin n'est pas initialisé (variables d'env manquantes),
    // on ne renvoie PAS une 500 : le client retombe sur le Custom Claim
    // Firebase via getIdTokenResult (infalsifiable).
    if (!adminAuth) {
      return NextResponse.json({ isAdmin: false, source: "unavailable" });
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
    console.error("Erreur vérification admin:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
