// Coefficients multiplicateurs par ville CI (base = Abidjan Cocody = 1.0)
export const VILLE_COEFFICIENTS: Record<string, number> = {
  // Abidjan — quartiers
  "Abidjan, Cocody":        1.00,
  "Abidjan, Riviera":       1.05,
  "Abidjan, Plateau":       1.08,
  "Abidjan, Marcory":       0.92,
  "Abidjan, Yopougon":      0.88,
  "Abidjan, Abobo":         0.82,
  "Abidjan, Adjamé":        0.85,
  "Abidjan, Treichville":   0.87,
  "Abidjan, Port-Bouët":    0.90,
  "Abidjan, Bingerville":   0.95,
  "Abidjan, Songon":        0.88,
  // Villes intérieur
  "Yamoussoukro":           0.85,
  "Bouaké":                 0.78,
  "San Pedro":              0.80,
  "Korhogo":                0.72,
  "Grand-Bassam":           0.90,
  "Assinie":                0.95,
  "Daloa":                  0.75,
  "Man":                    0.70,
  "Gagnoa":                 0.73,
  "Divo":                   0.74,
  "Abengourou":             0.76,
};

// Durées de construction par phase (jours ouvrés) selon surface
export function getDureeChantier(surfaceM2: number, hasEtage: boolean): {
  phase: string;
  dureeJours: number;
  description: string;
}[] {
  const factor = hasEtage ? 1.6 : 1.0;
  const s = surfaceM2;

  return [
    {
      phase: "Terrassement & Fondations",
      dureeJours: Math.round((s < 100 ? 15 : s < 200 ? 25 : 35) * factor),
      description: "Fouilles, semelles, longrines, dalle de propreté",
    },
    {
      phase: "Gros Œuvre",
      dureeJours: Math.round((s < 100 ? 45 : s < 200 ? 70 : 100) * factor),
      description: "Poteaux, poutres, murs, dalle de toiture",
    },
    {
      phase: "Second Œuvre",
      dureeJours: Math.round((s < 100 ? 30 : s < 200 ? 50 : 70) * factor),
      description: "Toiture, menuiserie, plomberie brute, électricité brute",
    },
    {
      phase: "Finitions",
      dureeJours: Math.round((s < 100 ? 25 : s < 200 ? 40 : 60) * factor),
      description: "Carrelage, peinture, sanitaires, appareillage électrique",
    },
    {
      phase: "Livraison & Réception",
      dureeJours: 7,
      description: "Contrôle qualité, levée de réserves, remise des clés",
    },
  ];
}

// Coefficient ville depuis une chaîne libre (recherche approximative)
export function getVilleCoefficient(location: string): number {
  const normalized = location.trim();
  // Correspondance exacte
  if (VILLE_COEFFICIENTS[normalized]) return VILLE_COEFFICIENTS[normalized];
  // Correspondance partielle
  const key = Object.keys(VILLE_COEFFICIENTS).find(k =>
    normalized.toLowerCase().includes(k.toLowerCase().split(",")[0].trim()) ||
    k.toLowerCase().includes(normalized.toLowerCase().split(",")[0].trim())
  );
  return key ? VILLE_COEFFICIENTS[key] : 0.90; // défaut intérieur
}

// Villes disponibles pour l'autocomplete
export const VILLES_CI = Object.keys(VILLE_COEFFICIENTS);

// Calcul durée totale en mois
export function getDureeTotaleEnMois(surfaceM2: number, hasEtage: boolean): number {
  const phases = getDureeChantier(surfaceM2, hasEtage);
  const totalJours = phases.reduce((s, p) => s + p.dureeJours, 0);
  return Math.ceil(totalJours / 22); // ~22 jours ouvrés/mois
}
