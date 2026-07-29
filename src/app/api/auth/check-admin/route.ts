import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

// Whitelist d'UIDs admin — UNIQUEMENT côté serveur, jamais exposée au client
const ADMIN_UIDS = new Set([
  "p0dGVFkLRAOrWfGmq9hSBoZKXb22",
  "aaGhSvV60KTntvVaZxIT6AKfTD43",
]);

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const adminAuth = getFirebaseAdminAuth();
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