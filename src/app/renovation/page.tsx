"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, PaintBucket, MapPin, Building2, Route, Truck, ChevronRight, HardHat } from "lucide-react";
import { cn } from "@/lib/helpers";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import BtpBackground from "@/components/btp/BtpBackground";
import { formatFcfa } from "@/utils/currency";
import { useAuthContext } from "@/contexts/AuthContext";
import { ref, set, push } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

type Step = "form" | "devis" | "confirm";

export default function RenovationPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [step, setStep] = useState<Step>("form");
  const [lieu, setLieu] = useState("");
  const [surface, setSurface] = useState(80);
  const [etages, setEtages] = useState(1);
  const [horsAbidjan, setHorsAbidjan] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [transportGere, setTransportGere] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Calcul du montant estimé (côté client, jamais affiché en détail)
  const calculerMontant = useCallback((): number => {
    let total = surface * 500; // 500 FCFA/m²
    if (etages > 1) total += (etages - 1) * 10000; // 10 000 FCFA/étage sup.
    if (horsAbidjan && !transportGere) total += distanceKm * 500; // 500 FCFA/km si transport non géré
    return total;
  }, [surface, etages, horsAbidjan, distanceKm, transportGere]);

  const montantEstime = step !== "form" ? calculerMontant() : 0;

  const handleSoumettre = useCallback(async () => {
    if (!user || submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      const { database } = getFirebaseServices();
      const demandesRef = ref(database, `demandesRenovation/${user.uid}`);
      const newRef = push(demandesRef);
      const id = newRef.key!;
      await set(newRef, {
        id,
        userId: user.uid,
        lieu,
        surface,
        etages,
        horsAbidjan,
        distanceKm: horsAbidjan ? distanceKm : 0,
        transportGere,
        montantEstime,
        statut: "en_attente",
        createdAt: Date.now(),
      });
      setRequestId(id);
      setStep("confirm");
    } catch (err) {
      console.error("Erreur soumission rénovation:", err);
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [user, lieu, surface, etages, horsAbidjan, distanceKm, transportGere, montantEstime, submitting]);

  return (
    <BtpBackground
      imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
      overlay="medium"
    >
      <div className="min-h-screen pt-8 pb-24 px-2">
        <div className="mx-auto max-w-[430px] space-y-6">
          
          {step === "form" && (
            <>
              <div className="text-center mb-2">
                <h1 className="text-2xl font-black text-white">🔨 Demande de rénovation</h1>
                <p className="text-sm text-blue-100 mt-1">Estimation indicative en quelques clics</p>
              </div>

              <PremiumCard>
                <div className="space-y-5">
                  {/* Lieu */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                      <MapPin size={14} /> Lieu de rénovation
                    </label>
                    <input type="text" value={lieu} onChange={e => setLieu(e.target.value)}
                      placeholder="Ex: Cocody, Abidjan"
                      className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white placeholder-blue-300 outline-none focus:border-[#FF6B00]/50" />
                  </div>

                  {/* Surface */}
                  <div>
                    <div className="flex justify-between text-sm font-bold text-blue-100 mb-2">
                      <span className="flex items-center gap-2"><Building2 size={14} /> Surface</span>
                      <span className="font-black text-white">{surface} m²</span>
                    </div>
                    <input type="range" min="20" max="1000" step="5" value={surface} onChange={e => setSurface(parseInt(e.target.value))} className="w-full accent-[#FF6B00]" />
                  </div>

                  {/* Étages */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                      <Building2 size={14} /> Nombre d'étages
                    </label>
                    <select value={etages} onChange={e => setEtages(parseInt(e.target.value))}
                      className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none focus:border-[#FF6B00]/50">
                      <option value={1}>Rez-de-chaussée (RDC)</option>
                      <option value={2}>R+1</option>
                      <option value={3}>R+2</option>
                      <option value={4}>R+3</option>
                    </select>
                  </div>

                  {/* Hors Abidjan ? */}
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="horsAbidjan" checked={horsAbidjan} onChange={e => setHorsAbidjan(e.target.checked)}
                      className="w-5 h-5 rounded accent-[#FF6B00]" />
                    <label htmlFor="horsAbidjan" className="text-sm font-bold text-white">Le site est situé hors d'Abidjan</label>
                  </div>

                  {horsAbidjan && (
                    <>
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                          <Route size={14} /> Distance depuis Abidjan (km)
                        </label>
                        <input type="number" min={1} max={1000} value={distanceKm || ""} onChange={e => setDistanceKm(parseInt(e.target.value) || 0)}
                          placeholder="Ex: 150"
                          className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white placeholder-blue-300 outline-none focus:border-[#FF6B00]/50" />
                      </div>

                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="transportGere" checked={transportGere} onChange={e => setTransportGere(e.target.checked)}
                          className="w-5 h-5 rounded accent-[#FF6B00]" />
                        <label htmlFor="transportGere" className="text-sm font-bold text-white">
                          <Truck size={14} className="inline mr-1" />
                          Je gère moi-même le transport de mon site vers Abidjan
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </PremiumCard>

              <PremiumButton onClick={() => setStep("devis")} className="w-full" icon={ArrowRight}>
                Voir mon estimation
              </PremiumButton>
            </>
          )}

          {step === "devis" && (
            <>
              <div className="text-center mb-2">
                <h1 className="text-2xl font-black text-white">📋 Votre estimation</h1>
              </div>

              <PremiumCard intensity="high" className="border-t-[6px] border-t-[#FF6B00] text-center">
                <p className="text-sm text-blue-200 mb-1">Montant estimé indicatif</p>
                <p className="text-5xl font-black text-white">{formatFcfa(montantEstime)}</p>
                <div className="mt-4 rounded-[16px] bg-white/10 p-4 text-left text-sm text-blue-100 leading-relaxed">
                  Sur la base des informations fournies, voici une estimation indicative de votre projet de rénovation.
                  Ce montant sera affiné après notre visite technique.
                </div>
              </PremiumCard>

              <div className="flex gap-3">
                <button onClick={() => setStep("form")}
                  className="flex-1 h-[56px] rounded-[18px] bg-white/10 border border-white/20 font-bold text-white transition hover:bg-white/20">
                  Modifier
                </button>
                <PremiumButton onClick={handleSoumettre} disabled={submitting} className="flex-[2]" icon={CheckCircle2}>
                  {submitting ? "Envoi..." : "Confirmer la demande"}
                </PremiumButton>
              </div>
            </>
          )}

          {step === "confirm" && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="grid size-24 place-items-center rounded-full bg-[#22C55E] text-white shadow-[0_20px_40px_rgba(34,197,94,0.3)] mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h1 className="text-2xl font-black text-white">Demande envoyée !</h1>
              <p className="mt-3 max-w-[280px] text-sm text-blue-100">
                Après étude, vous serez contacté pour confirmation au bureau et activation du suivi de votre rénovation.
              </p>
              <div className="mt-8 w-full space-y-3">
                <PremiumButton onClick={() => router.push("/dashboard")} className="w-full">
                  🏠 Retour au tableau de bord
                </PremiumButton>
                {requestId && (
                  <PremiumButton onClick={() => router.push(`/renovation-en-cours/${requestId}`)} variant="secondary" className="w-full">
                    👁️ Voir ma demande
                  </PremiumButton>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </BtpBackground>
  );
}