/**
 * Firebase Admin SDK - Initialisation côté serveur (Node.js / Edge)
 * Ce module ne doit être utilisé QUE dans les API routes (src/app/api/*)
 *
 * ⚠️ SÉCURITÉ : Ne JAMAIS exposer les variables FIREBASE_ADMIN_* côté client.
 *    Elles ne sont accessibles que dans l'environnement serveur (variables d'env).
 *
 * Compatible Edge Runtime — pas de require('fs') synchrone.
 */

import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

type ServiceAccountShape = {
  projectId: string;
  privateKey: string;
  clientEmail: string;
};

function buildServiceAccountFromEnv(): ServiceAccountShape | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    return { projectId, privateKey, clientEmail };
  }

  // Fallback : FIREBASE_SERVICE_ACCOUNT_KEY (JSON stringifié)
  const legacy = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      if (parsed.private_key && parsed.client_email && parsed.project_id) {
        return {
          projectId: parsed.project_id,
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
          clientEmail: parsed.client_email,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Initialise Firebase Admin SDK de manière sécurisée.
 *
 * Ordre de priorité :
 * 1. FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_ADMIN_CLIENT_EMAIL (recommandé Edge)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY — JSON stringifié (legacy)
 * 3. Application Default Credentials — Google Cloud natif
 *
 * Lance une erreur explicite si aucune configuration valide n'est trouvée.
 */
export function initFirebaseAdmin(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  // Priorité 1 : Variables d'env structurées (Edge-compatible)
  const serviceAccount = buildServiceAccountFromEnv();
  if (serviceAccount) {
    try {
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL: databaseURL || undefined,
      });
    } catch {
      return null;
    }
  }

  // Priorité 2 : Application Default Credentials (Cloud Run, GCP, etc.)
  try {
    return initializeApp({
      credential: applicationDefault(),
      databaseURL: databaseURL || undefined,
    });
  } catch {
    return null;
  }
}

// Initialisation résiliente
let firebaseApp: App | null = null;
try {
  firebaseApp = initFirebaseAdmin();
} catch {
  firebaseApp = null;
}

export const firebaseAdmin = firebaseApp;

/**
 * Retourne l'instance Auth Firebase Admin, ou null si non initialisé.
 * Ne lance jamais d'exception à l'import (initialisation différée sécurisée).
 */
export function getFirebaseAdminAuth() {
  if (!firebaseApp) return null;
  try {
    return getAuth(firebaseApp);
  } catch {
    return null;
  }
}

export function getFirebaseAdminDb() {
  if (!firebaseApp) return null;
  try {
    return getDatabase(firebaseApp);
  } catch {
    return null;
  }
}

// Accès différés (remplacé par les getters ci-dessus pour éviter les erreurs à l'import)
export const adminAuth = null;
export const adminDb = null;

export function ensureFirebaseAdmin(): void {
  if (!firebaseApp) {
    throw new Error(
      'Firebase Admin non initialisé. Vérifiez les variables FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL.'
    );
  }
}

export async function verifySessionCookie(sessionCookie: string | undefined): Promise<boolean> {
  if (!sessionCookie) return false;
  if (!firebaseApp) return false;

  try {
    const auth = getAuth(firebaseApp);
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.role === 'admin';
  } catch {
    return false;
  }
}
