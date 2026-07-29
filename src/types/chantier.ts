// src/types/chantier.ts

export type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

export type StatutChantier = "en_attente" | "en_attente_rdv" | "en_cours" | "termine" | "terminé" | "suspendu";

/**
 * Type pour les propriétés supplémentaires issues de Firebase
 * qui ne sont pas explicitement définies dans le type Chantier.
 * À utiliser via la propriété `extra`.
 */
export type ChantierExtra = Record<string, unknown>;

export type Chantier = {
  id: string;
  nom?: string;
  nom_projet?: string;
  type_projet?: string;
  type?: string;
  statut?: StatutChantier;
  localisation?: Localisation;
  budget_total?: number;
  budget?: number;
  date_debut?: string;
  date_fin?: string;
  date_fin_prevue?: string;
  rdv_date?: string;
  plan_choisi?: string;
  userId?: string;          // UID du client propriétaire du chantier
  client_id?: string;        // UID du client (redondant, conservé pour rétrocompatibilité)
  adminId?: string;          // UID de l'admin assigné (NOUVEAU — pour le filtrage dashboard)
  assignedAt?: string;       // Date d'assignation ISO (NOUVEAU)
  actif?: boolean;
  createdAt?: number;
  dateCreation?: number;
  dateMiseAJour?: number;
  /** Propriétés supplémentaires issues de Firebase */
  extra?: ChantierExtra;
};
