"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, MapPin, PaintBucket, Send } from "lucide-react";
import { cn } from "@/lib/helpers";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { BottomNav } from "@/components/layout/BottomNav";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import PlanGenerator from "@/components/plans/PlanGenerator";
import { PageBackground } from "@/components/layout/PageBackground";
import BtpBackground from "@/components/btp/BtpBackground";
import { formatFcfa } from "@/utils/currency";
import { RenovationEngine, type TravauxRenovation, type EtatMaison } from "@/services/RenovationEngine";
import { VILLES_CI } from "@/constants/villes";

const TRAVAUX_OPTIONS: { id: TravauxRenovation; label: string; emoji: string }[] = [
  { id: "peinture_int", label: "Peinture intérieure",  emoji: "🎨" },
  { id: "peinture_ext", label: "Peinture extérieure",  emoji: "🏠" },
  { id: "carrelage",    label: "Carrelage / Sol",       emoji: "⬜" },
  { id: "plomberie",    label: "Plomberie",             emoji: "🚿" },
  { id: "electricite",  label: "Électricité",           emoji: "⚡" },
  { id: "toiture",      label: "Toiture",               emoji: "🏗️" },
  { id: "menuiserie",   label: "Menuiserie / Portes",   emoji: "🚪" },
  { id: "faux_plafond", label: "Faux plafond",          emoji: "🔲" },
  { id: "cuisine",      label: "Cuisine",               emoji: "🍳" },
  { id: "salle_bain",   label: "Salle de bain",         emoji: "🛁" },
  { id: "terrasse",     label: "Terrasse",              emoji: "🌿" },
  { id: "cloture",      label: "Clôture / Portail",     emoji: "🔒" },
];

const ETAT_OPTIONS: { id: EtatMaison; label: string; sub: string; color: string }[] = [
  { id: "bon",     label: "Bon état",       sub: "Rafraîchissement léger",   color: "#22C55E" },
  { id: "moyen",   label: "État moyen",     sub: "Rénovation partielle",     color: "#FF7A00" },
  { id: "degrade", label: "Très dégradé",   sub: "Rénovation complète",      color: "#EF4444" },
];

export default function RenovationPage() {
  const [step, setStep] = useState(1);
  const [surface, setSurface]   = useState(100);
  const [location, setLocation] = useState("Abidjan, Cocody");
  const [etat, setEtat]         = useState<EtatMaison>("moyen");
  const [travaux, setTravaux]   = useState<TravauxRenovation[]>([]);

  const next = () => setStep(s => s + 1);
  const back = () => step > 1 && setStep(s => s - 1);

  const toggleTravail = (id: TravauxRenovation) =>
    setTravaux(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  const result = useMemo(() =>
    travaux.length > 0 ? RenovationEngine.calculate({ surfaceM2: surface, location, etat, travaux }) : null,
    [surface, location, etat, travaux]
  );

  const pageContent = step === 5 ? (
    <ScreenWrapper withBottomPadding={false}>
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-6">
        <div className="grid size-24 place-items-center rounded-full bg-[#22C55E] text-white shadow-[0_20px_40px_rgba(34,197,94,0.3)] animate-bounceIn">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="mt-8 text-2xl font-black text-[#0D2B6B]">Demande envoyée !</h1>
        <p className="mt-3 max-w-[280px] text-sm text-[#6B7280]">Un expert BÂTIZEN vous contacte sous 2h pour programmer une visite technique gratuite.</p>
        {result && (
          <div className="mt-6 rounded-[20px] bg-[#EAF2FF] px-6 py-4 text-center">
            <p className="text-xs font-black uppercase text-[#6B7280]">Budget estimé</p>
            <p className="mt-1 text-3xl font-black text-[#0D2B6B]">{formatFcfa(result.total)}</p>
            <p className="mt-1 text-xs text-[#6B7280]">Durée estimée : ~{result.dureeJours} jours</p>
          </div>
        )}
        <PremiumButton className="mt-8 w-full max-w-xs" href="/dashboard">Retour au tableau de bord</PremiumButton>
      </div>
    </ScreenWrapper>
  ) : (
    <ScreenWrapper className="pb-32">
      <PremiumHeader />

      <div className="mb-6 flex items-center gap-3">
        <BackButton onClick={back} />
        <div className="flex-1">
          <h1 className="text-base font-black text-[#0D2B6B]">Rénovation</h1>
          <p className="text-[10px] font-bold text-[#6B7280]">Étape {step} sur 4</p>
        </div>
        <div className="flex h-1.5 w-16 gap-0.5">
          {[1,2,3,4].map(i => <div key={i} className={cn("h-full flex-1 rounded-full transition-all", i <= step ? "bg-[#22C55E]" : "bg-[#E7EBF5]")} />)}
        </div>
      </div>

      <div className="space-y-6 pb-32">
        {/* STEP 1 — Maison */}
        {step === 1 && (
          <>
            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <PaintBucket size={28} className="text-[#22C55E]" />
                <div>
                  <h2 className="text-xl font-black text-[#0D2B6B]">Votre maison</h2>
                  <p className="text-sm text-[#6B7280]">Décrivez le bien à rénover</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#6B7280]">Ville / Quartier</label>
                  <input list="villes-list" value={location} onChange={e => setLocation(e.target.value)}
                    className="h-[54px] w-full rounded-[18px] bg-[#F7F9FC] px-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-[#22C55E]/30"
                    placeholder="Abidjan, Cocody..." />
                  <datalist id="villes-list">
                    {VILLES_CI.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold text-[#6B7280] mb-2">
                    <span>Surface à rénover</span>
                    <span className="font-black text-[#0D2B6B]">{surface} m²</span>
                  </div>
                  <input type="range" min="20" max="500" step="5" value={surface} onChange={e => setSurface(parseInt(e.target.value))} className="w-full" />
                </div>

                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#6B7280]">État général actuel</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ETAT_OPTIONS.map(e => (
                      <button key={e.id} onClick={() => setEtat(e.id)}
                        className={cn("rounded-[16px] p-3 text-center transition-all border-2",
                          etat === e.id ? "border-current bg-white shadow-md" : "border-transparent bg-[#F7F9FC]")}
                        style={etat === e.id ? { color: e.color, borderColor: e.color } : {}}>
                        <p className="text-xs font-black">{e.label}</p>
                        <p className="mt-1 text-[10px] text-[#6B7280]">{e.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PremiumCard>
          </>
        )}

        {/* STEP 2 — Travaux */}
        {step === 2 && (
          <PremiumCard>
            <h2 className="text-xl font-black text-[#0D2B6B]">Travaux souhaités</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Sélectionnez les zones à rénover · {travaux.length} sélectionné(s)</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {TRAVAUX_OPTIONS.map(t => (
                <button key={t.id} onClick={() => toggleTravail(t.id)}
                  className={cn("flex items-center gap-3 rounded-[16px] border-2 p-3 text-left transition-all",
                    travaux.includes(t.id) ? "border-[#22C55E] bg-[#22C55E]/5" : "border-transparent bg-[#F7F9FC]")}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className={cn("text-xs font-bold", travaux.includes(t.id) ? "text-[#22C55E]" : "text-[#6B7280]")}>
                    {travaux.includes(t.id) && "✓ "}{t.label}
                  </span>
                </button>
              ))}
            </div>
          </PremiumCard>
        )}

        {/* STEP 3 — Photos */}
        {step === 3 && (
          <>
            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <Camera size={28} className="text-[#FF7A00]" />
                <div>
                  <h2 className="text-xl font-black text-[#0D2B6B]">Photos & Localisation</h2>
                  <p className="text-sm text-[#6B7280]">Aidez l'expert à préparer sa visite</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <button key={i} type="button" aria-label={`Photo ${i}`}
                    className="grid h-28 place-items-center rounded-[18px] border-2 border-dashed border-[#E7EBF5] bg-[#F7F9FC] transition hover:border-[#22C55E]/30 active:scale-95">
                    <div className="text-center">
                      <Camera size={24} className="mx-auto text-[#6B7280]" />
                      <p className="mt-1 text-[9px] font-bold text-[#6B7280]">Photo {i}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-[#22C55E]/10 p-4 border border-[#22C55E]/20">
                <MapPin size={20} className="text-[#22C55E]" />
                <div>
                  <p className="text-sm font-black text-[#0D2B6B]">Position : {location}</p>
                  <p className="text-xs text-[#6B7280]">Pour la visite technique</p>
                </div>
              </div>
            </PremiumCard>

            {/* Plan 3D interactif */}
            <PremiumCard>
              <h3 className="mb-4 font-black text-[#0D2B6B]">🏗️ Aperçu 3D de votre projet</h3>
              <PlanGenerator />
            </PremiumCard>
          </>
        )}

        {/* STEP 4 — Récapitulatif + Budget */}
        {step === 4 && result && (
          <>
            <PremiumCard intensity="high" className="border-t-[6px] border-t-[#22C55E]">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-[#6B7280]">Budget rénovation estimé</p>
              <p className="mt-3 text-center text-5xl font-black tracking-tighter text-[#0D2B6B]">{formatFcfa(result.total)}</p>
              <div className="mt-2 flex justify-center gap-3">
                <Badge tone="green">{surface} m²</Badge>
                <Badge tone="orange">~{result.dureeJours} jours</Badge>
                <Badge tone="blue">{location.split(",")[0]}</Badge>
              </div>
            </PremiumCard>

            <PremiumCard>
              <h3 className="font-black text-[#0D2B6B]">Détail par poste</h3>
              <div className="mt-4 space-y-2">
                {result.details.map(d => {
                  const pct = Math.round((d.cout / result.total) * 100);
                  return (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#6B7280]">{d.label}</span>
                        <span className="text-[#0D2B6B]">{formatFcfa(d.cout)} · {pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#F7F9FC]">
                        <div className="h-1.5 rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>

            <div className="rounded-[18px] bg-[#FFF7ED] border border-[#FFD6AE] p-4">
              <p className="text-xs font-bold text-[#FF7A00]">💡 Un expert BÂTIZEN vous contactera sous 2h pour une visite technique gratuite et un devis personnalisé.</p>
            </div>

            {/* Section Prendre rendez-vous */}
            <div className="mt-6 p-6 bg-white rounded-2xl shadow-lg border border-[#E7EBF5]">
              <h3 className="text-xl font-bold text-[#0D2B6B] mb-4">📅 Prendre rendez-vous</h3>
              <p className="text-sm text-gray-600 mb-4">
                Un expert vous contactera sous 2h pour programmer une visite technique gratuite.
              </p>
              <button 
                onClick={() => {
                  alert("Rendez-vous demandé ! Un expert vous contactera bientôt.");
                }}
                className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-xl"
              >
                Confirmer le rendez-vous
              </button>
            </div>
          </>
        )}

        {step === 4 && !result && (
          <div className="rounded-[20px] bg-[#F7F9FC] p-8 text-center">
            <p className="font-black text-[#0D2B6B]">Aucun travail sélectionné</p>
            <p className="mt-2 text-sm text-[#6B7280]">Retournez à l'étape 2 pour choisir vos travaux.</p>
          </div>
        )}

        {/* Navigation buttons - position sticky au-dessus de BottomNav */}
        <div className="sticky bottom-24 left-0 right-0 z-30 flex items-center gap-4 bg-white/90 p-5 backdrop-blur-xl border-t border-[#E7EBF5]">
          {step > 1 && (
            <button onClick={back} aria-label="Retour" className="grid size-[56px] place-items-center rounded-[18px] bg-[#F7F9FC] text-[#0D2B6B] transition hover:bg-[#E7EBF5] active:scale-95">
              <ArrowLeft size={22} />
            </button>
          )}
          <button onClick={next} aria-label={step === 4 ? "Envoyer" : "Continuer"}
            className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#22C55E,#15803D)] text-white font-black shadow-[0_12px_28px_rgba(34,197,94,0.3)] transition-all active:scale-[0.97]">
            {step === 4 ? <><Send size={18} /> Envoyer ma demande</> : <><ArrowRight size={18} /> Continuer</>}
          </button>
        </div>
      </div>

      <BottomNav />
    </ScreenWrapper>
  );

  return (
    <BtpBackground
      imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
      overlay="medium"
    >
      {pageContent}
    </BtpBackground>
  );
}