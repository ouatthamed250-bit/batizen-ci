"use client"; // ✅ Ajouté pour autoriser le passage du composant icône (fix erreur build prerendering)

import { FileText } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function TermsPage() {
  return <FeaturePage icon={FileText} title="Conditions" subtitle="Conditions d’utilisation de la plateforme BÂTIZEN CI." bullets={["Contrats numériques", "Validation devis", "Responsabilités chantier"]} />;
}
