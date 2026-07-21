"use client";

import { useState, useCallback } from "react";
import RenovationHero from "@/components/services-renovation/RenovationHero";
import ServiceCard from "@/components/services-renovation/ServiceCard";
import RendezVousModal from "@/components/services-renovation/RendezVousModal";
import RenovationCalculator from "@/components/services-renovation/RenovationCalculator";
import PlanGenerator from "@/components/plans/PlanGenerator";
import { servicesData, Service } from "@/data/services";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";

export default function ServicesRenovationPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPlanGenerator, setShowPlanGenerator] = useState(false);

  const handleDemanderDevis = useCallback((service: Service) => {
    setSelectedService(service);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedService(null);
  }, []);

  const handleCalculatorSubmit = useCallback(async (data: any) => {
    console.log("Données renovation:", data);
  }, []);

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.renovation} overlayClassName="bg-gradient-to-b from-black/60 via-black/70 to-black/85">
      <div className="min-h-screen">
        {/* Section Hero */}
        <RenovationHero />

      {/* Section Services */}
      <section className="pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb] mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-black text-[#1a1a1a]">
            Nos services de rénovation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#666]">
            Des solutions adaptées à tous vos besoins, de la simple retouche à la
            rénovation complète
          </p>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00]" />
        </div>

        {/* Grille responsive */}
        <div className="grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {servicesData.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onDemanderDevis={handleDemanderDevis}
            />
          ))}
        </div>

        {/* CTA Plans interactifs */}
        <div className="mt-24">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-[#1a1a1a]">
              🏗️ Générateur de plans interactifs
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#6B7280]">
              Créez un plan 2D/3D de votre projet en quelques clics
            </p>
          </div>
          {showPlanGenerator ? (
            <PlanGenerator />
          ) : (
            <div className="text-center">
              <button
                onClick={() => setShowPlanGenerator(true)}
                className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-8 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98]"
              >
                🚀 Lancer le générateur de plans
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* CTA Calculateur */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-2xl rounded-[24px] bg-gradient-to-br from-[#FFF7ED] to-[#FFE4CC] p-8 shadow-[0_20px_60px_rgba(255,107,0,0.15)]">
            <h3 className="text-2xl font-black text-[#1a1a1a]">
              📐 Demande de visite technique
            </h3>
            <p className="mt-3 text-[#6B7280]">
              Estimez le coût de votre visite d'expertise et réservez en ligne.
              Calculateur transparent en temps réel.
            </p>
            <button
              onClick={() => setShowCalculator(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-8 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98]"
            >
              Ouvrir le calculateur
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Modal de rendez-vous classique */}
      {selectedService && (
        <RendezVousModal
          service={selectedService}
          onClose={handleCloseModal}
        />
      )}

      {/* Calculateur principal rénovation */}
      {showCalculator && (
        <RenovationCalculator
          onClose={() => setShowCalculator(false)}
          onSubmit={handleCalculatorSubmit}
        />
      )}
      </div>
    </BtpPageBackground>
  );
}
