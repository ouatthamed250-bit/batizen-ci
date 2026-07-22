/**
 * Firebase Admin SDK - Initialisation côté serveur (Node.js)
 * Ce module ne doit être utilisé QUE dans les API routes (src/app/api/*)
 * 
 * Pour que ça fonctionne, configurez une des options suivantes :
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON stringifié du fichier de clé)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (chemin vers le fichier de clé)
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

let adminApp: App | undefined;

// Initialisation unique de Firebase Admin
if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (error) {
      console.error('Erreur initialisation Firebase Admin:', error);
      throw new Error('Configuration Firebase Admin invalide. Vérifiez FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  } else {
    // Fallback vers Application Default Credentials
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        } as any),
        databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (error) {
      console.error('Erreur initialisation Firebase Admin (ADC):', error);
      throw new Error('Configuration Firebase Admin manquante. Configurez FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }
} else {
  adminApp = getApps()[0];
}

// Export des services admin
export const adminAuth = getAuth(adminApp);
export const adminDb = getDatabase(adminApp);

// Fonction pour vérifier les cookies de session
export async function verifySessionCookie(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) return false;
  
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.role === 'admin';
  } catch {
    return false;
  }
}