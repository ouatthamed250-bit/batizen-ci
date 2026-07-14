"use client";

import { useEffect, useRef, useState } from "react";
import { Chantier, EtapeChantier } from "@/data/chantiers";

interface TimelineSectionProps {
  chantier: Chantier;
  onBack: () => void;
}

function TimelineStep({ etape, index }: { etape: EtapeChantier; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 150);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (stepRef.current) {
      observer.observe(stepRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  const getIcon = () => {
    switch (etape.statut) {
      case "termine":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case "en_cours":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "a_venir":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        );
    }
  };

  const isActive = etape.statut === "termine" || etape.statut === "en_cours";
  const circleColor = etape.statut === "termine" ? "bg-green-500" : etape.statut === "en_cours" ? "bg-[#FF6B00]" : "bg-gray-400";

  return (
    <div
      ref={stepRef}
      className={`relative flex items-start gap-8 mb-12 transition-all duration-600 ease-out ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
      }`}
    >
      {/* Cercle sur la timeline */}
      <div className="relative flex-shrink-0 z-10">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-all duration-300 ${circleColor}`}
          style={{ boxShadow: "0 5px 15px rgba(0,0,0,0.2)" }}
        >
          {getIcon()}
        </div>
      </div>

      {/* Carte de contenu */}
      <div
        className="flex-1 max-w-[500px] bg-white rounded-[15px] p-5 transition-all duration-300 cursor-default"
        style={{
          boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
        }}
        onMouseEnter={(e) => {
          const card = e.currentTarget;
          card.style.transform = "translateY(-5px)";
          card.style.boxShadow = "0 15px 35px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          const card = e.currentTarget;
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "0 5px 20px rgba(0,0,0,0.1)";
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-lg font-bold text-[#1a1a1a]">{etape.nom}</h4>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              etape.statut === "termine"
                ? "bg-green-100 text-green-700"
                : etape.statut === "en_cours"
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {etape.statut === "termine"
              ? "Terminé"
              : etape.statut === "en_cours"
              ? "En cours"
              : "À venir"}
          </span>
        </div>

        <p className="text-sm text-[#FF6B00] font-medium mb-2">{etape.datePrevue}</p>
        <p className="text-sm text-[#666] mb-3">{etape.description}</p>

        {/* Barre de progression spécifique */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Progression</span>
            <span className="text-xs font-bold text-[#FF6B00]">{etape.progression}%</span>
          </div>
          <div className="h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] transition-all duration-1000 ease-out"
              style={{ width: isVisible ? `${etape.progression}%` : "0%" }}
            />
          </div>
        </div>

        {/* Photos avant/après */}
        {(etape.photosAvant || etape.photosApres) && (
          <div className="mb-3">
            <button
              className="text-xs font-medium text-[#FF6B00] flex items-center gap-1 hover:underline"
              onClick={() => setShowPhotos(!showPhotos)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {showPhotos ? "Masquer les photos" : "Voir les photos avant/après"}
            </button>

            {showPhotos && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-fadeIn">
                {etape.photosAvant && (
                  <div className="rounded-lg overflow-hidden">
                    <div
                      className="h-24 bg-cover bg-center rounded-lg"
                      style={{ backgroundImage: `url(${etape.photosAvant})` }}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Avant</p>
                  </div>
                )}
                {etape.photosApres && (
                  <div className="rounded-lg overflow-hidden">
                    <div
                      className="h-24 bg-cover bg-center rounded-lg"
                      style={{ backgroundImage: `url(${etape.photosApres})` }}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Après</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        {etape.statut !== "a_venir" && (
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-lg transition-all duration-200 btn-3d"
              style={{ boxShadow: "0 3px 10px rgba(255, 107, 0, 0.3)" }}
              onClick={() => alert(`Rapport détaillé pour l'étape "${etape.nom}"`)}
            >
              Voir le rapport
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium text-[#FF6B00] border border-[#FF6B00] rounded-lg transition-all duration-200 hover:bg-[#FF6B00] hover:text-white"
              onClick={() => alert(`Contacter l'équipe pour l'étape "${etape.nom}"`)}
            >
              Contacter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimelineSection({ chantier, onBack }: TimelineSectionProps) {
  const [progressAnim, setProgressAnim] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setProgressAnim(true), 500);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Header avec image */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${chantier.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[var(--bg-home)]" />

        {/* Bouton retour */}
        <button
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium hover:bg-white/30 transition-all duration-200"
          onClick={onBack}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        {/* Infos du chantier */}
        <div className="absolute bottom-8 left-6 right-6 z-10 max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ textShadow: "0 0 20px rgba(255, 107, 0, 0.3)" }}>
                {chantier.nom}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                {chantier.adresse}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">Progression globale</p>
              <p className="text-3xl font-bold text-[#FF6B00]" style={{ textShadow: "0 0 15px rgba(255, 107, 0, 0.4)" }}>
                {chantier.progression}%
              </p>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] transition-all duration-1500 ease-out"
              style={{ width: progressAnim ? `${chantier.progression}%` : "0%" }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs text-white/60">
            <span>Début : {chantier.dateDebut}</span>
            <span>Fin prévue : {chantier.dateFinPrevue}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative max-w-3xl mx-auto px-6 mt-16">
        {/* Ligne verticale */}
        <div
          className="absolute left-[19px] top-0 bottom-0 w-[4px] rounded-full"
          style={{
            background: "linear-gradient(to bottom, #FF6B00, #FF8C00)",
            boxShadow: "0 0 10px rgba(255, 107, 0, 0.5)",
          }}
        />

        {/* Titre timeline */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
            Avancement des travaux
          </h2>
          <p className="text-[var(--muted)] text-sm">
            {chantier.etapes.filter((e) => e.statut === "termine").length} / {chantier.etapes.length} étapes terminées
          </p>
        </div>

        {/* Étapes */}
        {chantier.etapes.map((etape, index) => (
          <TimelineStep key={etape.id} etape={etape} index={index} />
        ))}
      </div>
    </div>
  );
}