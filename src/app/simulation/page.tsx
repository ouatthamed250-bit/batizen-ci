"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Home, CheckCircle2, X } from "lucide-react";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BackButton } from "@/components/ui/BackButton";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { formatFcfa } from "@/utils/currency";
import BtpBackground from "@/components/btp/BtpBackground";

type Etape = "formulaire" | "loading" | "propositions";

interface Preferences {
  budget: number;
  terrain: {
    surface: number;
    largeur: number;
    longueur: number;
    forme: "Rectangle" | "L" | "Carré" | "Irrégulier";
  };
  batiment: {
    type: "Villa" | "Duplex" | "Immeuble" | "Commerce";
    etages: number;
    chambres: number;
    sallesDeBain: number;
    garage: boolean;
    garagePlaces: number;
    piscine: boolean;
    jardin: boolean;
    jardinSurface: number;
  };
  style: {
    architectural: "Moderne" | "Classique" | "Africain" | "Contemporain" | "Colonial";
    couleur: "Blanc" | "Beige" | "Gris" | "Autre";
    materiaux: string[];
    ambiance: "Lumineuse" | "Cozy" | "Luxueuse" | "Minimaliste";
  };
  priorites: {
    priorite1: "Budget" | "Espace" | "Standing" | "Rapidité";
    contraintes: string[];
    utilisation: "Famille" | "Location" | "Commerce" | "Mixte";
  };
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
  const [mapView, setMapView] = useState<"2d" | "3d">("2d");

  const [preferences, setPreferences] = useState<Preferences>({
    budget: 45000000,
    terrain: { surface: 250, largeur: 15, longueur: 17, forme: "Rectangle" },
    batiment: { type: "Villa", etages: 1, chambres: 3, sallesDeBain: 2, garage: false, garagePlaces: 1, piscine: false, jardin: false, jardinSurface: 50 },
    style: { architectural: "Moderne", couleur: "Blanc", materiaux: [], ambiance: "Lumineuse" },
    priorites: { priorite1: "Budget", contraintes: [], utilisation: "Famille" },
  });

  const [propositions, setPropositions] = useState<Proposition[]>([]);

  const generatePropositions = () => {
    const { budget, terrain, batiment } = preferences;
    return [
      { id: "A", nom: "Maison Simple", type: "Économique", surface: Math.min(terrain.surface, Math.floor(budget / 180000)), chambres: batiment.chambres, style: "Moderne", cout: Math.floor(budget * 0.8), avantages: ["Luminosité optimisée", "Optimisation de l'espace", "Budget maîtrisé"], description: "Maison moderne fonctionnelle et lumineuse" },
      { id: "B", nom: "Maison Confortable", type: "Équilibré", surface: Math.floor(terrain.surface * 0.85), chambres: batiment.chambres + 1, style: "Classique", cout: Math.floor(budget * 0.95), avantages: ["Espace familial", "Bon rapport qualité/prix", "Design classique"], description: "Maison classique chaleureuse et spacieuse" },
      { id: "C", nom: "Villa Prestige", type: "Premium", surface: Math.floor(terrain.surface * 0.95), chambres: batiment.chambres + 2, style: "Contemporain", cout: Math.floor(budget * 1.1), avantages: ["Standing élevé", "Luxe et confort", "Design contemporain"], description: "Villa contemporaine haut de gamme" },
    ];
  };

  const handleGenerate = () => { setEtape("loading"); setTimeout(() => { setPropositions(generatePropositions()); setEtape("propositions"); }, 3000); };
  const handleCreateChantier = (prop: Proposition) => { setSelectedProposition(prop); setShowPlan(true); };
  const handleViewPaidPlans = () => { setShowPlan(false); setShowPaidPlans(true); };

  const updateTerrain = (field: string, value: any) => setPreferences({ ...preferences, terrain: { ...preferences.terrain, [field]: value } });
  const updateBatiment = (field: string, value: any) => setPreferences({ ...preferences, batiment: { ...preferences.batiment, [field]: value } });
  const updateStyle = (field: string, value: any) => setPreferences({ ...preferences, style: { ...preferences.style, [field]: value } });
  const updatePriorites = (field: string, value: any) => setPreferences({ ...preferences, priorites: { ...preferences.priorites, [field]: value } });

  const progressPercent = (formStep / 5) * 100;

  const handleCreateFromSimulation = (propId: string) => {
    const simulationData = {
      budget: preferences.budget,
      terrain: preferences.terrain,
      preferences: {
        type: preferences.batiment.type,
        etages: preferences.batiment.etages,
        chambres: preferences.batiment.chambres,
        sallesDeBain: preferences.batiment.sallesDeBain,
        garage: preferences.batiment.garage,
        piscine: preferences.batiment.piscine,
        jardin: preferences.batiment.jardin,
        style: preferences.style.architectural,
        couleur: preferences.style.couleur,
        materiaux: preferences.style.materiaux,
        ambiance: preferences.style.ambiance,
        priorite: preferences.priorites.priorite1,
        contraintes: preferences.priorites.contraintes,
        utilisation: preferences.priorites.utilisation
      },
      propositionChoisie: propId
    };
    localStorage.setItem('simulationData', JSON.stringify(simulationData));
    router.push('/nouveau-chantier');
  };

  return (
    <div className="min-h-screen">
      <PremiumHeader />
      <BtpBackground imageUrl="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" overlay="medium">
        <main className="min-h-screen pt-24 pb-32">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-black text-white drop-shadow-lg">🏠 Simulateur IA</h1>
              <p className="mt-2 text-sm text-white/80">Générez 3 propositions avec plans 2D/3D</p>
            </div>

            <AnimatePresence mode="wait">
              {etape === "formulaire" && (
                <motion.div key="formulaire" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">Étape {formStep}/5</span>
                      <span className="text-xs text-white/60">{Math.round(progressPercent)}% complété</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/10 backdrop-blur-xl p-6 border border-white/20">
                    
                    {/* ÉTAPE 1 */}
                    {formStep === 1 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white mb-4">💼 Budget & Terrain</h2>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-white">Budget disponible (FCFA, min: 5 000 000)</label>
                          <input type="number" min="5000000" value={preferences.budget} onChange={(e) => setPreferences({ ...preferences, budget: Number(e.target.value) })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none placeholder:text-white/40" placeholder="ex: 45000000" />
                          <p className="mt-1 text-xs text-white/80">{formatFcfa(preferences.budget)}</p>
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-white">Surface du terrain (m²)</label>
                          <input type="number" value={preferences.terrain.surface} onChange={(e) => updateTerrain("surface", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="mb-2 block text-sm font-bold text-white">Largeur (m)</label>
                            <input type="number" value={preferences.terrain.largeur} onChange={(e) => updateTerrain("largeur", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" />
                          </div>
                          <div><label className="mb-2 block text-sm font-bold text-white">Longueur (m)</label>
                            <input type="number" value={preferences.terrain.longueur} onChange={(e) => updateTerrain("longueur", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" />
                          </div>
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-white">Forme du terrain</label>
                          <select value={preferences.terrain.forme} onChange={(e) => updateTerrain("forme", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                            <option value="Rectangle">Rectangle</option><option value="L">L</option><option value="Carré">Carré</option><option value="Irrégulier">Irrégulier</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 2 */}
                    {formStep === 2 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white mb-4">🏢 Type de bâtiment</h2>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="mb-2 block text-sm font-bold text-white">Type</label>
                            <select value={preferences.batiment.type} onChange={(e) => updateBatiment("type", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                              <option value="Villa">Villa</option><option value="Duplex">Duplex</option><option value="Immeuble">Immeuble</option><option value="Commerce">Commerce</option>
                            </select>
                          </div>
                          <div><label className="mb-2 block text-sm font-bold text-white">Étages</label>
                            <select value={preferences.batiment.etages} onChange={(e) => updateBatiment("etages", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                              <option value="1">1 étage</option><option value="2">2 étages</option><option value="3">3 étages</option><option value="4">4 étages</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="mb-2 block text-sm font-bold text-white">Chambres</label>
                            <select value={preferences.batiment.chambres} onChange={(e) => updateBatiment("chambres", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} chambre{n>1?"s":""}</option>)}
                            </select>
                          </div>
                          <div><label className="mb-2 block text-sm font-bold text-white">Salles de bain</label>
                            <select value={preferences.batiment.sallesDeBain} onChange={(e) => updateBatiment("sallesDeBain", Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                              {[1,2,3,4].map(n => <option key={n} value={n}>{n} salle{n>1?"s":""}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="garage" checked={preferences.batiment.garage} onChange={(e) => updateBatiment("garage", e.target.checked)} className="w-5 h-5 rounded" />
                            <label htmlFor="garage" className="text-sm font-bold text-white">Garage</label>
                          </div>
                          {preferences.batiment.garage && (<input type="number" min="1" max="5" value={preferences.batiment.garagePlaces} onChange={(e) => updateBatiment("garagePlaces", Number(e.target.value))} className="h-[48px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none mt-2" placeholder="Places" />)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="piscine" checked={preferences.batiment.piscine} onChange={(e) => updateBatiment("piscine", e.target.checked)} className="w-5 h-5 rounded" />
                            <label htmlFor="piscine" className="text-sm font-bold text-white">Piscine</label>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="jardin" checked={preferences.batiment.jardin} onChange={(e) => updateBatiment("jardin", e.target.checked)} className="w-5 h-5 rounded" />
                            <label htmlFor="jardin" className="text-sm font-bold text-white">Jardin</label>
                          </div>
                          {preferences.batiment.jardin && (<input type="number" value={preferences.batiment.jardinSurface} onChange={(e) => updateBatiment("jardinSurface", Number(e.target.value))} className="h-[48px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none mt-2" placeholder="Surface jardin (m²)" />)}
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 3 */}
                    {formStep === 3 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white mb-4">🎨 Style & Ambiance</h2>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "Moderne", label: "Moderne", desc: "Lignes épurées" },
                            { id: "Classique", label: "Classique", desc: "Colonnes, symétrie" },
                            { id: "Africain", label: "Africain", desc: "Toits traditionnels" },
                            { id: "Contemporain", label: "Contemporain", desc: "Mixte, original" },
                            { id: "Colonial", label: "Colonial", desc: "Héritage CI" },
                          ].map((style) => (
                            <button key={style.id} type="button" onClick={() => updateStyle("architectural", style.id)} className={`p-4 rounded-[18px] text-center transition-all border-2 ${preferences.style.architectural === style.id ? "border-white bg-white/20" : "border-white/20 bg-white/10"}`}>
                              <p className="font-bold text-white">{style.label}</p>
                              <p className="text-xs text-white/60">{style.desc}</p>
                            </button>
                          ))}
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-white">Couleur dominante</label>
                          <select value={preferences.style.couleur} onChange={(e) => updateStyle("couleur", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                            <option value="Blanc">Blanc</option><option value="Beige">Beige</option><option value="Gris">Gris</option><option value="Autre">Autre</option>
                          </select>
                        </div>
                        <div><label className="mb-3 block text-sm font-bold text-white">Matériaux préférés</label>
                          <div className="flex flex-wrap gap-2">
                            {["Bois", "Béton", "Verre", "Pierre", "Mixte"].map((mat) => (
                              <button key={mat} type="button" onClick={() => { const mats = preferences.style.materiaux.includes(mat) ? preferences.style.materiaux.filter(m => m !== mat) : [...preferences.style.materiaux, mat]; updateStyle("materiaux", mats); }} className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${preferences.style.materiaux.includes(mat) ? "bg-white/30 text-white" : "bg-white/10 text-white/60"}`}>{mat}</button>
                            ))}
                          </div>
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-white">Ambiance</label>
                          <select value={preferences.style.ambiance} onChange={(e) => updateStyle("ambiance", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                            <option value="Lumineuse">Lumineuse</option><option value="Cozy">Cozy</option><option value="Luxueuse">Luxueuse</option><option value="Minimaliste">Minimaliste</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 4 */}
                    {formStep === 4 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white mb-4">⚡ Priorités & Contraintes</h2>
                        <div><label className="mb-2 block text-sm font-bold text-white">Priorité n°1</label>
                          <select value={preferences.priorites.priorite1} onChange={(e) => updatePriorites("priorite1", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                            <option value="Budget">Budget</option><option value="Espace">Espace</option><option value="Standing">Standing</option><option value="Rapidité">Rapidité</option>
                          </select>
                        </div>
                        <div><label className="mb-3 block text-sm font-bold text-white">Contraintes</label>
                          <div className="flex flex-wrap gap-2">
                            {["Vis-à-vis", "Bruit", "Vue dégagée", "Soleil matin", "Soleil après-midi", "PMR"].map((c) => (
                              <button key={c} type="button" onClick={() => { const cs = preferences.priorites.contraintes.includes(c) ? preferences.priorites.contraintes.filter(x => x !== c) : [...preferences.priorites.contraintes, c]; updatePriorites("contraintes", cs); }} className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${preferences.priorites.contraintes.includes(c) ? "bg-white/30 text-white" : "bg-white/10 text-white/60"}`}>{c}</button>
                            ))}
                          </div>
                        </div>
                        <div><label className="mb-2 block text-sm font-bold text-white">Utilisation principale</label>
                          <select value={preferences.priorites.utilisation} onChange={(e) => updatePriorites("utilisation", e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">
                            <option value="Famille">Famille</option><option value="Location">Location</option><option value="Commerce">Commerce</option><option value="Mixte">Mixte</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ÉTAPE 5 */}
                    {formStep === 5 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-black text-white mb-4">✅ Validation</h2>
                        <div className="rounded-[20px] bg-white/10 p-4 border border-white/20">
                          <p className="text-xs font-bold text-white/60 mb-2">Récapitulatif :</p>
                          <p className="text-sm text-white"><span className="text-white/60">Budget :</span> {formatFcfa(preferences.budget)}</p>
                          <p className="text-sm text-white"><span className="text-white/60">Terrain :</span> {preferences.terrain.surface}m² ({preferences.terrain.largeur}x{preferences.terrain.longueur}m)</p>
                          <p className="text-sm text-white"><span className="text-white/60">Type :</span> {preferences.batiment.type} - {preferences.batiment.chambres} chb</p>
                          <p className="text-sm text-white"><span className="text-white/60">Style :</span> {preferences.style.architectural}</p>
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-6">
                      {formStep > 1 && (
                        <button type="button" onClick={() => setFormStep(formStep - 1)} className="flex-1 h-[56px] rounded-[18px] bg-white/20 font-bold text-white flex items-center justify-center gap-2 border border-white/20">
                          <ArrowLeft size={18} /> Retour
                        </button>
                      )}
                      <PremiumButton onClick={() => { formStep === 5 ? handleGenerate() : setFormStep(formStep + 1); }} className="flex-1" icon={formStep === 5 ? Sparkles : ArrowRight}>
                        {formStep === 5 ? "Générer mes propositions" : "Suivant"}
                      </PremiumButton>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading */}
              {etape === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-2xl animate-pulse">
                    <Sparkles size={48} />
                  </div>
                  <h2 className="mt-8 text-2xl font-black text-white">🤖 L'IA analyse votre terrain et budget...</h2>
                  <p className="mt-3 text-sm text-white/60">Génération de 3 propositions personnalisées</p>
                </motion.div>
              )}

              {/* Propositions */}
              {etape === "propositions" && (
                <motion.div key="propositions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-black text-white mb-2">3 propositions pour votre projet</h2>
                    <p className="text-sm text-white/60">Choisissez celle qui correspond à vos besoins</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {propositions.map((prop, index) => (
                      <motion.div key={prop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-black text-white">MAISON {prop.id}</span>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">{prop.type}</span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm"><span className="text-white/60">Surface</span><span className="font-bold text-white">{prop.surface} m²</span></div>
                          <div className="flex justify-between text-sm"><span className="text-white/60">Chambres</span><span className="font-bold text-white">{prop.chambres}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-white/60">Style</span><span className="font-bold text-white">{prop.style}</span></div>
                          <div className="h-px bg-white/20 my-3" />
                          <div className="flex justify-between"><span className="text-sm font-bold text-white/60">Coût estimé</span><span className="text-lg font-black text-[#22C55E]">{formatFcfa(prop.cout)}</span></div>
                        </div>
                        <div className="mt-4 rounded-[16px] bg-white/10 p-3">
                          <p className="text-xs font-bold text-white/60 mb-2">✅ Avantages</p>
                          <ul className="space-y-1">{prop.avantages.map((av, i) => <li key={i} className="text-xs text-white flex items-start gap-2"><CheckCircle2 size={14} className="text-[#22C55E] mt-0.5" />{av}</li>)}</ul>
                        </div>
                        <PremiumButton onClick={() => handleCreateChantier(prop)} className="w-full mt-4" variant="success">
                          Voir le plan
                        </PremiumButton>
                        <button onClick={() => handleCreateFromSimulation(prop.id)} className="w-full mt-2 h-[48px] rounded-[18px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white font-bold">
                          Créer ce chantier
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

      <BottomNav />
    </div>
  );
}