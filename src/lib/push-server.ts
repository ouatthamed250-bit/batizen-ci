import { getMessaging } from 'firebase-admin/messaging';
import { firebaseAdmin, getFirebaseAdminDb } from './firebase-admin';

/**
 * Envoie un push a tous les tokens FCM enregistres dans fcmTokens/.
 * Server-only. Ne fait jamais echouer l'appelant si l'envoi echoue.
 */
export async function sendPushToAllDevices(title: string, body: string, url: string = '/'): Promise<void> {
  if (!firebaseAdmin) {
    console.error('[push-server] Firebase Admin non initialise, envoi push annule.');
    return;
  }

  try {
    const db = getFirebaseAdminDb();
    if (!db) return;

    const snapshot = await db.ref('fcmTokens').once('value');
    const data = snapshot.val() as Record<string, Record<string, unknown>> | null;
    if (!data) return;

    const tokens: string[] = [];
    for (const userId of Object.keys(data)) {
      const userTokens = data[userId];
      if (userTokens) tokens.push(...Object.keys(userTokens));
    }

    if (tokens.length === 0) return;

    const messaging = getMessaging(firebaseAdmin);
    await Promise.allSettled(
      tokens.map((token) =>
        messaging.send({
          token,
          notification: { title, body },
          data: { url },
        })
      )
    );
  } catch (err) {
    console.error('[push-server] Erreur lors de l\'envoi du push:', err);
  }
}