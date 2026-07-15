"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calculator, Sparkles, Home, CheckCircle2 } from "lucide-react";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BackButton } from "@/components/ui/BackButton";
import { HouseModel3D } from "@/components/simulation/HouseModel3D";
import { PlanViewer } from "@/components/simulation/PlanViewer";
import { formatFcfa } from "@/utils/currency";
import BtpBackground from "@/components/btp/BtpBackground";

type Etape = "formulaire" | "loading" | "propositions" | "plan";

interface Preferences {
  budget: number;
  surface: number;
  largeur: number;
  longueur: number;
  etages: number;
  chambres: number;
  style: "Moderne" | "Classique" | "Africain" | "Contemporain";
  couleur: string;
  priorites: string[];
}

interface Proposition {
  id: string;
  nom: string;
  type: string;
  surface: number;
  chambres: number;
  style: string;
  cout: number;
  avantages: string[];
  description: string;
}

export default function SimulationPage() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("formulaire");
  const [formStep, setFormStep] = useState(1);
  const [showPlan, setShowPlan] = useState(false);
  const [selectedProposition, setSelectedProposition] = useState<Proposition | null>(null);
  const [showPaidPlans, setShowPaidPlans] = useState(false);

  const [preferences, setPreferences] = useState<Preferences>({
    budget: 45000000,
    surface: 250,
    largeur: 15,
    longueur: 17,
    etages: 1,
    chambres: 3,
    style: "Moderne",
    couleur: "Blanc",
    priorites: ["Luminosité", "Espace"],
  });

  const [propositions, setPropositions] = useState<Proposition[]>([]);

  const generatePropositions = () => {
    const { budget, surface, largeur, longueur, etages, chambres, style } = preferences;

    const propA: Proposition = {
      id: "A",
      nom: "Maison Simple",
      type: "Économique",
      surface: Math.min(surface, Math.floor(budget / 180000)),
      chambres: chambres,
      style: "Moderne",
      cout: Math.floor(budget * 0.8),
      avantages: ["Luminosité optimisée", "Optimisation de l'espace", "Budget maîtrisé"],
      description: "Maison moderne fonctionnelle et lumineuse",
    };

    const propB: Proposition = {
      id: "B",
      nom: "Maison Confortable",
      type: "Équilibré",
      surface: Math.floor(surface * 0.85),
      chambres: chambres + 1,
      style: "Classique",
      cout: Math.floor(budget * 0.95),
      avantages: ["Espace familial", "Bon rapport qualité/prix", "Design classique"],
      description: "Maison classique chaleureuse et spacieuse",
    };

    const propC: Proposition = {
      id: "C",
      nom: "Villa Prestige",
      type: "Premium",
      surface: Math.floor(surface * 0.95),
      chambres: chambres + 2,
      style: "Contemporain",
      cout: Math.floor(budget * 1.1),
      avantages: ["Standing élevé", "Luxe et confort", "Design contemporain"],
      description: "Villa contemporaine haut de gamme",
    };

    return [propA, propB, propC];
  };

  const handleGenerate = () => {
    setEtape("loading");
    setTimeout(() => {
      const props = generatePropositions();
      setPropositions(props);
      setEtape("propositions");
    }, 3000);
  };

  const handleCreateChantier = (prop: Proposition) => {
    setSelectedProposition(prop);
    setShowPlan(true);
  };

  const handleViewPaidPlans = () => {
    setShowPlan(false);
    setShowPaidPlans(true);
  };

  return (
    <div className="min-h-screen">
      <PremiumHeader />

      <BtpBackground
        imageUrl="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop"
        overlay="medium"
      >
        <main className="min-h-screen pt-24 pb-32">
          <div className="mx-auto max-w-4xl px-4">
          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#0D2B6B]">
              🏠 Simulateur IA
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              Générez 3 propositions personnalisées avec plan 3D
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ÉTAPE 1 : Formulaire */}
            {etape === "formulaire" && (
              <motion.div
                key="formulaire"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="rounded-[24px] bg-white/80 backdrop-blur-xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-[#0D2B6B]">
                      {formStep === 1 ? "💼 Budget & Terrain" : "🎨 Préférences"}
                    </h2>
                    <span className="text-xs font-bold text-[#6B7280]">
                      Étape {formStep}/2
                    </span>
                  </div>

                  {formStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                          Budget disponible (FCFA)
                        </label>
                        <input
                          type="number"
                          value={preferences.budget}
                          onChange={(e) => setPreferences({ ...preferences, budget: Number(e.target.value) })}
                          className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#FF6B00]/30"
                        />
                        <p className="mt-1 text-xs text-[#6B7280]">{formatFcfa(preferences.budget)}</p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                          Surface du terrain (m²)
                        </label>
                        <input
                          type="number"
                          value={preferences.surface}
                          onChange={(e) => setPreferences({ ...preferences, surface: Number(e.target.value) })}
                          className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#FF6B00]/30"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                            Largeur (m)
                          </label>
                          <input
                            type="number"
                            value={preferences.largeur}
                            onChange={(e) => setPreferences({ ...preferences, largeur: Number(e.target.value) })}
                            className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#FF6B00]/30"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                            Longueur (m)
                          </label>
                          <input
                            type="number"
                            value={preferences.longueur}
                            onChange={(e) => setPreferences({ ...preferences, longueur: Number(e.target.value) })}
                            className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#FF6B00]/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                            Étages
                          </label>
                          <select
                            value={preferences.etages}
                            onChange={(e) => setPreferences({ ...preferences, etages: Number(e.target.value) })}
                            className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none"
                          >
                            <option value="1">1 étage</option>
                            <option value="2">2 étages</option>
                            <option value="3">3 étages</option>
                            <option value="4">4 étages</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                            Chambres
                          </label>
                          <select
                            value={preferences.chambres}
                            onChange={(e) => setPreferences({ ...preferences, chambres: Number(e.target.value) })}
                            className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n} chambre{n > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                          Style architectural
                        </label>
                        <select
                          value={preferences.style}
                          onChange={(e) => setPreferences({ ...preferences, style: e.target.value as any })}
                          className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none"
                        >
                          <option value="Moderne">Moderne</option>
                          <option value="Classique">Classique</option>
                          <option value="Africain">Africain</option>
                          <option value="Contemporain">Contemporain</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#6B7280]">
                          Couleur préférée
                        </label>
                        <select
                          value={preferences.couleur}
                          onChange={(e) => setPreferences({ ...preferences, couleur: e.target.value })}
                          className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none"
                        >
                          <option value="Blanc">Blanc</option>
                          <option value="Beige">Beige</option>
                          <option value="Gris">Gris</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-bold text-[#6B7280]">
                          Priorités
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {["Luminosité", "Espace", "Standing", "Budget"].map((priorite) => (
                            <button
                              key={priorite}
                              type="button"
                              onClick={() => {
                                const priorites = preferences.priorites.includes(priorite)
                                  ? preferences.priorites.filter((p) => p !== priorite)
                                  : [...preferences.priorites, priorite];
                                setPreferences({ ...preferences, priorites });
                              }}
                              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                                preferences.priorites.includes(priorite)
                                  ? "bg-[#FF6B00] text-white"
                                  : "bg-[#F7F9FC] text-[#6B7280]"
                              }`}
                            >
                              {priorite}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    {formStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormStep(formStep - 1)}
                        className="flex-1 h-[56px] rounded-[18px] bg-[#F7F9FC] font-bold text-[#0D2B6B]"
                      >
                        Retour
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 2) {
                          handleGenerate();
                        } else {
                          setFormStep(2);
                        }
                      }}
                      className="flex-1 h-[56px] rounded-[18px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] font-bold text-white flex items-center justify-center gap-2"
                    >
                      {formStep === 2 ? (
                        <>
                          <Sparkles size={20} />
                          Générer mes propositions
                        </>
                      ) : (
                        "Continuer"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2 : Loading */}
            {etape === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh]"
              >
                <div className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-2xl animate-pulse">
                  <Sparkles size={48} />
                </div>
                <h2 className="mt-8 text-2xl font-black text-[#0D2B6B]">
                  🤖 L'IA analyse votre terrain et budget...
                </h2>
                <p className="mt-3 text-sm text-[#6B7280]">
                  Génération de 3 propositions personnalisées
                </p>
              </motion.div>
            )}

            {/* ÉTAPE 3 : Propositions */}
            {etape === "propositions" && (
              <motion.div
                key="propositions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-[#0D2B6B] mb-2">
                    3 propositions pour votre projet
                  </h2>
                  <p className="text-sm text-[#6B7280]">
                    Choisissez celle qui correspond à vos besoins
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {propositions.map((prop, index) => (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-[24px] bg-white/80 backdrop-blur-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-black text-[#0D2B6B]">
                          MAISON {prop.id}
                        </span>
                        <span className="rounded-full bg-[#FF6B00]/10 px-3 py-1 text-xs font-bold text-[#FF6B00]">
                          {prop.type}
                        </span>
                      </div>

                      <HouseModel3D
                        style={prop.style as any}
                        etages={preferences.etages}
                        largeur={preferences.largeur}
                        longueur={preferences.longueur}
                      />

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">Surface</span>
                          <span className="font-bold text-[#0D2B6B]">{prop.surface} m²</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">Chambres</span>
                          <span className="font-bold text-[#0D2B6B]">{prop.chambres}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">Style</span>
                          <span className="font-bold text-[#0D2B6B]">{prop.style}</span>
                        </div>
                        <div className="h-px bg-[#E7EBF5] my-3" />
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-[#6B7280]">Coût estimé</span>
                          <span className="text-lg font-black text-[#22C55E]">
                            {formatFcfa(prop.cout)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[16px] bg-[#F7F9FC] p-3">
                        <p className="text-xs font-bold text-[#6B7280] mb-2">✅ Avantages</p>
                        <ul className="space-y-1">
                          {prop.avantages.map((avantage, i) => (
                            <li key={i} className="text-xs text-[#0D2B6B] flex items-start gap-2">
                              <CheckCircle2 size={14} className="text-[#22C55E] mt-0.5" />
                              {avantage}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleCreateChantier(prop)}
                        className="w-full mt-4 h-[48px] rounded-[16px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white font-bold flex items-center justify-center gap-2"
                      >
                        <Home size={18} />
                        Voir le plan
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      </BtpBackground>

      {/* Plan Viewer Modal */}
      {selectedProposition && (
        <PlanViewer
          visible={showPlan}
          onClose={() => setShowPlan(false)}
          style={preferences.style}
          etages={preferences.etages}
          largeur={preferences.largeur}
          longueur={preferences.longueur}
          proposition={selectedProposition.id}
          onViewPaidPlans={handleViewPaidPlans}
        />
      )}

      {/* Paid Plans Section */}
      {showPaidPlans && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl px-4 pb-24"
        >
          <div className="rounded-[24px] bg-white/80 backdrop-blur-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-2xl font-black text-[#0D2B6B] mb-6 text-center">
              🎯 Plans professionnels détaillés
            </h3>

            <div className="space-y-4">
              {/* Plan Standard */}
              <div className="rounded-[20px] bg-white/60 backdrop-blur-lg border-2 border-white/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-black text-[#0D2B6B]">PLAN STANDARD</h4>
                    <p className="text-2xl font-black text-[#FF6B00]">100 000 FCFA</p>
                  </div>
                  <span className="rounded-full bg-[#0B5FFF]/10 px-3 py-1 text-xs font-bold text-[#0B5FFF]">
                    Populaire
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Plan 2D détaillé
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Plan 3D
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Liste des matériaux
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Devis estimatif
                  </li>
                </ul>
                <button className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-xl">
                  📅 Prendre rendez-vous
                </button>
              </div>

              {/* Plan Premium */}
              <div className="rounded-[20px] bg-white/60 backdrop-blur-lg border-2 border-[#FF6B00] p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-black text-[#0D2B6B]">PLAN PREMIUM</h4>
                    <p className="text-2xl font-black text-[#FF6B00]">200 000 FCFA</p>
                  </div>
                  <span className="rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-bold text-white">
                    Recommandé
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Tout le Standard +
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Plans électriques
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Plans plomberie
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Coupe et façades
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Suivi technique (1 visite)
                  </li>
                </ul>
                <button className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-xl">
                  📅 Prendre rendez-vous
                </button>
              </div>

              {/* Plan Expert */}
              <div className="rounded-[20px] bg-white/60 backdrop-blur-lg border-2 border-white/30 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-black text-[#0D2B6B]">PLAN EXPERT</h4>
                    <p className="text-2xl font-black text-[#FF6B00]">350 000 FCFA</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Tout le Premium +
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Plans structure complets
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Étude de sol
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Suivi de chantier (3 visites)
                  </li>
                  <li className="text-sm text-[#6B7280] flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />
                    Assistance administrative
                  </li>
                </ul>
                <button className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-xl">
                  📅 Prendre rendez-vous
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
}