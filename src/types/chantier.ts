// src/types/chantier.ts

export type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

// ✅ Ajout de "en_attente_rdv", "terminé" et "string" pour éviter les blocages futurs avec Firebase
export type StatutChantier = "en_attente" | "en_attente_rdv" | "en_cours" | "termine" | "terminé" | "suspendu" | string;

export type Chantier = {
  id: string;
  nom?: string;
  nom_projet?: string;
  type_projet?: string;
  statut?: StatutChantier;
  localisation?: Localisation;
  budget_total?: number;
  budget?: number;
  date_debut?: string;
  date_fin?: string;
  date_fin_prevue?: string;
  rdv_date?: string;
  plan_choisi?: string;
  userId?: string;
  actif?: boolean;
  createdAt?: number;
  [key: string]: any; // Permet d'accepter d'autres champs dynamiques de Firebase sans faire planter le build
};