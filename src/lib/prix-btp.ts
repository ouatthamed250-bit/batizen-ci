export const PRIX_REFERENCE = {
  // Prix au m² par standing (Gros œuvre + Finitions)
  standing: {
    economique: 85000,
    moyen: 130000,
    haut_standing: 200000,
    luxe: 320000
  },
  
  // Répartition du budget (en %)
  repartition: {
    gros_oeuvre: 0.55,
    finitions: 0.25,
    main_oeuvre: 0.15,
    divers_imprevus: 0.05
  },
  
  // Coûts additionnels (forfaits)
  supplements: {
    garage: 2500000,
    piscine: 8000000,
    jardin: 500000,
    cloture: 1500000,
    etage_supplementaire: 0.85
  },
  
  // Coefficient multiplicateur par style
  style_coefficient: {
    moderne: 1.0,
    classique: 1.1,
    africain: 0.95,
    contemporain: 1.15,
    colonial: 1.2
  }
};

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat('fr-CI').format(amount) + " FCFA";
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount * 0.0015);
}