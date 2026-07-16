"use client";

import { ref, push, set, get, child } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import type { HousePlan } from "@/types/plan";

/**
 * Sauvegarde un plan de maison dans Firebase Realtime Database
 * Collection: house_plans/{userId}/{planId}
 */
export async function saveHousePlan(userId: string, plan: HousePlan): Promise<string | null> {
  try {
    const { database } = getFirebaseServices();
    const planRef = ref(database, `house_plans/${userId}`);
    const newPlanRef = push(planRef);
    await set(newPlanRef, plan);
    return newPlanRef.key;
  } catch (error) {
    console.error("Erreur sauvegarde plan:", error);
    return null;
  }
}

/**
 * Récupère les plans d'un utilisateur
 */
export async function getUserPlans(userId: string): Promise<HousePlan[]> {
  try {
    const { database } = getFirebaseServices();
    const planRef = ref(database, `house_plans/${userId}`);
    const snapshot = await get(planRef);
    
    if (!snapshot.exists()) return [];
    
    const data = snapshot.val();
    return Object.entries(data).map(([id, value]) => ({
      ...(value as object),
      planId: id,
    })) as HousePlan[];
  } catch (error) {
    console.error("Erreur récupération plans:", error);
    return [];
  }
}

/**
 * Récupère un plan spécifique par ID
 */
export async function getHousePlan(userId: string, planId: string): Promise<HousePlan | null> {
  try {
    const { database } = getFirebaseServices();
    const planRef = ref(database, `house_plans/${userId}/${planId}`);
    const snapshot = await get(planRef);
    
    if (!snapshot.exists()) return null;
    
    return snapshot.val() as HousePlan;
  } catch (error) {
    console.error("Erreur récupération plan:", error);
    return null;
  }
}

/**
 * Supprime un plan
 */
export async function deleteHousePlan(userId: string, planId: string): Promise<boolean> {
  try {
    const { database } = getFirebaseServices();
    const planRef = ref(database, `house_plans/${userId}/${planId}`);
    await set(planRef, null);
    return true;
  } catch (error) {
    console.error("Erreur suppression plan:", error);
    return false;
  }
}