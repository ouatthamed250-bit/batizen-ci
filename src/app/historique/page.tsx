import { History } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function HistoryPage() {
  return <FeaturePage icon={History} title="Historique" subtitle="Traçabilité complète des simulations, validations, messages et paiements." bullets={["Journal des actions", "Archivage client", "Preuves horodatées"]} />;
}
