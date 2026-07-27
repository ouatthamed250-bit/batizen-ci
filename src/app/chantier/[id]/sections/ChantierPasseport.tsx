"use client";

import Image from "next/image";
import { LockedTab } from "@/components/ui/LockedTab";
import { formatFcfa } from "@/utils/currency";
interface ChantierPasseportProps {
  chantier: any;
  photos: any[];
  equipe: any[];
  isTabLocked: boolean;
  formatLocalisation: (loc: any, fallback?: string) => string;
  formatDateFr: (d?: string) => string;
}

export function ChantierPasseport({ chantier, photos, equipe, isTabLocked, formatLocalisation, formatDateFr }: ChantierPasseportProps) {
  if (isTabLocked) return <LockedTab />;

  return (
    <div className="space-y-4 w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
      <h2 className="text-lg font-black text-[#0D2B6B]">Passeport numérique</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-[#6B7280]">Projet</p>
          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.nom_projet || chantier?.nom || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[#6B7280]">Type</p>
          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.type || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[#6B7280]">Localisation</p>
          <p className="text-sm font-black text-[#0D2B6B]">{formatLocalisation(chantier?.localisation, chantier?.adresse)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-[#6B7280]">Budget</p>
          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.budget ? formatFcfa(chantier.budget) : "—"}</p>
        </div>
      </div>
      {chantier?.materiaux && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[#6B7280]">Matériaux</p>
          <pre className="mt-1 rounded-[14px] bg-[#F7F9FC] p-3 text-xs text-[#374151]">{JSON.stringify(chantier.materiaux, null, 2)}</pre>
        </div>
      )}
      {photos.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[#6B7280]">Photos clés</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-[14px] bg-[#E7EBF5]">
                {p.url && <Image src={p.url} alt="Photo clé" fill className="object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )}
      {equipe.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[#6B7280]">Équipe</p>
          <ul className="mt-2 space-y-2">
            {equipe.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-[14px] border border-[#E7EBF5] p-3">
                <span className="text-sm font-black text-[#0D2B6B]">{m.nom}</span>
                <span className="text-xs text-[#6B7280]">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}