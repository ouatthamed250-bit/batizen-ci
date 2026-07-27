"use client";

import Image from "next/image";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateFr } from "@/utils/formatDate";

interface ChantierPhotosProps {
  photos: any[];
  setLightbox: (url: string | null) => void;
}

export function ChantierPhotos({ photos, setLightbox }: ChantierPhotosProps) {
  if (photos.length === 0) return <EmptyState text="Aucune photo disponible" />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((p) => (
        <button key={p.id} type="button" onClick={() => p.url && setLightbox(p.url)} className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm">
          {p.url ? <Image src={p.url} alt="Photo chantier" fill className="object-cover transition group-hover:scale-105" /> : null}
          {p.date && <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white">{formatDateFr(p.date)}</span>}
        </button>
      ))}
    </div>
  );
}