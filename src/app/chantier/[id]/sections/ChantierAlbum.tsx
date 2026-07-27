"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockedTab } from "@/components/ui/LockedTab";

interface ChantierAlbumProps {
  medias: any[];
  setAlbumIndex: (idx: number | null) => void;
  setLightbox: (url: string | null) => void;
  handleTelechargerFichier: (url: string, nom: string) => void;
  isTabLocked: boolean;
}

export function ChantierAlbum({ medias, setAlbumIndex, setLightbox, handleTelechargerFichier, isTabLocked }: ChantierAlbumProps) {
  if (isTabLocked) return <LockedTab />;
  if (medias.length === 0) return <EmptyState text="Aucune photo dans l album" />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {medias.map((m, idx) => (
        <button key={m.id} type="button" onClick={() => { setAlbumIndex(idx); setLightbox(m.url || null); }} className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm">
          {m.url ? <Image src={m.url} alt={m.description || m.nom || "Photo album"} fill className="object-cover transition group-hover:scale-105" /> : null}
          <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white line-clamp-1">{m.description || m.nom || `Photo ${idx + 1}`}</span>
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#0D2B6B]">{m.type === "photo" ? "Photo" : m.type === "video" ? "Vidéo" : "PDF"}</span>
          {m.url && <button type="button" onClick={(e) => { e.stopPropagation(); handleTelechargerFichier(m.url!, `media_${m.id}`); }} className="absolute top-2 left-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition" title="Télécharger"><Download size={16} /></button>}
        </button>
      ))}
    </div>
  );
}