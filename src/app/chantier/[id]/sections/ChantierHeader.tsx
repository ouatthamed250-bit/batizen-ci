"use client";

import Link from "next/link";
import Image from "next/image";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ChantierHeaderProps {
  chantier: any;
  nom: string;
  pct: number;
  loading: boolean;
}

export function ChantierHeader({ chantier, nom, pct, loading }: ChantierHeaderProps) {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0">
        {chantier?.photo || chantier?.image_url ? (
          <Image src={(chantier.photo || chantier.image_url)!} alt={nom} fill className="object-cover" />
        ) : (
          <div className="size-full bg-[#0D2B6B]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B6B]/85 via-[#0D2B6B]/70 to-[#0D2B6B]/95" />
      </div>

      <div className="relative px-4 pt-10 pb-6 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-white/80 transition hover:text-white"
        >
          ← Retour
        </Link>
        <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
          {loading ? "Chargement..." : nom}
        </h1>
        {chantier?.adresse && (
          <p className="mt-1 text-sm font-semibold text-white/80">📍 {chantier.adresse}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-white/70">
          {chantier?.date_debut && <span>Début : {chantier.date_debut}</span>}
          {chantier?.date_fin && <span>Fin prévue : {chantier.date_fin}</span>}
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar value={pct} label="Progression globale" />
        </div>
      </div>
    </header>
  );
}