import ChantierDetailClient from "./ChantierDetailClient";

// Route dynamique statiquement exportable : les données sont chargées
// côté client depuis Firebase, donc aucun paramètre pré-rendu requis.
export function generateStaticParams() {
  return [];
}

// Force le mode statique pour output: export
export const dynamic = "force-static";

export default function ChantierDetailPage() {
  return <ChantierDetailClient />;
}