import { Bell } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function NotificationsPage() {
  return <FeaturePage icon={Bell} title="Notifications" subtitle="Alertes chantier, devis, reçus, validations et messages importants." bullets={["Priorité aux étapes critiques", "Synchronisation Firebase", "Historique consultable"]} />;
}
