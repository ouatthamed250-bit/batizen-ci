import { NextResponse } from "next/server";
import { database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
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

    // Récupérer tous les RDV confirmés
    const rdvsSnapshot = await get(ref(database, "rendezvous"));
    if (!rdvsSnapshot.exists()) {
      return NextResponse.json({ ok: true, notificationsSent: 0, message: "Aucun RDV trouvé" });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const rdvs = rdvsSnapshot.val() as Record<string, any>;
    let notificationsSent = 0;

    for (const [rdvId, rdvData] of Object.entries(rdvs)) {
      if (!rdvData.date) continue;
      
      // Normaliser la date
      const rdvDate = rdvData.date.split('T')[0] || rdvData.date;
      
      // Vérifier si le RDV est confirmé et dans 24h
      if ((rdvData.statut === "confirme_client" || rdvData.statut === "confirme_admin") && 
          rdvDate === tomorrowStr && 
          rdvData.actif !== false) {
        
        const userId = rdvData.clientId;
        
        if (userId) {
          // Notifier le client
          await set(ref(database, `notifications/${userId}/notif_rdv_${rdvId}`), {
            type: "rappel_rdv",
            chantierId: rdvData.chantierId,
            message: `🔔 Rappel : Vous avez un rendez-vous de prévu demain à ${rdvData.heure || ''}. Lieu : ${rdvData.lieu || 'À confirmer'}`,
            dateCreation: Date.now(),
            lu: false
          });
          notificationsSent++;
        }

        // Notifier l'admin
        await set(ref(database, `notifications/admin/notif_rdv_${rdvId}`), {
          type: "rappel_rdv",
          chantierId: rdvData.chantierId,
          userId: rdvData.clientId,
          message: `Rappel RDV : Le client a un rendez-vous de demain pour le chantier ${rdvData.chantierId?.substring(0, 8)}`,
          dateCreation: Date.now(),
          lu: false
        });
        notificationsSent++;
      }
    }

    return NextResponse.json({
      ok: true,
      notificationsSent,
      date: tomorrowStr,
      message: `✅ ${notificationsSent} notifications de rappel envoyées pour les RDV de demain`
    });
  } catch (error) {
    console.error("Erreur cron rappel RDV:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}