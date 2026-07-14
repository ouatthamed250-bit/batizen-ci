import { Info } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function AboutPage() {
  return <FeaturePage icon={Info} title="À propos" subtitle="BÂTIZEN CI rend la construction moderne plus transparente, plus simple et plus désirable." bullets={["Pensé pour la Côte d’Ivoire", "Design premium", "Suivi complet de bout en bout"]} />;
}
