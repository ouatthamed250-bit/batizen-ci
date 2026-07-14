"use client";

import { useCallback } from "react";

interface RenovationFormData {
  nom: string;
  telephone: string;
  email: string;
  surface: number;
  etages: number;
  adresse: string;
  distance: number;
  travaux: string[];
  date: string;
  heure: string;
  description: string;
  paiement: "maintenant" | "sur_place";
  photos: File[];
  cgvAccepted: boolean;
}

interface NouveauChantierFormData {
  nom: string;
  telephone: string;
  email: string;
  typeProjet: string;
  surface: number;
  niveaux: number;
  budget: string;
  delai: string;
  adresse: string;
  photos: File[];
  description: string;
  paiement: "maintenant" | "sur_place";
  cgvAccepted: boolean;
}

type FirebaseDocument = {
  type: "renovation" | "nouveau_chantier";
  montant: number;
  distance: number;
  paiement: "maintenant" | "sur_place";
  status: "en_attente" | "paye" | "termine";
  date_demande: number;
  client_id: string;
  details: Record<string, any>;
};

function generateClientId(): string {
  return "client_" + Math.random().toString(36).slice(2, 9);
}

export function useRenovationSubmit() {
  const submit = useCallback(async (data: RenovationFormData) => {
    const doc: FirebaseDocument = {
      type: "renovation",
      montant: 0,
      distance: data.distance,
      paiement: data.paiement,
      status: "en_attente",
      date_demande: Date.now(),
      client_id: generateClientId(),
      details: {
        nom: data.nom,
        telephone: data.telephone,
        email: data.email,
        surface: data.surface,
        etages: data.etages,
        adresse: data.adresse,
        travaux: data.travaux,
        date: data.date,
        heure: data.heure,
        description: data.description,
      },
    };

    try {
      // Simulation sauvegarde Firebase
      // Remplacer par votre logique Firebase Realtime Database
      // await fetch('/api/demandes_visites', { method: 'POST', body: JSON.stringify(doc) });
      console.log("Sauvegarde Firebase (simulée) :", doc);
      return { success: true, clientId: doc.client_id };
    } catch (error) {
      console.error("Erreur sauvegarde Firebase :", error);
      return { success: false, error };
    }
  }, []);

  return { submit };
}

export function useNouveauChantierSubmit() {
  const submit = useCallback(async (data: NouveauChantierFormData) => {
    const doc: FirebaseDocument = {
      type: "nouveau_chantier",
      montant: 100000,
      distance: 0,
      paiement: data.paiement,
      status: "en_attente",
      date_demande: Date.now(),
      client_id: generateClientId(),
      details: {
        nom: data.nom,
        telephone: data.telephone,
        email: data.email,
        typeProjet: data.typeProjet,
        surface: data.surface,
        niveaux: data.niveaux,
        budget: data.budget,
        delai: data.delai,
        adresse: data.adresse,
        description: data.description,
      },
    };

    try {
      // Simulation sauvegarde Firebase
      console.log("Sauvegarde Firebase (simulée) :", doc);
      return { success: true, clientId: doc.client_id };
    } catch (error) {
      console.error("Erreur sauvegarde Firebase :", error);
      return { success: false, error };
    }
  }, []);

  return { submit };
}