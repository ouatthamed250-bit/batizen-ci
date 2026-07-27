"use client";

import Image from "next/image";
import { LockedTab } from "@/components/ui/LockedTab";

interface ChantierRapportsProps {
  rapports: any[];
  isTabLocked: boolean;
}

export function ChantierRapports({ rapports, isTabLocked }: ChantierRapportsProps) {
  if (isTabLocked) return <LockedTab />;
  if (rapports.length === 0) {
    return <div className="text-center py-8 text-gray-400"><p>Aucun rapport disponible pour le moment. L'administration en créera bientôt.</p></div>;
  }

  return (
    <div className="space-y-4">
      {rapports.map((r) => (
        <div key={r.id} className="rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#6B7280] font-bold">
                {r.semaine} ({r.dateDebut} → {r.dateFin})
              </p>
              <p className="text-sm font-bold text-[#0D2B6B] mt-1">
                Étape : {r.etape ? r.etape.charAt(0).toUpperCase() + r.etape.slice(1) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#0D2B6B]">{r.avancement || 0}%</p>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                r.statut === "dans_delais" ? "bg-green-100 text-green-700" :
                r.statut === "retard" ? "bg-orange-100 text-orange-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {r.statut === "dans_delais" ? "🟢 Dans les délais" :
                 r.statut === "retard" ? "🟠 Retard" : "🔵 En avance"}
              </span>
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs text-[#6B7280] font-bold mb-1">Commentaires :</p>
            <p className="text-sm text-[#374151] whitespace-pre-line">{r.commentaires}</p>
          </div>
          {r.problemes && (
            <div className="mb-3">
              <p className="text-xs text-[#6B7280] font-bold mb-1">Problèmes :</p>
              <p className="text-sm text-[#374151]">{r.problemes}</p>
            </div>
          )}
          {r.prochaine_etape && (
            <div className="mb-3">
              <p className="text-xs text-[#6B7280] font-bold mb-1">Prochaine étape :</p>
              <p className="text-sm text-[#374151]">{r.prochaine_etape}</p>
            </div>
          )}
          {r.medias && r.medias.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-[#6B7280] font-bold mb-2">📸 Médias ({r.medias.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {r.medias.map((media: any) => (
                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#E7EBF5]">
                    {media.type === "photo" ? (
                      <Image src={media.url} alt={media.legende || "Photo"} fill className="object-cover" />
                    ) : (
                      <video src={media.url} controls className="w-full h-full object-cover" />
                    )}
                    {media.legende && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">{media.legende}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}