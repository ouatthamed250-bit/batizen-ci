import { NextResponse } from "next/server";
import { database } from "@/lib/firebase";
import { timingSafeEqualString } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;
  // 🔒 Comparaison à temps constant pour éviter une timing attack permettant
  // de deviner CRON_SECRET caractère par caractère via le temps de réponse.
  if (!secret || !expectedSecret || !timingSafeEqualString(secret, expectedSecret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    if (!database) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 500 });
    }

    const { ref: dbRef, get, remove } = await import("firebase/database");
    const snapshot = await get(dbRef(database, "chantiers"));
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
          await remove(dbRef(database, `chantiers/${chantierId}/medias/${key}`));
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
