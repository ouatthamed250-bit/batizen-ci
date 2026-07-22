"use client"; // ✅ Ajouté pour autoriser le passage du composant icône (fix erreur build prerendering)

import { ScanLine } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function ScannerPage() {
  return <FeaturePage icon={ScanLine} title="Scanner" subtitle="Préparez l’intégration des reçus, factures et documents de chantier." bullets={["Scan reçu", "Classement automatique", "Préparation export PDF"]} />;
}
