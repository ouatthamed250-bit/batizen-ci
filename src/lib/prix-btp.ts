export const PRIX_REFERENCE: Record<string, any> = {
  fondation: { dalle_radier: { unite: "m²", prix: 45000 }, semelle_filante: { unite: "ml", prix: 35000 } },
  elevation: { mur_parpaing: { unite: "m²", prix: 12000 }, enduit: { unite: "m²", prix: 3500 } },
  toiture: { tole_bac: { unite: "m²", prix: 8500 }, tuile: { unite: "m²", prix: 12000 } },
  standing: { base: 1, moyen: 1.2, haut_standing: 1.5, luxe: 2 },
  style_coefficient: { moderne: 1, classique: 0.95, africain: 0.9, colonial: 1.05, contemporain: 1 },
  supplements: { garage: 500000, piscine: 2000000, jardin: 300000 },
  repartition: { fondation: 0.15, elevation: 0.35, toiture: 0.12, second_oeuvre: 0.25, finitions: 0.08, main_oeuvre: 0.05 },
};

export function formatFcfa(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(montant);
}

export function formatEuros(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(montant);
}

export const PRIX_BTP = {
  fondation: {
    "dalle_radier": { unite: "m²", prix: 45000 },
    "semelle_filante": { unite: "ml", prix: 35000 },
    "longrine": { unite: "ml", prix: 25000 },
  },
  elevation: {
    "mur_brique": { unite: "m²", prix: 15000 },
    "mur_parpaing": { unite: "m²", prix: 12000 },
    "poteau_ba": { unite: "ml", prix: 18000 },
    "enduit": { unite: "m²", prix: 3500 },
  },
  toiture: {
    "tole_bac": { unite: "m²", prix: 8500 },
    "tuile": { unite: "m²", prix: 12000 },
    "charpente_bois": { unite: "m²", prix: 6500 },
    "terrasse_etanche": { unite: "m²", prix: 18000 },
  },
  menuiserie: {
    "porte_bois": { unite: "u", prix: 75000 },
    "porte_metal": { unite: "u", prix: 45000 },
    "fenetre_alu": { unite: "u", prix: 65000 },
    "fenetre_bois": { unite: "u", prix: 50000 },
  },
  electricite: {
    "installation_complete": { unite: "m²", prix: 8500 },
    "tableau": { unite: "u", prix: 35000 },
    "disjoncteur": { unite: "u", prix: 5000 },
  },
  plomberie: {
    "installation_complete": { unite: "m²", prix: 6500 },
    "cuve_eau": { unite: "u", prix: 150000 },
    "chauffe_eau": { unite: "u", prix: 120000 },
  },
  carrelage: {
    "carrelage_sol": { unite: "m²", prix: 8500 },
    "carrelage_mural": { unite: "m²", prix: 7500 },
    "faience": { unite: "m²", prix: 6500 },
  },
  peinture: {
    "peinture_interieure": { unite: "m²", prix: 2500 },
    "peinture_exterieure": { unite: "m²", prix: 3500 },
    "enduit_decoratif": { unite: "m²", prix: 5000 },
  },
  main_oeuvre: {
    "macon": { unite: "jour", prix: 8000 },
    "electricien": { unite: "jour", prix: 12000 },
    "plombier": { unite: "jour", prix: 10000 },
    "peintre": { unite: "jour", prix: 6000 },
    "carreleur": { unite: "jour", prix: 10000 },
    "menuisier": { unite: "jour", prix: 9000 },
  },
} as const;

export type PosteBTP = {
  poste: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
};

export function estimerCoutChantier(surface: number, type: string, materiaux?: Record<string, any>): { total: number; details: PosteBTP[] } {
  const details: PosteBTP[] = [];
  const s = Math.max(20, surface);

  // Fondation : ~15% du budget total estimé
  details.push({ poste: "Dalle radier (fondation)", quantite: s, unite: "m²", prixUnitaire: PRIX_BTP.fondation.dalle_radier.prix, total: s * PRIX_BTP.fondation.dalle_radier.prix });
  details.push({ poste: "Semelle filante", quantite: Math.round(s * 0.3), unite: "ml", prixUnitaire: PRIX_BTP.fondation.semelle_filante.prix, total: Math.round(s * 0.3) * PRIX_BTP.fondation.semelle_filante.prix });

  // Élévation
  details.push({ poste: "Mur en parpaing", quantite: s * 2.5, unite: "m²", prixUnitaire: PRIX_BTP.elevation.mur_parpaing.prix, total: Math.round(s * 2.5 * PRIX_BTP.elevation.mur_parpaing.prix) });
  details.push({ poste: "Enduit", quantite: s * 2.5, unite: "m²", prixUnitaire: PRIX_BTP.elevation.enduit.prix, total: Math.round(s * 2.5 * PRIX_BTP.elevation.enduit.prix) });

  // Toiture
  const typeToit = type === "villa" || type === "luxe" ? "tuile" : "tole_bac";
  const prixToit = typeToit === "tuile" ? PRIX_BTP.toiture.tuile.prix : PRIX_BTP.toiture.tole_bac.prix;
  details.push({ poste: `Toiture (${typeToit === "tuile" ? "tuile" : "tôle bac"})`, quantite: s * 0.6, unite: "m²", prixUnitaire: prixToit, total: Math.round(s * 0.6 * prixToit) });

  // Électricité
  details.push({ poste: "Installation électrique complète", quantite: s, unite: "m²", prixUnitaire: PRIX_BTP.electricite.installation_complete.prix, total: s * PRIX_BTP.electricite.installation_complete.prix });

  // Plomberie
  details.push({ poste: "Installation plomberie complète", quantite: s, unite: "m²", prixUnitaire: PRIX_BTP.plomberie.installation_complete.prix, total: s * PRIX_BTP.plomberie.installation_complete.prix });

  // Carrelage
  details.push({ poste: "Carrelage sol", quantite: s * 0.5, unite: "m²", prixUnitaire: PRIX_BTP.carrelage.carrelage_sol.prix, total: Math.round(s * 0.5 * PRIX_BTP.carrelage.carrelage_sol.prix) });

  // Peinture
  details.push({ poste: "Peinture intérieure", quantite: s * 2.5, unite: "m²", prixUnitaire: PRIX_BTP.peinture.peinture_interieure.prix, total: Math.round(s * 2.5 * PRIX_BTP.peinture.peinture_interieure.prix) });

  // Menuiserie (3 portes pour 100m², 5 pour 250m²)
  const nbPortes = Math.max(2, Math.round(s / 35));
  details.push({ poste: "Portes (bois)", quantite: nbPortes, unite: "u", prixUnitaire: PRIX_BTP.menuiserie.porte_bois.prix, total: nbPortes * PRIX_BTP.menuiserie.porte_bois.prix });

  // Fenêtres
  const nbFenetres = Math.max(2, Math.round(s / 20));
  details.push({ poste: "Fenêtres (aluminium)", quantite: nbFenetres, unite: "u", prixUnitaire: PRIX_BTP.menuiserie.fenetre_alu.prix, total: nbFenetres * PRIX_BTP.menuiserie.fenetre_alu.prix });

  // Main d'œuvre (~15% du total matériaux)
  const totalMateriaux = details.reduce((s, d) => s + d.total, 0);
  const mainOeuvre = Math.round(totalMateriaux * 0.15);
  details.push({ poste: "Main d'œuvre (forfait)", quantite: 1, unite: "forfait", prixUnitaire: mainOeuvre, total: mainOeuvre });

  const total = details.reduce((s, d) => s + d.total, 0);
  return { total, details };
}