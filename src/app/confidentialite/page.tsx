import { Shield } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function PrivacyPage() {
  return <FeaturePage icon={Shield} title="Confidentialité" subtitle="Protection des données clients, documents, images chantier et reçus." bullets={["Accès contrôlé", "Stockage sécurisé", "Partage révocable"]} />;
}
