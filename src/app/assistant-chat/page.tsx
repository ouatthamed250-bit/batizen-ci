import { Bot } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function AssistantChatPage() {
  return <FeaturePage icon={Bot} title="Assistant IA chantier" subtitle="Un assistant pour expliquer les devis, optimiser le budget et guider chaque étape." bullets={["Questions/réponses projet", "Conseils budget FCFA", "Préparation des documents"]} />;
}
