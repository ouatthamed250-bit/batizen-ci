export interface Service {
  id: string;
  nom: string;
  description: string;
  prix: string;
  image: string;
}

export const servicesData: Service[] = [
  {
    id: "1",
    nom: "Rénovation complète",
    description: "Rénovation intégrale de votre maison ou appartement : murs, sols, plafonds, électricité, plomberie, peinture.",
    prix: "À partir de 5 000 000 FCFA",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
  },
  {
    id: "2",
    nom: "Rénovation partielle",
    description: "Rénovation ciblée d'une ou plusieurs pièces : cuisine, salle de bain, chambre, salon.",
    prix: "À partir de 1 500 000 FCFA",
    image: "https://images.unsplash.com/photo-1590674899484-13f0e99a2d0e?w=600&q=80",
  },
  {
    id: "3",
    nom: "Extension de maison",
    description: "Agrandissement de votre espace de vie : surélévation, extension latérale ou véranda.",
    prix: "À partir de 3 500 000 FCFA",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  },
  {
    id: "4",
    nom: "Aménagement intérieur",
    description: "Optimisation et réaménagement de vos espaces intérieurs avec des solutions sur mesure.",
    prix: "À partir de 1 000 000 FCFA",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80",
  },
  {
    id: "5",
    nom: "Ravalement de façade",
    description: "Rénovation complète de votre façade : nettoyage, réparation, enduit et peinture extérieure.",
    prix: "À partir de 2 000 000 FCFA",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80",
  },
  {
    id: "6",
    nom: "Installation électrique",
    description: "Mise aux normes, installation complète ou rénovation du réseau électrique de votre bâtiment.",
    prix: "À partir de 500 000 FCFA",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  },
  {
    id: "7",
    nom: "Plomberie",
    description: "Installation et rénovation des réseaux d'eau, évacuations, chauffage et sanitaire.",
    prix: "À partir de 400 000 FCFA",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80",
  },
  {
    id: "8",
    nom: "Peinture et décoration",
    description: "Prestation complète de peinture intérieure/extérieure et conseils en décoration.",
    prix: "À partir de 300 000 FCFA",
    image: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80",
  },
];