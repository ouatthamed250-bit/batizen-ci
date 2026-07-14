export type ProjectStatus = "Simulation" | "Devis" | "Chantier" | "Livré";

export type PlanOption = {
  id: string;
  name: string;
  surfaceM2: number;
  rooms: number;
  startingPriceFcfa: number;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type GoogleServiceStatus = {
  label: string;
  description: string;
  enabled: boolean;
};

export type ProjectType = "base" | "standard" | "lux";
export type QualityType = "eco" | "standard" | "premium";
export type LandShape = "rectangulaire" | "angle" | "allonge";
export type Orientation = "nord" | "est" | "sud" | "ouest";
export type KitchenType = "ouverte" | "semi-ouverte" | "fermee";

export type PlanInput = {
  landWidth: number;
  landLength: number;
  location: string;
  hasAdminPapers: boolean;
  landShape: LandShape;
  orientation: Orientation;
  type: ProjectType;
  hasEtage: boolean;
  quality: QualityType;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  hasDining: boolean;
  kitchenType: KitchenType;
  hasOffice: boolean;
  hasGarage: boolean;
  hasTerrace: boolean;
  hasGuestRoom: boolean;
};

export type PlanRoom = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  areaLabel: string;
  fill: string;
};

export type GeneratedPlan = {
  id: string;
  title: string;
  description: string;
  totalBuiltAreaM2: number;
  estimatedRooms: number;
  rooms: PlanRoom[];
  svg: string;
  notes: string[];
};
