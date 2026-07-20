"use client";

import {
  getDatabase,
  ref,
  get,
  set,
  query,
  orderByChild,
  equalTo,
  onValue,
  type DatabaseReference,
  type Unsubscribe,
} from "firebase/database";
import { getFirebaseServices, hasFirebaseConfig } from "./firebase";

/**
 * Helpers pour la lecture depuis Firebase Realtime Database.
 * Toutes les fonctions renvoient `null` (ou un tableau vide) en mode
 * "sans configuration Firebase" afin de ne jamais casser le rendu.
 */

function dbRef(path: string): DatabaseReference | null {
  if (!hasFirebaseConfig()) return null;
  try {
    const { database } = getFirebaseServices();
    return ref(database, path);
  } catch {
    return null;
  }
}

/** Récupère une valeur brute depuis un chemin. */
export async function rtdbGet<T = unknown>(path: string): Promise<T | null> {
  const r = dbRef(path);
  if (!r) return null;
  try {
    const snap = await get(r);
    return snap.exists() ? (snap.val() as T) : null;
  } catch {
    return null;
  }
}

/**
 * Récupère une collection et la normalise en tableau.
 * Chaque entrée reçoit une propriété `id` (la clé Firebase).
 */
export async function rtdbGetList<T = Record<string, unknown>>(
  path: string
): Promise<T[]> {
  const data = await rtdbGet<Record<string, T>>(path);
  if (!data) return [];
  return Object.entries(data).map(([id, value]) => ({
    ...(value as object),
    id,
  })) as T[];
}

/**
 * Récupère une collection filtrée par une propriété enfant (equalTo).
 */
export async function rtdbGetListByChild<T = Record<string, unknown>>(
  path: string,
  childKey: string,
  childValue: string | number | boolean
): Promise<T[]> {
  const r = dbRef(path);
  if (!r) return [];
  try {
    const q = query(r, orderByChild(childKey), equalTo(childValue));
    const snap = await get(q);
    if (!snap.exists()) return [];
    const data = snap.val() as Record<string, T>;
    return Object.entries(data).map(([id, value]) => ({
      ...(value as object),
      id,
    })) as T[];
  } catch {
    return [];
  }
}

/**
 * Écrit une valeur à un chemin Firebase Realtime Database.
 */
export async function rtdbSet<T = unknown>(path: string, value: T): Promise<void> {
  const r = dbRef(path);
  if (!r) return;
  try {
    await set(r, value);
  } catch {
    // silencieux
  }
}

/**
 * Écoute les changements en temps réel sur un chemin Firebase.
 * Renvoie une fonction de désabonnement.
 */
export function rtdbSubscribe<T = unknown>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const r = dbRef(path);
  if (!r) return () => {};
  
  try {
    const unsubscribe = onValue(r, (snapshot) => {
      const data = snapshot.exists() ? (snapshot.val() as T) : null;
      callback(data);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Écoute les changements en temps réel sur une collection Firebase.
 * Normalise les données en tableau avec propriété `id`.
 */
export function rtdbSubscribeList<T = Record<string, unknown>>(
  path: string,
  callback: (data: T[]) => void
): Unsubscribe {
  return rtdbSubscribe<Record<string, T>>(path, (data) => {
    if (!data) {
      callback([]);
      return;
    }
    const normalized = Object.entries(data).map(([id, value]) => ({
      ...(value as object),
      id,
    })) as T[];
    callback(normalized);
  });
}

/**
 * Écoute les changements en temps réel sur une collection Firebase avec filtre.
 * Utilise orderByChild + equalTo pour compatibilité avec les règles strictes.
 * Normalise les données en tableau avec propriété `id`.
 */
export function rtdbSubscribeListByChild<T = Record<string, unknown>>(
  path: string,
  childKey: string,
  childValue: string | number | boolean,
  callback: (data: T[]) => void
): Unsubscribe {
  if (!hasFirebaseConfig()) return () => {};
  try {
    const { database } = getFirebaseServices();
    const r = ref(database, path);
    const q = query(r, orderByChild(childKey), equalTo(childValue));
    const unsubscribe = onValue(q, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val() as Record<string, T>;
      const normalized = Object.entries(data).map(([id, value]) => ({
        ...(value as object),
        id,
      })) as T[];
      callback(normalized);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}