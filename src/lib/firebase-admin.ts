/**
 * Firebase Admin SDK - Initialisation côté serveur (Node.js)
 * Ce module ne doit être utilisé QUE dans les API routes (src/app/api/*)
 * 
 * Pour que ça fonctionne, configurez une des options suivantes :
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON stringifié du fichier de clé)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (chemin vers le fichier de clé)
 *
 * ⚠️ Module résilient : si les variables d'environnement sont manquantes,
 *     une erreur est loggée et les exports restent utilisables (ils throw
 *     une erreur explicite à l'usage).
 * 
 * ⚠️ SÉCURITÉ : Ne JAMAIS exposer FIREBASE_SERVICE_ACCOUNT_KEY côté client.
 *    Elle n'est accessible que dans l'environnement serveur (variables d'env).
 */

import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

/**
 * Initialise Firebase Admin SDK de manière sécurisée.
 * 
 * Ordre de priorité :
 * 1. GOOGLE_APPLICATION_CREDENTIALS — Fichier de clé (recommandé)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY — JSON stringifié (legacy)
 * 3. Application Default Credentials — Google Cloud natif
 * 
 * Retourne null si aucune configuration n'est trouvée (au lieu de throw).
 */
export function initFirebaseAdmin(): App | null {
  // Évite les initialisations multiples
  if (getApps().length > 0) return getApps()[0];

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  // Priorité 1 : Fichier de compte de service (recommandé)
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    try {
      const fs = require('fs');
      const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        console.error('❌ Firebase Admin: Fichier de compte de service invalide');
        return null;
      }
      console.log('✅ Firebase Admin SDK initialisé avec fichier de compte de service');
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL: databaseURL || undefined,
      });
    } catch (error) {
      console.error('❌ Erreur lecture fichier Firebase Admin:', error);
      return null;
    }
  }

  // Priorité 2 : Variable d'environnement JSON (legacy, à migrer)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        console.error('❌ Firebase Admin: FIREBASE_SERVICE_ACCOUNT_KEY invalide');
        return null;
      }
      console.warn('⚠️ Firebase Admin: Utilisation de FIREBASE_SERVICE_ACCOUNT_KEY (legacy). Préférez GOOGLE_APPLICATION_CREDENTIALS avec un fichier.');
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL: databaseURL || undefined,
      });
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin (env var):', error);
      return null;
    }
  }

  // Priorité 3 : Application Default Credentials (Cloud Run, GCP, etc.)
  try {
    return initializeApp({
      credential: applicationDefault(),
      databaseURL: databaseURL || undefined,
    });
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin (ADC):', error);
    return null;
  }
}

// Initialisation résiliente : si ça plante, on a quand même des exports
let firebaseApp: App | null = null;
try {
  firebaseApp = initFirebaseAdmin();
} catch (error) {
  console.error('❌ Firebase Admin SDK : erreur fatale à l\'initialisation :', error);
}

export const firebaseAdmin = firebaseApp;

// Export des services admin (avec vérification null)
export function getFirebaseAdminAuth() {
  if (!firebaseApp) throw new Error('Firebase Admin non initialisé');
  return getAuth(firebaseApp);
}

export function getFirebaseAdminDb() {
  if (!firebaseApp) throw new Error('Firebase Admin non initialisé');
  return getDatabase(firebaseApp);
}

// Exports pour compatibilité avec le code existant
// Note : ces exports peuvent être null si Firebase Admin n'est pas initialisé
export const adminAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const adminDb = firebaseApp ? getDatabase(firebaseApp) : null;

/**
 * Vérifie que Firebase Admin est initialisé avant usage.
 * Lance une erreur explicite si ce n'est pas le cas.
 */
export function ensureFirebaseAdmin(): void {
  if (!firebaseApp) {
    throw new Error('Firebase Admin non initialisé. Vérifiez FIREBASE_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS.');
  }
}

// Fonction pour vérifier les cookies de session
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