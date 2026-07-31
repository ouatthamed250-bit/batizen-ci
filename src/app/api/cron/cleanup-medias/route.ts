import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { verifyCronSecret } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const adminDb = getFirebaseAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Service admin indisponible" }, { status: 503 });
    }

    const snapshot = await adminDb.ref("chantiers").get();
    if (!snapshot.exists()) {
      return NextResponse.json({ ok: true, deleted: [] });
    }

    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const deleted: string[] = [];

    const data = snapshot.val() as Record<string, Record<string, { type: string; url: string; nom: string; dateAjout: number }>>;
    for (const [chantierId, medias] of Object.entries(data)) {
      const filtered = Object.entries(medias).filter(([, m]) => now - m.dateAjout > maxAge);
      for (const [key] of filtered) {
        try {
          // Suppression DB uniquement (Cloudinary gère son propre nettoyage/purge)
          await adminDb.ref(`chantiers/${chantierId}/medias/${key}`).remove();
          deleted.push(`${chantierId}/${key}`);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    console.error("Erreur cron cleanup:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
