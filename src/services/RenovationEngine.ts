import { getVilleCoefficient } from "@/constants/villes";

export type TravauxRenovation =
  | "peinture_int" | "peinture_ext" | "carrelage" | "plomberie"
  | "electricite" | "toiture" | "menuiserie" | "faux_plafond"
  | "cuisine" | "salle_bain" | "terrasse" | "cloture";

export type EtatMaison = "bon" | "moyen" | "degrade";

export type RenovationInput = {
  surfaceM2: number;
  location: string;
  etat: EtatMaison;
  travaux: TravauxRenovation[];
};

export type RenovationResult = {
  total: number;
  dureeJours: number;
  details: { label: string; cout: number; duree: number }[];
};

// Prix unitaires par m² ou forfait (Abidjan base 2026)
const PRIX_TRAVAUX: Record<TravauxRenovation, { label: string; prixParM2: number; forfait?: number; dureeParM2: number }> = {
  peinture_int:  { label: "Peinture intérieure",    prixParM2: 3_500,   dureeParM2: 0.15 },
  peinture_ext:  { label: "Peinture extérieure",    prixParM2: 4_500,   dureeParM2: 0.20 },
  carrelage:     { label: "Carrelage / Sol",         prixParM2: 18_000,  dureeParM2: 0.30 },
  plomberie:     { label: "Plomberie",               prixParM2: 12_000,  dureeParM2: 0.25 },
  electricite:   { label: "Électricité",             prixParM2: 9_500,   dureeParM2: 0.20 },
  toiture:       { label: "Toiture",                 prixParM2: 22_000,  dureeParM2: 0.40 },
  menuiserie:    { label: "Menuiserie / Portes",     prixParM2: 0, forfait: 85_000, dureeParM2: 0 },
  faux_plafond:  { label: "Faux plafond",            prixParM2: 11_000,  dureeParM2: 0.20 },
  cuisine:       { label: "Cuisine",                 prixParM2: 0, forfait: 1_200_000, dureeParM2: 0 },
  salle_bain:    { label: "Salle de bain",           prixParM2: 0, forfait: 850_000,   dureeParM2: 0 },
  terrasse:      { label: "Terrasse",                prixParM2: 25_000,  dureeParM2: 0.35 },
  cloture:       { label: "Clôture / Portail",       prixParM2: 0, forfait: 650_000,   dureeParM2: 0 },
};

const ETAT_MULTIPLIER: Record<EtatMaison, number> = {
  bon:     0.70,
  moyen:   1.00,
  degrade: 1.45,
};

export const RenovationEngine = {
  calculate(input: RenovationInput): RenovationResult {
    const villeCoeff = getVilleCoefficient(input.location);
    const etatMult   = ETAT_MULTIPLIER[input.etat];

    const details = input.travaux.map(t => {
      const p = PRIX_TRAVAUX[t];
      const cout = Math.round(
        (p.forfait ?? p.prixParM2 * input.surfaceM2) * etatMult * villeCoeff
      );
      const duree = Math.round(
        p.forfait ? 5 : p.dureeParM2 * input.surfaceM2
      );
      return { label: p.label, cout, duree };
    });

    const total      = details.reduce((s, d) => s + d.cout, 0);
    const dureeJours = Math.max(...details.map(d => d.duree), 0) +
                       Math.round(details.length * 2); // chevauchement partiel

    return { total, dureeJours, details };
  },
};
