import { ref, set, update, get, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "./firebase";

export type NotificationType = 
  | "nouveau_chantier"
  | "chantier_active"
  | "chantier_termine"
  | "nouveau_message"
  | "nouvelle_photo"
  | "paiement_recu"
  | "promotion"
  | "nouveau_rdv"
  | "confirme_rdv"
  | "rappel_rdv";

export type Notification = {
  id: string;
  type: NotificationType;
  chantierId?: string;
  chantierNom?: string;
  message: string;
  dateCreation: number;
  lu: boolean;
  userId?: string;
  userName?: string;
  planChoisi?: string;
};

/** Données brutes d'une notification depuis Firebase (sans l'id qui est la clé). */
type NotificationData = Omit<Notification, "id">;

/** Génère un ID unique via Web Crypto API. */
function generateNotifId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback ancien navigateur (très rare)
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Normalise les entrées Firebase en tableau de Notification. */
function normaliserNotifications(data: Record<string, unknown>): Notification[] {
  return Object.entries(data)
    .filter(([key]) => key !== "id")
    .map(([id, val]) => ({ id, ...(val as NotificationData) } as Notification))
    .sort((a, b) => b.dateCreation - a.dateCreation);
}

// Envoyer une notification à un utilisateur
export async function sendNotification(userId: string, notification: {
  type: NotificationType;
  chantierId?: string;
  chantierNom?: string;
  message: string;
}): Promise<string | null> {
  try {
    const { database } = getFirebaseServices();
    const notifId = generateNotifId();
    await set(ref(database, `notifications/${userId}/${notifId}`), {
      ...notification,
      dateCreation: Date.now(),
      lu: false,
    });
    return notifId;
  } catch {
    return null;
  }
}

// Envoyer une notification à l'admin
export async function sendAdminNotification(notification: {
  type: NotificationType;
  chantierId?: string;
  userId?: string;
  userName?: string;
  planChoisi?: string;
  message: string;
}): Promise<string | null> {
  try {
    const { database } = getFirebaseServices();
    const notifId = generateNotifId();
    await set(ref(database, `notifications/admin/${notifId}`), {
      ...notification,
      dateCreation: Date.now(),
      lu: false,
    });
    return notifId;
  } catch {
    return null;
  }
}

// Marquer une notification comme lue
export async function markAsRead(userId: string, notifId: string): Promise<void> {
  try {
    const { database } = getFirebaseServices();
    await update(ref(database, `notifications/${userId}/${notifId}`), {
      lu: true,
    });
  } catch {
    // Silencieux
  }
}

// Marquer toutes les notifications comme lues
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const { database } = getFirebaseServices();
    const snapshot = await get(ref(database, `notifications/${userId}`));
    const data = snapshot.val() as Record<string, unknown> | null;
    
    if (!data) return;
    
    const updates: Record<string, boolean> = {};
    Object.keys(data).forEach((notifId) => {
      updates[`notifications/${userId}/${notifId}/lu`] = true;
    });
    
    await update(ref(database), updates);
  } catch {
    // Silencieux
  }
}

// Récupérer les notifications d'un utilisateur
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { database } = getFirebaseServices();
    const snapshot = await get(ref(database, `notifications/${userId}`));
    const data = (snapshot.val() as Record<string, unknown>) || {};
    return normaliserNotifications(data);
  } catch {
    return [];
  }
}

// Récupérer les notifications non lues
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const { database } = getFirebaseServices();
    const snapshot = await get(ref(database, `notifications/${userId}`));
    const data = (snapshot.val() as Record<string, unknown>) || {};
    return normaliserNotifications(data).filter((n) => !n.lu);
  } catch {
    return [];
  }
}

// Souscrire aux notifications en temps réel
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const { database } = getFirebaseServices();
  const notifRef = ref(database, `notifications/${userId}`);
  
  return onValue(notifRef, (snapshot) => {
    const data = (snapshot.val() as Record<string, unknown>) || {};
    callback(normaliserNotifications(data));
  });
}

// Souscrire aux notifications admin
export function subscribeToAdminNotifications(
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const { database } = getFirebaseServices();
  const notifRef = ref(database, `notifications/admin`);
  
  return onValue(notifRef, (snapshot) => {
    const data = (snapshot.val() as Record<string, unknown>) || {};
    callback(normaliserNotifications(data));
  });
}

// Formater la date relative
export function formatNotificationDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: days > 365 ? "numeric" : undefined,
  });
}

// Obtenir l'icône selon le type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "chantier_active":
      return "✅";
    case "chantier_termine":
      return "🎉";
    case "nouveau_message":
      return "💬";
    case "nouvelle_photo":
      return "📸";
    case "paiement_recu":
      return "💰";
    case "promotion":
      return "🎁";
    case "nouveau_rdv":
      return "📅";
    case "confirme_rdv":
      return "✅";
    case "rappel_rdv":
      return "🔔";
    default:
      return "🔔";
  }
}

// Obtenir la couleur selon le type
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "chantier_active":
      return "#22C55E";
    case "chantier_termine":
      return "#0B5FFF";
    case "nouveau_message":
      return "#8B5CF6";
    case "nouvelle_photo":
      return "#EC4899";
    case "paiement_recu":
      return "#FF7A00";
    case "promotion":
      return "#EF4444";
    case "nouveau_rdv":
      return "#3B82F6";
    case "confirme_rdv":
      return "#22C55E";
    case "rappel_rdv":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
}
