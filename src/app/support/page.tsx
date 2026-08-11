"use client";

import { Headphones, MessageCircle } from "lucide-react";
import { FeaturePage } from "@/components/layout/FeaturePage";

export default function SupportPage() {
  return (
    <>
      <FeaturePage icon={Headphones} title="Support" subtitle="Une équipe disponible pour accompagner vos décisions chantier." bullets={["Assistance WhatsApp", "Escalade technique", "Conseils client"]} />
      
      {/* Carte WhatsApp — numéro caché dans le lien */}
      <div className="mx-2 mt-6 p-6 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl text-center">
        <div className="grid size-16 place-items-center mx-auto mb-4 rounded-full bg-[#25D366]/20 text-[#25D366]">
          <Headphones size={28} />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Besoin d'aide ?</h3>
        <p className="text-sm text-white/80 mb-6">Notre équipe vous répond sur WhatsApp</p>
        <a
          href="https://wa.me/2250554233234"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[14px] bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#20bd59] active:scale-95"
        >
          <MessageCircle size={20} /> Contacter sur WhatsApp
        </a>
      </div>
    </>
  );
}