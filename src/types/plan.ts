// Types pour le générateur de plans interactifs

export type PlanUnit = "cm" | "m";

export interface PlanPoint {
  x: number;
  y: number;
}

export interface PlanWall {
  id: string;
  start: PlanPoint;
  end: PlanPoint;
  height: number;
  thickness: number;
}

export type OpeningType = "door" | "window";

export interface PlanOpening {
  id: string;
  wallId: string;
  type: OpeningType;
  position: number; // distance depuis start du mur en cm
  width: number;
  height: number;
}

export interface PlanRoom {
  id: string;
  name: string;
  polygon: PlanPoint[];
}

export interface HousePlan {
  planId: string;
  unit: PlanUnit;
  walls: PlanWall[];
  openings: PlanOpening[];
  rooms: PlanRoom[];
}

// Type pour la configuration du plan (compatibilité ascendante)
export interface PlanConfig {
  longueur: number;
  largeur: number;
  chambres: number;
  sdb: number;
  cuisineOuverte: boolean;
  etages: number;
  orientation: "N" | "S" | "E" | "O";
  style: "moderne" | "traditionnel" | "colonial";
}

// Type pour les pièces (utilisé par le générateur actuel)
export interface PieceData {
  nom: string;
  x: number;
  y: number;
  w: number;
  h: number;
  couleur: string;
}