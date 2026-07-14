"use client";

import {
  getDatabase,
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  type DatabaseReference,
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