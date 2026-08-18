"use client";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { ref, set } from "firebase/database";
import { app, database } from "./firebase";

/**
 * Demande la permission de notification au navigateur et récupère le token FCM
 * de cet appareil. Retourne null si refusé, non supporté, ou en cas d'erreur.
 */
export async function requestPushPermission(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[push] Firebase Messaging non supporté sur ce navigateur.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[push] Permission de notification refusée.");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (err) {
    console.error("[push] Erreur lors de la récupération du token FCM:", err);
    return null;
  }
}

/**
 * Enregistre le token FCM d'un appareil dans Firebase, sous fcmTokens/{userId}/{token}.
 * Utiliser le token comme clé évite les doublons si appelé plusieurs fois.
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    await set(ref(database, `fcmTokens/${userId}/${token}`), {
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("[push] Erreur lors de l'enregistrement du token:", err);
  }
}