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

export function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every((value) => Boolean(value));
}

// Initialize Firebase safely
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseDatabase: Database;
let firebaseStorage: FirebaseStorage;
let firebaseGoogleProvider: GoogleAuthProvider;

try {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
  firebaseDatabase = getDatabase(firebaseApp);
  firebaseStorage = getStorage(firebaseApp);
  firebaseGoogleProvider = new GoogleAuthProvider();
  firebaseGoogleProvider.setCustomParameters({ prompt: "select_account" });
} catch (error) {
  console.warn("⚠️ Erreur d'initialisation Firebase:", error);
  // Create minimal stubs to prevent crashes
  firebaseApp = null as unknown as FirebaseApp;
  firebaseAuth = null as unknown as Auth;
  firebaseDatabase = null as unknown as Database;
  firebaseStorage = null as unknown as FirebaseStorage;
  firebaseGoogleProvider = null as unknown as GoogleAuthProvider;
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
