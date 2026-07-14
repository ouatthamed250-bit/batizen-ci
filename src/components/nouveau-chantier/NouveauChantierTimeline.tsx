"use client";

export default function NouveauChantierTimeline() {
  const steps = [
    {
      number: "1",
      title: "Visite terrain",
      description: "Analyse technique & relevés",
      icon: "🏗️",
    },
    {
      number: "2",
      title: "Étude bureau",
      description: "Calcul structure, plans préliminaires, devis",
      icon: "📐",
    },
    {
      number: "3",
      title: "Transmission",
      description: "Envoi PDF officiel + présentation à distance ou sur site",
      icon: "📄",
    },
  ];

  return (
    <div className="relative z-20 mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-[24px] bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur">
        <h2 className="mb-6 text-center text-2xl font-black text-[#1a1a1a]">
          📋 Déroulement de votre visite d'étude
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-[20px] border-2 border-[#FF6B00]/10 bg-gradient-to-b from-[#FFF7ED] to-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Étape {step.number}</p>
                  <p className="text-lg font-black text-[#FF6B00]">{step.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#4B5563]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}