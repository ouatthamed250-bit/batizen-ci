// Service Batizen — désormais sans Drizzle (Firebase uniquement)
// Les anciennes fonctions Drizzle ont été migrées vers Firebase Realtime Database.

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

// Fonctions vides en attendant connexion Firebase
export async function getQuotes(): Promise<Quote[]> {
  return [];
}

export async function getMessages(): Promise<Message[]> {
  return [];
}

export async function getProjects(): Promise<Project[]> {
  return [];
}

export async function getMaterials(): Promise<Material[]> {
  return [];
}