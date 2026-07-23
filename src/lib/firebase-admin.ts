/**
 * Firebase Admin SDK - Initialisation côté serveur (Node.js)
 * Ce module ne doit être utilisé QUE dans les API routes (src/app/api/*)
 * 
 * Pour que ça fonctionne, configurez une des options suivantes :
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (JSON stringifié du fichier de clé)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (chemin vers le fichier de clé)
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
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY — JSON stringifié (recommandé pour développement local/Vercel)
 * 2. GOOGLE_APPLICATION_CREDENTIALS — Chemin vers fichier de clé (Google Cloud natif)
 * 
 * Lève une erreur explicite si aucune configuration n'est trouvée.
 */
function initFirebaseAdmin(): App {
  // Évite les initialisations multiples
  if (getApps().length > 0) return getApps()[0];

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Option 1 : Clé de service directe (JSON stringifié)
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      // Validation minimale : s'assurer que les champs requis sont présents
      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_KEY invalide : ' +
          'le JSON doit contenir private_key, client_email et project_id'
        );
      }

      console.log('✅ Firebase Admin SDK initialisé avec FIREBASE_SERVICE_ACCOUNT_KEY');
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL,
      });
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin (clé de service):', error);
      throw new Error(
        'Configuration Firebase Admin invalide. ' +
        'Vérifiez que FIREBASE_SERVICE_ACCOUNT_KEY contient un JSON de clé de service valide.'
      );
    }
  }

  // Option 2 : Application Default Credentials (Google Cloud, Cloud Run, etc.)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      console.log('✅ Firebase Admin SDK initialisé avec GOOGLE_APPLICATION_CREDENTIALS');
      return initializeApp({
        credential: applicationDefault(),
        databaseURL,
      });
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin (ADC):', error);
      throw new Error(
        'Configuration Firebase Admin invalide. ' +
        'Vérifiez que GOOGLE_APPLICATION_CREDENTIALS pointe vers un fichier de clé valide.'
      );
    }
  }

  // Aucune configuration trouvée
  throw new Error(
    '❌ Firebase Admin SDK : configuration manquante.\n\n' +
    'Configurez l\'une des variables d\'environnement suivantes :\n' +
    '  1. FIREBASE_SERVICE_ACCOUNT_KEY — JSON stringifié de la clé de service Firebase\n' +
    '  2. GOOGLE_APPLICATION_CREDENTIALS — Chemin vers le fichier JSON de la clé de service\n\n' +
    'Pour générer une clé de service :\n' +
    '  Firebase Console → Paramètres du projet → Comptes de service → Générer une clé privée'
  );
}

export const firebaseAdmin = initFirebaseAdmin();

// Export des services admin
export const adminAuth = getAuth(firebaseAdmin);
export const adminDb = getDatabase(firebaseAdmin);

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
