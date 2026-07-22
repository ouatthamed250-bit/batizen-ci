"use client"; // ✅ Ajouté pour autoriser le passage du composant icône (fix erreur build prerendering)

import { Headphones } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function SupportPage() {
  return <FeaturePage icon={Headphones} title="Support" subtitle="Une équipe disponible pour accompagner vos décisions chantier." bullets={["Assistance WhatsApp", "Escalade technique", "Conseils client"]} />;
}
