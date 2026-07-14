export type MaterialQuality = {
  label: string;
  price: number;
  description: string;
};

export type MaterialItem = {
  id: string;
  name: string;
  category: "Gros Oeuvre" | "Second Oeuvre" | "Finition" | "Plomberie" | "Électricité";
  image: string;
  unit: string;
  qualities: {
    eco: MaterialQuality;
    standard: MaterialQuality;
    premium: MaterialQuality;
  };
};

export const materiauxCI: MaterialItem[] = [
  // ── GROS ŒUVRE ──────────────────────────────────────────────────────────
  {
    id: "ciment",
    name: "Ciment (CPJ 42.5)",
    category: "Gros Oeuvre",
    image: "/assets/images/materials/ciment.jpg",
    unit: "Sac (50kg)",
    qualities: {
      eco:      { label: "Local",           price: 4800,  description: "Ciment local standard" },
      standard: { label: "Dangote/Lafarge", price: 5200,  description: "Haute résistance" },
      premium:  { label: "Importé Spécial", price: 6500,  description: "Séchage ultra-rapide" },
    },
  },
  {
    id: "fer",
    name: "Fer à béton (HA12)",
    category: "Gros Oeuvre",
    image: "/assets/images/materials/fer.jpg",
    unit: "Barre (12m)",
    qualities: {
      eco:      { label: "Recyclé",                price: 3800, description: "Fer de récupération normé" },
      standard: { label: "Local Neuf",             price: 4500, description: "Standard construction" },
      premium:  { label: "Importé Haute Qualité",  price: 5800, description: "Anti-corrosion renforcé" },
    },
  },
  {
    id: "briques",
    name: "Briques Creuses (15×20×40)",
    category: "Gros Oeuvre",
    image: "/assets/images/materials/briques.jpg",
    unit: "Unité",
    qualities: {
      eco:      { label: "Artisanal",      price: 250, description: "Moulage manuel" },
      standard: { label: "Industriel",     price: 350, description: "Vibré machine" },
      premium:  { label: "Brique Rouge/BTC", price: 600, description: "Thermique et esthétique" },
    },
  },
  {
    id: "sable",
    name: "Sable de lagune",
    category: "Gros Oeuvre",
    image: "/assets/images/materials/sable.jpg",
    unit: "Chargement (10m³)",
    qualities: {
      eco:      { label: "Brut",   price: 85000,  description: "Tout venant" },
      standard: { label: "Criblé", price: 110000, description: "Sable fin propre" },
      premium:  { label: "Lavé",   price: 145000, description: "Spécial béton haute performance" },
    },
  },
  {
    id: "gravier",
    name: "Gravier concassé",
    category: "Gros Oeuvre",
    image: "/assets/images/materials/ciment.jpg",
    unit: "Chargement (10m³)",
    qualities: {
      eco:      { label: "Tout-venant",  price: 90000,  description: "Granulométrie variable" },
      standard: { label: "5/15 mm",      price: 120000, description: "Béton armé standard" },
      premium:  { label: "Concassé 8/16",price: 160000, description: "Béton haute performance" },
    },
  },

  // ── SECOND ŒUVRE ────────────────────────────────────────────────────────
  {
    id: "toiture",
    name: "Toiture / Couverture",
    category: "Second Oeuvre",
    image: "/assets/images/materials/briques.jpg",
    unit: "m²",
    qualities: {
      eco:      { label: "Tôle galvanisée",   price: 4500,  description: "Tôle ondulée standard" },
      standard: { label: "Tuile béton",        price: 9500,  description: "Durable et esthétique" },
      premium:  { label: "Tuile terre cuite",  price: 18000, description: "Isolation thermique supérieure" },
    },
  },
  {
    id: "menuiserie",
    name: "Menuiserie (portes/fenêtres)",
    category: "Second Oeuvre",
    image: "/assets/images/materials/fer.jpg",
    unit: "Unité",
    qualities: {
      eco:      { label: "Bois local",      price: 45000,  description: "Bois de forêt locale" },
      standard: { label: "Aluminium",       price: 85000,  description: "Profilé aluminium standard" },
      premium:  { label: "Alu double vitrage", price: 180000, description: "Isolation phonique et thermique" },
    },
  },
  {
    id: "enduit",
    name: "Enduit / Crépi façade",
    category: "Second Oeuvre",
    image: "/assets/images/materials/sable.jpg",
    unit: "m²",
    qualities: {
      eco:      { label: "Ciment lissé",    price: 2500, description: "Finition ciment brut" },
      standard: { label: "Enduit tyrolien", price: 4500, description: "Aspect granuleux résistant" },
      premium:  { label: "Crépi décoratif", price: 8500, description: "Finition architecturale premium" },
    },
  },

  // ── FINITION ────────────────────────────────────────────────────────────
  {
    id: "carrelage",
    name: "Carrelage Sol",
    category: "Finition",
    image: "/assets/images/materials/carrelage.jpg",
    unit: "m²",
    qualities: {
      eco:      { label: "Grès Cérame",  price: 4500,  description: "Import standard" },
      standard: { label: "Porcelaine",   price: 8500,  description: "Haute résistance" },
      premium:  { label: "Marbre/Granit",price: 25000, description: "Luxe italien/espagnol" },
    },
  },
  {
    id: "peinture",
    name: "Peinture intérieure",
    category: "Finition",
    image: "/assets/images/materials/ciment.jpg",
    unit: "Litre",
    qualities: {
      eco:      { label: "Peinture vinylique", price: 2800, description: "Couverture standard" },
      standard: { label: "Acrylique lavable",  price: 4500, description: "Résistante et lavable" },
      premium:  { label: "Velours mat premium",price: 8500, description: "Finition hôtelière" },
    },
  },
  {
    id: "faux_plafond",
    name: "Faux plafond",
    category: "Finition",
    image: "/assets/images/materials/carrelage.jpg",
    unit: "m²",
    qualities: {
      eco:      { label: "Contreplaqué",   price: 5500,  description: "Bois contreplaqué peint" },
      standard: { label: "Placo BA13",     price: 9000,  description: "Plâtre standard" },
      premium:  { label: "Placo acoustique",price: 16000, description: "Isolation phonique renforcée" },
    },
  },

  // ── PLOMBERIE ────────────────────────────────────────────────────────────
  {
    id: "plomberie",
    name: "Plomberie (tuyaux + robinetterie)",
    category: "Plomberie",
    image: "/assets/images/materials/fer.jpg",
    unit: "Forfait/sdb",
    qualities: {
      eco:      { label: "PVC + robinets basiques", price: 180000, description: "Installation fonctionnelle" },
      standard: { label: "PPR + robinets chrome",   price: 350000, description: "Durabilité renforcée" },
      premium:  { label: "Cuivre + robinets design", price: 750000, description: "Finition hôtelière 5 étoiles" },
    },
  },

  // ── ÉLECTRICITÉ ──────────────────────────────────────────────────────────
  {
    id: "electricite",
    name: "Installation électrique",
    category: "Électricité",
    image: "/assets/images/materials/fer.jpg",
    unit: "Forfait/pièce",
    qualities: {
      eco:      { label: "Câblage simple",       price: 85000,  description: "Norme CI basique" },
      standard: { label: "Tableau + disjoncteurs",price: 165000, description: "Norme NFC 15-100" },
      premium:  { label: "Domotique intégrée",   price: 380000, description: "Contrôle intelligent" },
    },
  },
];

// Quantités par m² de surface construite
export const QTY_PER_M2: Record<string, number> = {
  ciment:      7.0,
  fer:         4.0,
  briques:    55.0,
  sable:       0.08,
  gravier:     0.06,
  toiture:     0.90,
  menuiserie:  0.08,
  enduit:      1.80,
  carrelage:   1.10,
  peinture:    0.40,
  faux_plafond:0.70,
  plomberie:   0.012,
  electricite: 0.018,
};
