import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
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

export function getFirebaseServices(): FirebaseServices {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase configuration is incomplete");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  return {
    app,
    auth: getAuth(app),
    database: getDatabase(app),
    storage: getStorage(app),
    googleProvider,
  };
}
