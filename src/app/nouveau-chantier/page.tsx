"use client";

import { useState } from "react";
import NouveauChantierHero from "@/components/nouveau-chantier/NouveauChantierHero";
import NouveauChantierTimeline from "@/components/nouveau-chantier/NouveauChantierTimeline";
import NouveauChantierFormulaire from "@/components/nouveau-chantier/NouveauChantierFormulaire";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";

export default function NouveauChantierPage() {
  const [showFormulaire, setShowFormulaire] = useState(false);

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.nouveauChantier} overlayClassName="bg-gradient-to-b from-black/60 via-black/70 to-black/80">
      <div className="min-h-screen">
        <NouveauChantierHero onOpenFormulaire={() => setShowFormulaire(true)} />

        {showFormulaire && (
          <div className="relative z-20">
            <NouveauChantierTimeline />
            <NouveauChantierFormulaire onClose={() => setShowFormulaire(false)} />
          </div>
        )}
      </div>
    </BtpPageBackground>
  );
}
