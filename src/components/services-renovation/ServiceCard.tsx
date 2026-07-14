"use client";

import type { Service } from "@/data/services";

interface ServiceCardProps {
  service: Service;
  index: number;
  onDemanderDevis: (service: Service) => void;
}

export default function ServiceCard({ service, index, onDemanderDevis }: ServiceCardProps) {
  return (
    <div
      className="group relative h-[420px] w-full max-w-[330px] perspective-[1000px]"
      style={{ animation: `cardAppear 0.6s ease ${0.1 * (index + 1)}s both` }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-500 group-hover:translateY(-15px) group-hover:rotateX(5deg) group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Image avec zoom au survol */}
        <div className="relative h-[200px] w-full overflow-hidden">
          <img
            src={service.image}
            alt={service.nom}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Contenu */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-xl font-bold text-[#1a1a1a]">{service.nom}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[#666]">{service.description}</p>

          {/* Prix */}
          <div className="mt-4">
            <span className="text-base font-black text-[#FF6B00]">{service.prix}</span>
          </div>

          {/* Bouton */}
          <button
            onClick={() => onDemanderDevis(service)}
            className="mt-4 w-full rounded-[12px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_15px_rgba(255,107,0,0.3)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_25px_rgba(255,107,0,0.5)] active:scale-[0.97]"
          >
            Demander un devis
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}