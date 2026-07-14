import type { GoogleServiceStatus } from "@/types/batizen";

export function getGoogleServiceStatus(): GoogleServiceStatus[] {
  return [
    {
      label: "Firebase Authentication",
      description: "Connexion Google prête via Firebase Auth.",
      enabled: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    },
    {
      label: "Realtime Database",
      description: "Synchronisation instantanée des notifications et messages.",
      enabled: Boolean(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
    },
    {
      label: "Cloud Storage",
      description: "Stockage des images chantier, reçus et documents.",
      enabled: Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    },
  ];
}
