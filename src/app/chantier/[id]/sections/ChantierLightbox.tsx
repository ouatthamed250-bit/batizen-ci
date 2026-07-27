"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight as ChevronRightIcon, X } from "lucide-react";

interface ChantierLightboxProps {
  lightbox: string | null;
  setLightbox: (url: string | null) => void;
  albumIndex: number | null;
  setAlbumIndex: (idx: number | null) => void;
  medias: any[];
}

export function ChantierLightbox({ lightbox, setLightbox, albumIndex, setAlbumIndex, medias }: ChantierLightboxProps) {
  if (!lightbox) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
      onClick={() => { setLightbox(null); setAlbumIndex(null); }}
    >
      <div className="relative">
        <Image src={lightbox} alt="Photo plein écran" width={800} height={800} className="max-h-[90vh] w-auto rounded-[16px] object-contain" />
        {albumIndex !== null && medias.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex - 1 + medias.length) % medias.length); setLightbox(medias[(albumIndex - 1 + medias.length) % medias.length].url || null); }}
              className="grid size-10 place-items-center rounded-full bg-white/90 text-[#0D2B6B] shadow"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex + 1) % medias.length); setLightbox(medias[(albumIndex + 1) % medias.length].url || null); }}
              className="grid size-10 place-items-center rounded-full bg-white/90 text-[#0D2B6B] shadow"
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => { setLightbox(null); setAlbumIndex(null); }}
          className="absolute -top-8 right-0 text-sm font-black text-white"
        >
          Fermer <X size={18} className="inline" />
        </button>
      </div>
    </div>
  );
}