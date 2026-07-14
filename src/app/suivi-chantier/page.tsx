"use client";

import { useState } from "react";
import HeroSection from "@/components/suivi-chantier/HeroSection";
import ChantierGrid from "@/components/suivi-chantier/ChantierGrid";
import TimelineSection from "@/components/suivi-chantier/TimelineSection";
import { chantiersData, Chantier } from "@/data/chantiers";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";

export default function SuiviChantierPage() {
  const [selectedChantier, setSelectedChantier] = useState<Chantier | null>(null);

  if (selectedChantier) {
    return (
      <BtpPageBackground imageUrl={PHOTOS_CHANTIER.suiviChantier} overlayClassName="bg-gradient-to-b from-black/50 via-black/60 to-black/75">
        <div className="min-h-screen bg-[#F5F5F5]/90">
          <div className="mx-auto w-full max-w-3xl px-4 pt-4">
            <WeatherWidget title="Météo du chantier" />
          </div>
          <TimelineSection
            chantier={selectedChantier}
            onBack={() => setSelectedChantier(null)}
          />
        </div>
      </BtpPageBackground>
    );
  }

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.suiviChantier} overlayClassName="bg-gradient-to-b from-black/50 via-black/60 to-black/75">
      <div className="min-h-screen bg-[#F5F5F5]/90">
        <HeroSection />
        <div className="mx-auto w-full max-w-3xl px-4">
          <WeatherWidget title="Météo du chantier" />
        </div>
        <ChantierGrid onSelectChantier={setSelectedChantier} />
      </div>
    </BtpPageBackground>
  );
}
