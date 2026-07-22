// src/types/chantier.ts

export type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

export type StatutChantier = "en_attente" | "en_cours" | "termine" | "suspendu";

export type Chantier = {
  id: string;
  nom?: string;
  nom_projet?: string;
  type_projet?: string;
  statut?: StatutChantier;
  localisation?: Localisation;
  budget_total?: number;
  date_debut?: string;
  date_fin_prevue?: string;
  userId?: string; // Pour filtrer par utilisateur
  createdAt?: number;
  [key: string]: any; // Pour permettre d'autres champs dynamiques de Firebase
};