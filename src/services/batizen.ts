// Service Batizen — désormais sans Drizzle (Firebase uniquement)
// Les anciennes fonctions Drizzle ont été migrées vers Firebase Realtime Database.
// Les fonctions getQuotes/getMessages/getProjects/getMaterials ont été supprimées
// car elles n'étaient importées nulle part et retournaient systématiquement [].

export type Quote = {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string;
  surface: number;
  budget: number;
  createdAt: string;
};

export type Message = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  channel: string;
  unread: boolean;
};

export type Project = {
  id: string;
  name: string;
  clientId: string;
  status: string;
  createdAt: number;
};

export type Material = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
};

// Utilisé par src/app/(tabs)/messages/page.tsx
// TODO: migrer vers une vraie source de données Firebase
export async function getMessages(): Promise<Message[]> {
  return [];
}
