import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Interface unifiée des services Firebase.
 * 
 * Utilisation recommandée :
 *   import { getFirebaseServices } from '@/lib/firebase';
 *   const { db, auth, storage } = getFirebaseServices();
 * 
 * Au lieu de :
 *   import { getDatabase } from 'firebase/database'; // ❌ À ÉVITER
 *   const db = getDatabase();                         // crée une nouvelle instance
 */
export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  /** Alias de `database` pour plus de clarté */
  db: Database;
  /** Ancien nom, conservé pour rétrocompatibilité */
  database: Database;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Vérifie que les variables d'env Firebase critiques sont présentes et non vides. Lance une erreur sinon. */
function validateFirebaseConfig(): void {
  const required = ["apiKey", "authDomain", "projectId"] as const;
  for (const key of required) {
    const value = firebaseConfig[key];
    if (!value) {
      throw new Error(
        `[Firebase Init] Variable manquante : NEXT_PUBLIC_FIREBASE_${key
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()}. Vérifiez votre .env.local`
      );
    }
  }
}

export function hasFirebaseConfig(): boolean {
  try {
    validateFirebaseConfig();
    return true;
  } catch {
    return false;
  }
}

// Initialisation stricte — throw immédiat si config invalide
validateFirebaseConfig();

const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firebaseAuth: Auth = getAuth(firebaseApp);
const firebaseDatabase: Database = getDatabase(firebaseApp);
const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);
const firebaseGoogleProvider: GoogleAuthProvider = new GoogleAuthProvider();
firebaseGoogleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Vérifie si Firebase est correctement initialisé.
 * À utiliser avant tout appel aux services Firebase.
 */
export function isFirebaseReady(): boolean {
  return true;
}

export const app = firebaseApp;
export const auth = firebaseAuth;
export const database = firebaseDatabase;
export const storage = firebaseStorage;
export const googleProvider = firebaseGoogleProvider;

export function getFirebaseServices(): FirebaseServices {
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDatabase,
    database: firebaseDatabase,
    storage: firebaseStorage,
    googleProvider: firebaseGoogleProvider,
  };
}
