import { Settings } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function SettingsPage() {
  return <FeaturePage icon={Settings} title="Paramètres" subtitle="Préférences utilisateur, notifications, sécurité Google et gestion du compte." bullets={["Profil client", "Connexion Google", "Préférences de partage"]} />;
}
