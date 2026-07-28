export const ETAPES_RENOVATION = [
  { id: "en_attente", label: "Demande reçue", icon: "📥" },
  { id: "visite_payante", label: "Visite technique", icon: "📅" },
  { id: "devis_envoye", label: "Devis envoyé", icon: "📄" },
  { id: "en_cours", label: "Travaux en cours", icon: "🔨" },
  { id: "termine", label: "Terminé", icon: "✅" },
] as const;

export function getEtapeIndex(statut: string): number {
  return ETAPES_RENOVATION.findIndex(e => e.id === statut);
}