import { Search } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function SearchPage() {
  return <FeaturePage icon={Search} title="Recherche" subtitle="Retrouvez rapidement projets, documents, devis, reçus et messages." bullets={["Recherche multi-modules", "Filtres chantier", "Résultats instantanés"]} />;
}
