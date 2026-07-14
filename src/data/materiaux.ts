export interface Materiau {
  id: string;
  nom: string;
  description: string;
  prix: number;
  unite: string;
  categorie: string;
  icone: string;
  image: string;
  stock: "en_stock" | "sur_commande";
}

export interface Categorie {
  id: string;
  nom: string;
  icone: string;
}

export const categories: Categorie[] = [
  { id: "gros-oeuvre", nom: "Gros œuvre", icone: "🧱" },
  { id: "charpente-toiture", nom: "Charpente et toiture", icone: "🏗️" },
  { id: "electricite", nom: "Électricité", icone: "🔌" },
  { id: "plomberie", nom: "Plomberie", icone: "🚿" },
  { id: "finitions", nom: "Finitions", icone: "🎨" },
  { id: "menuisierie", nom: "Menuiserie", icone: "🚪" },
  { id: "quincaillerie", nom: "Quincaillerie", icone: "🏠" },
];

export const materiauxData: Materiau[] = [
  // ===== GROS ŒUVRE =====
  { id: "ciment-cpj35", nom: "Ciment CPJ 35", description: "Ciment standard pour béton et maçonnerie générale. Sac de 50kg.", prix: 4500, unite: "sac de 50kg", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "ciment-cpj45", nom: "Ciment CPJ 45", description: "Ciment haute résistance pour ouvrages armés. Sac de 50kg.", prix: 5000, unite: "sac de 50kg", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "sable-fin", nom: "Sable fin", description: "Sable roulé lavé pour enduits et mortiers fins.", prix: 15000, unite: "m³", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1581852544400-f387f86b1ee7?w=400&q=80", stock: "en_stock" },
  { id: "sable-grossier", nom: "Sable grossier", description: "Sable concassé pour béton armé et dallages.", prix: 12000, unite: "m³", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1581852544400-f387f86b1ee7?w=400&q=80", stock: "en_stock" },
  { id: "graviers-5-15", nom: "Graviers 5/15", description: "Granulats pour béton courant et fondations.", prix: 18000, unite: "m³", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "graviers-15-25", nom: "Graviers 15/25", description: "Granulats pour béton armé et ouvrages lourds.", prix: 20000, unite: "m³", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "briques-creuses", nom: "Briques creuses", description: "Briques en terre cuite pour cloisons et murs intérieurs.", prix: 250, unite: "pièce", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", stock: "en_stock" },
  { id: "briques-pleines", nom: "Briques pleines", description: "Briques pleines en terre cuite pour murs porteurs.", prix: 350, unite: "pièce", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", stock: "en_stock" },
  { id: "parpaings-10", nom: "Parpaings 10 cm", description: "Blocs creux en béton pour cloisons intérieures.", prix: 400, unite: "pièce", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "parpaings-15", nom: "Parpaings 15 cm", description: "Blocs creux en béton pour murs de façade.", prix: 500, unite: "pièce", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "parpaings-20", nom: "Parpaings 20 cm", description: "Blocs creux en béton pour murs porteurs.", prix: 600, unite: "pièce", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "acier-8", nom: "Acier rond à béton 8mm", description: "Barre d'acier nervurée HA8 pour ferraillage léger.", prix: 8000, unite: "barre de 12m", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "acier-10", nom: "Acier rond à béton 10mm", description: "Barre d'acier nervurée HA10 pour ferraillage courant.", prix: 12000, unite: "barre de 12m", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "acier-12", nom: "Acier rond à béton 12mm", description: "Barre d'acier nervurée HA12 pour ferraillage lourd.", prix: 18000, unite: "barre de 12m", categorie: "gros-oeuvre", icone: "🧱", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "sur_commande" },

  // ===== CHARPENTE ET TOITURE =====
  { id: "bois-eucalyptus", nom: "Bois eucalyptus", description: "Bois de charpente traité, résistant aux termites.", prix: 80000, unite: "m³", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1581852544400-f387f86b1ee7?w=400&q=80", stock: "en_stock" },
  { id: "bois-iroko", nom: "Bois iroko", description: "Bois dur exotique pour menuiserie de luxe.", prix: 150000, unite: "m³", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1581852544400-f387f86b1ee7?w=400&q=80", stock: "sur_commande" },
  { id: "toles-bac-alu", nom: "Tôles bac alu", description: "Tôles nervurées en aluminium pour toiture légère.", prix: 8000, unite: "m²", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=80", stock: "en_stock" },
  { id: "toles-bac-acier", nom: "Tôles bac acier", description: "Tôles nervurées en acier galvanisé pour toiture.", prix: 12000, unite: "m²", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=80", stock: "en_stock" },
  { id: "tuiles", nom: "Tuiles", description: "Tuiles en terre cuite pour toiture traditionnelle.", prix: 500, unite: "pièce", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=80", stock: "en_stock" },
  { id: "gouttieres-pvc", nom: "Gouttières PVC", description: "Gouttières en PVC pour évacuation des eaux pluviales.", prix: 3000, unite: "mètre", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&q=80", stock: "en_stock" },
  { id: "chevrons-6x8", nom: "Chevrons 6x8", description: "Chevrons en bois pour support de toiture.", prix: 2000, unite: "mètre", categorie: "charpente-toiture", icone: "🏗️", image: "https://images.unsplash.com/photo-1581852544400-f387f86b1ee7?w=400&q=80", stock: "en_stock" },

  // ===== ÉLECTRICITÉ =====
  { id: "cable-1-5", nom: "Câble 1.5mm²", description: "Câble électrique pour éclairage et prises.", prix: 300, unite: "mètre", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "cable-2-5", nom: "Câble 2.5mm²", description: "Câble électrique pour circuits spécialisés.", prix: 450, unite: "mètre", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "cable-6", nom: "Câble 6mm²", description: "Câble électrique pour gros appareils.", prix: 900, unite: "mètre", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "prise-simple", nom: "Prise simple", description: "Prise électrique encastrée 2P+T.", prix: 1500, unite: "pièce", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "interrupteur", nom: "Interrupteur simple", description: "Interrupteur électrique encastré va-et-vient.", prix: 2000, unite: "pièce", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "disjoncteur-16a", nom: "Disjoncteur 16A", description: "Disjoncteur divisionnaire 16A pour protection des circuits.", prix: 5000, unite: "pièce", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "tableau-electrique", nom: "Tableau électrique 8 modules", description: "Tableau de répartition électrique 8 modules prêt à poser.", prix: 25000, unite: "pièce", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },
  { id: "ampoule-led", nom: "Ampoule LED 9W", description: "Ampoule LED E27 blanc chaud, 800 lumens.", prix: 2000, unite: "pièce", categorie: "electricite", icone: "🔌", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80", stock: "en_stock" },

  // ===== PLOMBERIE =====
  { id: "tuyau-pvc-40", nom: "Tuyau PVC 40mm", description: "Tuyau d'évacuation PVC pression 40mm.", prix: 1500, unite: "mètre", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "en_stock" },
  { id: "tuyau-pvc-100", nom: "Tuyau PVC 100mm", description: "Tuyau d'évacuation PVC pression 100mm.", prix: 4000, unite: "mètre", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "en_stock" },
  { id: "robinet-lavabo", nom: "Robinet lavabo", description: "Robinet mitigeur lavabo chromé haut de gamme.", prix: 15000, unite: "pièce", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "en_stock" },
  { id: "wc-complet", nom: "WC complet", description: "WC complet avec réservoir et abattant.", prix: 80000, unite: "pièce", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "en_stock" },
  { id: "lavabo", nom: "Lavabo", description: "Lavabo céramique à poser 60cm.", prix: 35000, unite: "pièce", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "en_stock" },
  { id: "douche", nom: "Douche complète", description: "Colonne de douche avec mitigeur et pomme.", prix: 120000, unite: "pièce", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "sur_commande" },
  { id: "chauffe-eau", nom: "Chauffe-eau 50L", description: "Chauffe-eau électrique 50 litres.", prix: 150000, unite: "pièce", categorie: "plomberie", icone: "🚿", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80", stock: "sur_commande" },

  // ===== FINITIONS =====
  { id: "peinture-interieure", nom: "Peinture intérieure", description: "Peinture acrylique mate blanc, 5 litres.", prix: 15000, unite: "5L", categorie: "finitions", icone: "🎨", image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80", stock: "en_stock" },
  { id: "peinture-exterieure", nom: "Peinture extérieure", description: "Peinture acrylique satinée pour façades, 5 litres.", prix: 20000, unite: "5L", categorie: "finitions", icone: "🎨", image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80", stock: "en_stock" },
  { id: "carrelage-sol", nom: "Carrelage sol 40x40", description: "Carrelage grès cérame pour sol intérieur.", prix: 8000, unite: "m²", categorie: "finitions", icone: "🎨", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80", stock: "en_stock" },
  { id: "carrelage-mur", nom: "Carrelage mur 30x60", description: "Carrelage mural aspect marbre pour salle de bain.", prix: 12000, unite: "m²", categorie: "finitions", icone: "🎨", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80", stock: "en_stock" },
  { id: "faience", nom: "Faïence 20x30", description: "Faïence murale coloris variés pour cuisine.", prix: 6000, unite: "m²", categorie: "finitions", icone: "🎨", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80", stock: "en_stock" },

  // ===== MENUISERIE =====
  { id: "porte-bois", nom: "Porte bois standard", description: "Porte en bois massif 80x210cm avec cadre.", prix: 80000, unite: "pièce", categorie: "menuisierie", icone: "🚪", image: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=400&q=80", stock: "en_stock" },
  { id: "porte-aluminium", nom: "Porte aluminium", description: "Porte coulissante en aluminium 120x210cm.", prix: 150000, unite: "pièce", categorie: "menuisierie", icone: "🚪", image: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=400&q=80", stock: "sur_commande" },
  { id: "fenetre-alu", nom: "Fenêtre aluminium 120x120", description: "Fenêtre coulissante aluminium double vitrage.", prix: 120000, unite: "pièce", categorie: "menuisierie", icone: "🚪", image: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=400&q=80", stock: "sur_commande" },
  { id: "volet-roulant", nom: "Volet roulant", description: "Volet roulant aluminium manuel sur mesure.", prix: 35000, unite: "m²", categorie: "menuisierie", icone: "🚪", image: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=400&q=80", stock: "en_stock" },

  // ===== QUINCAILLERIE =====
  { id: "vis-4x40", nom: "Vis 4x40", description: "Vis à bois tête fraisée, boîte de 100 unités.", prix: 2000, unite: "boîte de 100", categorie: "quincaillerie", icone: "🏠", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "clous-50", nom: "Clous 50mm", description: "Clous à tête plate pour charpente, 1 kg.", prix: 3000, unite: "kg", categorie: "quincaillerie", icone: "🏠", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "serrure", nom: "Serrure complète", description: "Serrure 3 points haute sécurité pour porte d'entrée.", prix: 15000, unite: "pièce", categorie: "quincaillerie", icone: "🏠", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
  { id: "poignee", nom: "Poignée de porte", description: "Poignée de porte design en acier inoxydable.", prix: 8000, unite: "paire", categorie: "quincaillerie", icone: "🏠", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80", stock: "en_stock" },
];