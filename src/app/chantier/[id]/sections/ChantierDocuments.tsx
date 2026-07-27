"use client";

import { LockedTab } from "@/components/ui/LockedTab";

interface ChantierDocumentsProps {
  clientDocuments: any[];
  isTabLocked: boolean;
}

export function ChantierDocuments({ clientDocuments, isTabLocked }: ChantierDocumentsProps) {
  if (isTabLocked) return <LockedTab />;

  return (
    <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
      <h3 className="font-black text-[var(--navy)] text-lg mb-4 flex items-center gap-2">
        📄 Documents du chantier
      </h3>

      {clientDocuments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Aucun document disponible pour le moment.</p>
          <p className="text-sm text-gray-400 mt-2">L'administration ajoutera bientôt les devis, factures et plans.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientDocuments.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#FF7A00] transition">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {doc.type === "devis" && "📋"}
                  {doc.type === "facture" && "💰"}
                  {doc.type === "plan" && "📐"}
                  {doc.type === "autre" && "📁"}
                </span>
                <div>
                  <p className="font-bold text-[var(--navy)]">{doc.nom}</p>
                  <p className="text-xs text-gray-500">{(doc.taille / 1024).toFixed(1)} KB • {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <a 
                href={doc.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl text-sm font-bold hover:bg-[#e66e00] transition"
              >
                ⬇️ Télécharger
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}