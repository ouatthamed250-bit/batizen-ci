"use client";

import { useEffect, useRef, useState } from "react";
import { Chantier } from "@/data/chantiers";

interface ChantierCardProps {
  chantier: Chantier;
  index: number;
  onSelect: (chantier: Chantier) => void;
}

export default function ChantierCard({ chantier, index, onSelect }: ChantierCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getStatusBadge = () => {
    switch (chantier.statut) {
      case "termine":
        return {
          label: "Terminé",
          bg: "bg-green-100",
          text: "text-green-700",
          dot: "bg-green-500",
        };
      case "en_cours":
        return {
          label: "En cours",
          bg: "bg-orange-100",
          text: "text-orange-700",
          dot: "bg-orange-500",
        };
      case "en_attente":
        return {
          label: "En attente",
          bg: "bg-gray-100",
          text: "text-gray-600",
          dot: "bg-gray-400",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      ref={cardRef}
      className={`
        group w-[350px] h-[450px] rounded-[20px] overflow-hidden
        bg-white cursor-pointer
        transition-all duration-400 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
      style={{
        transitionDelay: `${index * 0.1}s`,
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        perspective: "800px",
        transformStyle: "preserve-3d",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,200,200,0.03) 2px, rgba(200,200,200,0.03) 4px)",
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget;
        card.style.transform = "translateY(-10px) rotateY(2deg)";
        card.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.transform = "translateY(0) rotateY(0deg)";
        card.style.boxShadow = "0 10px 40px rgba(0,0,0,0.2)";
      }}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden rounded-t-[20px]">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${chantier.image})` }}
        />
        {/* Overlay gradient sur l'image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Badge statut */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col h-[250px]">
        {/* Nom du projet */}
        <h3 className="text-[22px] font-bold text-[#1a1a1a] leading-tight mb-1 line-clamp-1">
          {chantier.nom}
        </h3>

        {/* Adresse */}
        <p className="text-sm text-[#666] mb-3 line-clamp-1">{chantier.adresse}</p>

        {/* Barre de progression */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Progression</span>
            <span className="text-lg font-bold text-[#FF6B00]">{chantier.progression}%</span>
          </div>
          <div className="relative h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] transition-all duration-1000 ease-out"
              style={{
                width: isVisible ? `${chantier.progression}%` : "0%",
              }}
            />
            {/* Effet de brillance */}
            <div
              className="absolute inset-y-0 left-0 w-8 rounded-full bg-white/30 blur-sm animate-shimmer"
              style={{
                width: isVisible ? `${chantier.progression}%` : "0%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Dates */}
        <p className="text-xs text-gray-400 mb-3">
          Début : {chantier.dateDebut} | Fin prévue : {chantier.dateFinPrevue}
        </p>

        {/* Boutons */}
        <div className="mt-auto flex gap-2">
          <button
            className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] transition-all duration-200 btn-3d"
            style={{
              boxShadow: "0 4px 15px rgba(255, 107, 0, 0.35)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(chantier);
            }}
            onMouseDown={() => setIsPressed("details")}
            onMouseUp={() => setIsPressed(null)}
            onMouseLeave={() => setIsPressed(null)}
          >
            Voir détails
          </button>
          <button
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#FF6B00] border-2 border-[#FF6B00] bg-transparent transition-all duration-200 hover:bg-[#FF6B00] hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Contacter le responsable du chantier "${chantier.nom}"`);
            }}
          >
            Contacter
          </button>
          <button
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF6B00] border-2 border-[#FF6B00] bg-transparent transition-all duration-200 hover:bg-[#FF6B00] hover:text-white flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Photos du chantier "${chantier.nom}"`);
            }}
            title="Photos"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}