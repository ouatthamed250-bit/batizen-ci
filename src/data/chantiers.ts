export interface EtapeChantier {
  id: string;
  nom: string;
  datePrevue: string;
  description: string;
  statut: "termine" | "en_cours" | "a_venir";
  progression: number;
  photosAvant?: string;
  photosApres?: string;
}

export interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  image: string;
  progression: number;
  statut: "termine" | "en_cours" | "en_attente";
  dateDebut: string;
  dateFinPrevue: string;
  etapes: EtapeChantier[];
}

export const chantiersData: Chantier[] = [
  {
    id: "1",
    nom: "Résidence Les Palétuviers",
    adresse: "Cocody, Abidjan, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1541888946425-d81bbd40a9f1?w=800&q=80",
    progression: 75,
    statut: "en_cours",
    dateDebut: "15/01/2025",
    dateFinPrevue: "30/08/2025",
    etapes: [
      {
        id: "e1",
        nom: "Fondations",
        datePrevue: "15/01/2025 - 10/02/2025",
        description: "Excavation et coulage des fondations en béton armé.",
        statut: "termine",
        progression: 100,
        photosAvant: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
        photosApres: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80",
      },
      {
        id: "e2",
        nom: "Gros œuvre",
        datePrevue: "11/02/2025 - 15/04/2025",
        description: "Élévation des murs porteurs, poteaux et dalles.",
        statut: "termine",
        progression: 100,
        photosAvant: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80",
        photosApres: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=600&q=80",
      },
      {
        id: "e3",
        nom: "Toiture",
        datePrevue: "16/04/2025 - 30/05/2025",
        description: "Charpente métallique et couverture en tuiles.",
        statut: "termine",
        progression: 100,
        photosAvant: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
      },
      {
        id: "e4",
        nom: "Second œuvre",
        datePrevue: "01/06/2025 - 20/07/2025",
        description: "Plomberie, électricité, cloisonnement et isolation.",
        statut: "en_cours",
        progression: 65,
        photosAvant: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=600&q=80",
      },
      {
        id: "e5",
        nom: "Finitions",
        datePrevue: "21/07/2025 - 30/08/2025",
        description: "Peinture, revêtements de sol, menuiseries intérieures.",
        statut: "a_venir",
        progression: 0,
      },
    ],
  },
  {
    id: "2",
    nom: "Immeuble Le Phénix",
    adresse: "Plateau, Abidjan, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
    progression: 100,
    statut: "termine",
    dateDebut: "01/03/2024",
    dateFinPrevue: "15/12/2024",
    etapes: [
      {
        id: "e2-1",
        nom: "Fondations",
        datePrevue: "01/03/2024 - 25/03/2024",
        description: "Fondations profondes sur pieux.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e2-2",
        nom: "Structure béton",
        datePrevue: "26/03/2024 - 30/06/2024",
        description: "R+5 en béton armé avec voiles périphériques.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e2-3",
        nom: "Façade et étanchéité",
        datePrevue: "01/07/2024 - 15/09/2024",
        description: "Façade en verre et aluminium, étanchéité toiture.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e2-4",
        nom: "Aménagements intérieurs",
        datePrevue: "16/09/2024 - 30/11/2024",
        description: "Aménagement des bureaux et parties communes.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e2-5",
        nom: "Livraison",
        datePrevue: "01/12/2024 - 15/12/2024",
        description: "Réception des travaux et livraison au client.",
        statut: "termine",
        progression: 100,
      },
    ],
  },
  {
    id: "3",
    nom: "Villa Océane",
    adresse: "Grand-Bassam, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    progression: 30,
    statut: "en_cours",
    dateDebut: "01/05/2025",
    dateFinPrevue: "28/02/2026",
    etapes: [
      {
        id: "e3-1",
        nom: "Terrassement",
        datePrevue: "01/05/2025 - 20/05/2025",
        description: "Terrassement et nivellement du terrain.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e3-2",
        nom: "Fondations",
        datePrevue: "21/05/2025 - 25/06/2025",
        description: "Fondations superficielles et dallage.",
        statut: "en_cours",
        progression: 45,
      },
      {
        id: "e3-3",
        nom: "Murs porteurs",
        datePrevue: "26/06/2025 - 15/08/2025",
        description: "Élévation des murs en parpaings.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e3-4",
        nom: "Toiture et couverture",
        datePrevue: "16/08/2025 - 15/10/2025",
        description: "Charpente bois et couverture en tuiles.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e3-5",
        nom: "Finitions et aménagements",
        datePrevue: "16/10/2025 - 28/02/2026",
        description: "Finitions intérieures et extérieures.",
        statut: "a_venir",
        progression: 0,
      },
    ],
  },
  {
    id: "4",
    nom: "Résidence Harmony",
    adresse: "Yopougon, Abidjan, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    progression: 15,
    statut: "en_attente",
    dateDebut: "01/07/2025",
    dateFinPrevue: "15/06/2026",
    etapes: [
      {
        id: "e4-1",
        nom: "Préparation du terrain",
        datePrevue: "01/07/2025 - 20/07/2025",
        description: "Nettoyage et préparation du site.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e4-2",
        nom: "Fondations",
        datePrevue: "21/07/2025 - 30/08/2025",
        description: "Fondations et infrastructures enterrées.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e4-3",
        nom: "Construction R+3",
        datePrevue: "01/09/2025 - 31/03/2026",
        description: "Structure complète des 4 niveaux.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e4-4",
        nom: "Finitions",
        datePrevue: "01/04/2026 - 15/06/2026",
        description: "Finitions et livraison.",
        statut: "a_venir",
        progression: 0,
      },
    ],
  },
  {
    id: "5",
    nom: " Centre commercial Eden",
    adresse: "Marcory, Abidjan, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=800&q=80",
    progression: 60,
    statut: "en_cours",
    dateDebut: "10/09/2024",
    dateFinPrevue: "20/08/2025",
    etapes: [
      {
        id: "e5-1",
        nom: "Démolition et préparation",
        datePrevue: "10/09/2024 - 30/09/2024",
        description: "Démolition des anciennes structures.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e5-2",
        nom: "Structure métallique",
        datePrevue: "01/10/2024 - 31/12/2024",
        description: "Montage de la structure métallique portique.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e5-3",
        nom: "Couverture et façade",
        datePrevue: "01/01/2025 - 15/03/2025",
        description: "Couverture bac acier et façade vitrée.",
        statut: "termine",
        progression: 100,
      },
      {
        id: "e5-4",
        nom: "Aménagement intérieur",
        datePrevue: "16/03/2025 - 30/06/2025",
        description: "Aménagement des espaces commerciaux.",
        statut: "en_cours",
        progression: 40,
      },
      {
        id: "e5-5",
        nom: "Parking et voiries",
        datePrevue: "01/07/2025 - 20/08/2025",
        description: "Parking paysager et voiries internes.",
        statut: "a_venir",
        progression: 0,
      },
    ],
  },
  {
    id: "6",
    nom: "École Internationale d'Abidjan",
    adresse: "Riviera, Abidjan, Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    progression: 0,
    statut: "en_attente",
    dateDebut: "01/09/2025",
    dateFinPrevue: "31/08/2026",
    etapes: [
      {
        id: "e6-1",
        nom: "Études et permis",
        datePrevue: "01/09/2025 - 31/10/2025",
        description: "Études de sol et obtention du permis de construire.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e6-2",
        nom: "Infrastructure",
        datePrevue: "01/11/2025 - 31/01/2026",
        description: "Fondations et infrastructures sportives.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e6-3",
        nom: "Bâtiments principaux",
        datePrevue: "01/02/2026 - 30/06/2026",
        description: "Construction des bâtiments pédagogiques.",
        statut: "a_venir",
        progression: 0,
      },
      {
        id: "e6-4",
        nom: "Équipement et livraison",
        datePrevue: "01/07/2026 - 31/08/2026",
        description: "Équipement des salles et livraison.",
        statut: "a_venir",
        progression: 0,
      },
    ],
  },
];