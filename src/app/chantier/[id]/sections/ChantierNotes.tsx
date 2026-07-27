"use client";

import { LockedTab } from "@/components/ui/LockedTab";

interface ChantierNotesProps {
  notes: any[];
  isTabLocked: boolean;
  formatDateFr: (d?: string) => string;
}

export function ChantierNotes({ notes, isTabLocked, formatDateFr }: ChantierNotesProps) {
  if (isTabLocked) return <LockedTab />;
  if (notes.length === 0) {
    return <div className="text-center py-8 text-gray-400"><p>Aucune note disponible pour le moment.</p></div>;
  }

  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div key={n.id} className={`p-4 rounded-xl border ${
          n.priorite === "urgente" ? "bg-red-50 border-red-200" :
          n.priorite === "importante" ? "bg-yellow-50 border-yellow-200" :
          "bg-green-50 border-green-200"
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {n.type === "checklist" ? "✅" : "📝"}
                </span>
                <h3 className="font-bold text-[var(--navy)]">{n.titre || "Note"}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  n.statut === "fait" ? "bg-green-100 text-green-700" :
                  n.statut === "en_cours" ? "bg-blue-100 text-blue-700" :
                  n.statut === "annule" ? "bg-gray-100 text-gray-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {n.statut === "a_faire" ? "⏳ À faire" :
                   n.statut === "en_cours" ? "🔄 En cours" :
                   n.statut === "fait" ? "✅ Fait" : "❌ Annulé"}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Par {n.creeParNom} ({n.creeParRole === "admin" ? "Admin" : "Vous"}) • {formatDateFr(n.dateCreation ? new Date(n.dateCreation).toISOString() : n.date)}
              </p>
            </div>
          </div>
          {n.type === "note" && n.contenu && (
            <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">{n.contenu}</p>
          )}
          {n.type === "checklist" && n.items && n.items.length > 0 && (
            <div className="mt-3 space-y-1">
              {n.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={item.coche} readOnly className="w-4 h-4" />
                  <span className={`text-sm ${item.coche ? "text-gray-500 line-through" : "text-gray-800"}`}>{item.texte}</span>
                </div>
              ))}
            </div>
          )}
          {n.dateRappel && (
            <p className="text-xs text-gray-600 mt-2">📅 Rappel : {new Date(n.dateRappel).toLocaleDateString('fr-FR')}</p>
          )}
        </div>
      ))}
    </div>
  );
}