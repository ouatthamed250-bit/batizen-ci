"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, HardHat, MapPin, Wallet, Calendar, Building2, Home, Paintbrush } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ref, set, onValue } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { formatFcfa } from "@/utils/currency";
import PlanGenerator2D from "@/components/simulation/PlanGenerator2D";
import PlanGenerator3D from "@/components/simulation/PlanGenerator3D";
import SuperCalculateur from "@/components/btp/SuperCalculateur";
import ChatBot from "@/components/ChatBot";
import { Suspense } from "react";

type FormData = {
  nom?: string;
  type?: string;
  surfaceTerrain?: number;
  surfaceConstruite?: number;
  niveaux?: number;
  chambres?: number;
  sallesDeBain?: number;
  ville?: string;
  commune?: string;
  quartier?: string;
  adresse?: string;
  typeTerrain?: string;
  materiauxGrosOeuvre?: any;
  materiauxFinitions?: any;
  budget?: number;
  apport?: number;
  financement?: string[];
  delai?: string;
  dateDebut?: string;
  contraintes?: string;
  planChoisi?: string;
  planType?: string;
  rendezVous?: any;
  dateCreation?: number;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Wrapper avec Suspense pour useSearchParams
export default function NouveauChantierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <NouveauChantierContent />
    </Suspense>
  );
}

function NouveauChantierContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuthContext();
  const [step, setStep] = useState<Step>(1);
  const [prefilledData, setPrefilledData] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showRdvForm, setShowRdvForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingChantier, setExistingChantier] = useState<FormData | null>(null);
  const [editChantierId, setEditChantierId] = useState<string | null>(null);
  // Garde-fou anti-réentrance : empêche handleSubmit de tourner en boucle
  const submittingRef = useRef(false);
  const [chantierId, setChantierId] = useState<string | null>(null);
  const [rdvData, setRdvData] = useState({
    lieu: "bureau",
    date: "",
    heure: "10:00",
    nom: "",
    telephone: "",
    email: "",
    commentaire: ""
  });

// Read simulation data from localStorage
  useEffect(() => {
    const simulationData = localStorage.getItem('simulationData');
    if (simulationData) {
      try {
        const parsed = JSON.parse(simulationData);
        setPrefilledData(parsed);
        setFormData(parsed);
      } catch (e) {
        console.error("Error parsing simulation data:", e);
      }
    }
    
    // Vérifier si on est en mode édition
    const editId = params.get("edit");
    if (editId && user?.uid) {
      setIsEditMode(true);
      setEditChantierId(editId);
      console.log("🔧 Mode édition activé pour le chantier:", editId);
      
      const { database } = getFirebaseServices();
      const chantierRef = ref(database, `chantiers/${editId}`);
      onValue(chantierRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          console.log("📦 Chargement données chantier pour édition:", data);
          setFormData(data);
          setExistingChantier(data);
          if (data.planChoisi) setSelectedPlan(data.planChoisi);
          if (data.rendezVous) setRdvData(data.rendezVous);
        }
      });
    }
  }, [params, user?.uid]);

  const handleNext = () => {
    if (step < 8) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  // Fonction récursive pour remplacer tous les 'undefined' par '' ou null
  const sanitizeData = (obj: any): any => {
    if (obj === undefined) return "";
    if (obj === null) return null;
    if (Array.isArray(obj)) return obj.map(sanitizeData);
    if (typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, sanitizeData(value)])
      );
    }
    return obj;
  };

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    setFormData({ ...formData, planChoisi: plan });
    setShowRdvForm(true);
  };

  const handleSubmit = async () => {
    // ⛔ Garde-fou : si une soumission est déjà en cours (ou déjà créée), on bloque.
    if (submittingRef.current || chantierId) {
      console.warn("⛔ handleSubmit ignoré : création de chantier déjà en cours / déjà effectuée");
      return;
    }
    console.log("═══════════════════════════════════════");
    console.log(isEditMode ? "🔵 DÉBUT DE LA MODIFICATION" : "🔵 DÉBUT DE LA SOUMISSION");
    console.log("═══════════════════════════════════════");
    console.log("Données du formulaire:", formData);
    console.log("Plan choisi:", selectedPlan || formData.planType || "gratuit");
    console.log("User UID:", user?.uid);

    if (!user) {
      console.error("❌ ERREUR : Utilisateur non connecté !");
      setLoading(false);
      return;
    }

    // Verrouille immédiatement pour bloquer toute réentrance
    submittingRef.current = true;
    setLoading(true);
    
    try {
      const { database } = getFirebaseServices();
      
      // En mode édition, on met à jour le chantier existant
      const chantierIdToUse = isEditMode ? editChantierId : `chantier_${Date.now()}`;
      
      if (!isEditMode) {
        console.log("✅ ID du chantier créé:", chantierIdToUse);
      } else {
        console.log("✅ ID du chantier existant:", chantierIdToUse);
      }

      setChantierId(chantierIdToUse);

      // Données du chantier
      const chantierData = {
        id: chantierIdToUse,
        userId: user?.uid || "inconnu",
        nom: formData.nom || "Chantier sans nom",
        type: formData.type || "construction",
        surface: Number(formData.surfaceConstruite) || 150,
        localisation: {
          ville: formData.ville || "—",
          commune: formData.commune || "—",
          quartier: formData.quartier || "—",
          adresse: formData.adresse ?? ""
        },
        materiaux: {
          grosOeuvre: formData.materiauxGrosOeuvre || {},
          finitions: formData.materiauxFinitions || {}
        },
        budget: formData.budget || 0,
        apport: formData.apport || 0,
        financement: formData.financement || [],
        delai: formData.delai || "6mois",
        dateDebut: formData.dateDebut || "",
        contraintes: formData.contraintes || "",
        planChoisi: formData.planChoisi || formData.planType || "gratuit",
        rendezVous: rdvData,
        statut: "en_attente",
        dateCreation: isEditMode ? existingChantier?.dateCreation || Date.now() : Date.now(),
        dateMiseAJour: Date.now()
      };

      console.log("📦 DONNÉES ENVOYÉES À FIREBASE :", JSON.stringify(chantierData, null, 2));

      const chantierRef = ref(database, `chantiers/${chantierIdToUse}`);
      await set(chantierRef, chantierData);

      console.log("📦 Données écrites dans Firebase");

      // Notification admin uniquement pour nouvelle création
      if (!isEditMode) {
        await set(ref(database, `notifications/admin/nouveau_chantier_${chantierIdToUse}`), {
          type: "nouveau_chantier",
          chantierId: chantierIdToUse,
          userId: user.uid,
          userName: user.displayName || user.email,
          planChoisi: formData.planChoisi || formData.planType || "gratuit",
          rendezVous: sanitizeData(rdvData),
          dateCreation: Date.now(),
          lu: false
        });
        localStorage.removeItem('simulationData');
      }

      console.log(isEditMode ? "🟢 Modification terminée avec succès" : "🟢 Soumission terminée avec succès");
      console.log("═══════════════════════════════════════");
      
    } catch (error) {
      console.error("❌ ERREUR lors de la soumission:", error);
      submittingRef.current = false;
      setLoading(false);
      alert("Erreur lors de la soumission. Veuillez réessayer.");
    }
  };

  // Show success screen after submission
  if (loading && chantierId) {
    return (
      <BtpPageBackground imageUrl={PHOTOS_CHANTIER.nouveauChantier} overlayClassName="bg-gradient-to-b from-black/60 via-black/70 to-black/80">
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="rounded-[24px] bg-white/10 backdrop-blur-xl p-8 border border-white/20 max-w-md w-full mx-4 text-center">
            <CheckCircle2 size={64} className="text-[#22C55E] mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-4">✅ Projet soumis avec succès !</h2>
            <p className="text-white/80 mb-4">📞 Nous vous contacterons bientôt pour confirmer votre rendez-vous.</p>
            <div className="space-y-3 text-left mb-6">
              <p className="text-white"><span className="text-white/60">🏗️ Projet :</span> {formData.nom || '—'}</p>
              <p className="text-white"><span className="text-white/60">📅 RDV :</span> {rdvData.date || 'À définir'} à {rdvData.heure}</p>
              <p className="text-white"><span className="text-white/60">💼 Plan :</span> {selectedPlan || formData.planType || 'gratuit'}</p>
              <p className="text-white/80">⏳ Statut : En attente de validation</p>
              <div className="bg-white/20 rounded-xl p-3 mt-4">
                <p className="text-sm font-bold text-white">
                  <strong>ID du chantier :</strong> {chantierId}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <PremiumButton 
                onClick={() => {
                  console.log("🏠 Clic sur Retour Dashboard");
                  router.push('/dashboard');
                }} 
                variant="secondary" 
                className="w-full"
              >
                🏠 Retour au Dashboard
              </PremiumButton>
              <PremiumButton 
                onClick={() => {
                  console.log("═══════════════════════════════════════");
                  console.log("👁️ CLIC SUR VOIR MON CHANTIER");
                  console.log("chantierId actuel:", chantierId);
                  console.log("URL de redirection:", `/chantier/${chantierId}`);
                  console.log("═══════════════════════════════════════");
                  
                  if (chantierId) {
                    console.log("✅ Redirection en cours...");
                    router.push(`/chantier/${chantierId}`);
                  } else {
                    console.error("❌ ERREUR : chantierId est null ou undefined !");
                    alert("Erreur : impossible de retrouver votre chantier. Veuillez retourner au dashboard.");
                  }
                }} 
                variant="primary" 
                className="w-full"
              >
                👁️ Voir mon chantier
              </PremiumButton>
            </div>
          </div>
        </div>
      </BtpPageBackground>
    );
  }

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.nouveauChantier} overlayClassName="bg-gradient-to-b from-black/60 via-black/70 to-black/80">
      <div className="min-h-screen">
        <PremiumHeader />
        
        <main className="min-h-screen pt-20 pb-24">
          <div className="mx-2">
            {prefilledData && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 mx-2 rounded-[18px] bg-white/20 border border-white/30 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#FF6B00]" />
                  <p className="text-sm font-bold text-white">📐 Données importées depuis votre simulation. Vous pouvez modifier les champs.</p>
                </div>
              </motion.div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Étape {step}/8</span>
                <span className="text-xs font-bold text-[#FF6B00]">{Math.round((step / 8) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20">
                <motion.div className="h-2 rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00]" initial={{ width: 0 }} animate={{ width: `${(step / 8) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
              {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}
              {step === 3 && <Step3 formData={formData} setFormData={setFormData} />}
              {step === 4 && <Step4 formData={formData} setFormData={setFormData} />}
              {step === 5 && <Step5 formData={formData} setFormData={setFormData} />}
              {step === 6 && <Step6 formData={formData} setFormData={setFormData} />}
              {step === 7 && <Step7 formData={formData} setFormData={setFormData} />}
              {step === 8 && <Step8 formData={formData} selectedPlan={selectedPlan} onPlanSelect={handlePlanSelect} showRdvForm={showRdvForm} rdvData={rdvData} setRdvData={setRdvData} prefilledData={prefilledData} viewMode={viewMode} setViewMode={setViewMode} onHandleSubmit={handleSubmit} />}
            </AnimatePresence>

            {!loading && (
              <div className="mt-8 flex gap-4">
                {step > 1 && (
                  <button onClick={handleBack} className="flex h-[56px] items-center justify-center gap-2 rounded-[18px] bg-white/20 px-8 font-bold text-white transition hover:bg-white/30">
                    <ArrowLeft size={20} /> Précédent
                  </button>
                )}
                {step < 8 ? (
                  <button onClick={handleNext} className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-8 font-bold text-white shadow-lg transition hover:shadow-xl">
                    Suivant <ArrowRight size={20} />
                  </button>
                ) : selectedPlan && showRdvForm ? (
                  <button onClick={handleSubmit} className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#22C55E] to-[#15803D] px-8 font-bold text-white shadow-lg transition hover:shadow-xl">
                    <CheckCircle2 size={20} /> Soumettre le projet
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </main>
      </div>
    </BtpPageBackground>
  );
}

function Step1({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><Building2 size={24} className="text-white" /></div>
        <div><h2 className="text-xl font-black text-white">Type de projet</h2><p className="text-sm text-white/60">Décrivez votre projet de construction</p></div>
      </div>
      <div className="space-y-4">
        <div><label className="mb-2 block text-sm font-bold text-white">Nom du projet</label><input type="text" value={formData.nom || ""} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder="Ex: Ma villa à Cocody" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none placeholder:text-white/40" /></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Type de projet</label>
          <select value={formData.type || ""} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="villa">🏠 Villa</option><option value="immeuble">🏢 Immeuble</option><option value="duplex">🏘️ Duplex</option><option value="commerce">🏪 Commerce</option><option value="entrepot">🏭 Entrepôt</option><option value="renovation">🔨 Rénovation</option><option value="autre">📋 Autre</option></select>
        </div>
      </div>
    </motion.div>
  );
}

function Step2({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><Home size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Surface et dimensions</h2><p className="text-sm text-white/60">Définissez les dimensions de votre projet</p></div></div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-2 block text-sm font-bold text-white">Surface terrain (m²)</label><input type="number" value={formData.surfaceTerrain || ""} onChange={(e) => setFormData({ ...formData, surfaceTerrain: Number(e.target.value) })} placeholder="250" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
          <div><label className="mb-2 block text-sm font-bold text-white">Surface construite (m²)</label><input type="number" value={formData.surfaceConstruite || ""} onChange={(e) => setFormData({ ...formData, surfaceConstruite: Number(e.target.value) })} placeholder="180" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="mb-2 block text-sm font-bold text-white">Niveaux</label><select value={formData.niveaux || ""} onChange={(e) => setFormData({ ...formData, niveaux: Number(e.target.value) })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></div>
          <div><label className="mb-2 block text-sm font-bold text-white">Chambres</label><select value={formData.chambres || ""} onChange={(e) => setFormData({ ...formData, chambres: Number(e.target.value) })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="mb-2 block text-sm font-bold text-white">Salles de bain</label><select value={formData.sallesDeBain || ""} onChange={(e) => setFormData({ ...formData, sallesDeBain: Number(e.target.value) })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none">{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
      </div>
    </motion.div>
  );
}

function Step3({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><MapPin size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Localisation</h2><p className="text-sm text-white/60">Où se trouve votre terrain ?</p></div></div>
      <div className="space-y-4">
        <div><label className="mb-2 block text-sm font-bold text-white">Ville</label><select value={formData.ville || ""} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="Abidjan">Abidjan</option><option value="Yamoussoukro">Yamoussoukro</option><option value="Bouaké">Bouaké</option><option value="Korhogo">Korhogo</option><option value="San-Pédro">San-Pédro</option><option value="Daloa">Daloa</option></select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-2 block text-sm font-bold text-white">Commune</label><input type="text" value={formData.commune || ""} onChange={(e) => setFormData({ ...formData, commune: e.target.value })} placeholder="Cocody" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
          <div><label className="mb-2 block text-sm font-bold text-white">Quartier</label><input type="text" value={formData.quartier || ""} onChange={(e) => setFormData({ ...formData, quartier: e.target.value })} placeholder="Riviera" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
        </div>
        <div><label className="mb-2 block text-sm font-bold text-white">Adresse précise</label><input type="text" value={formData.adresse || ""} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} placeholder="Ex: Rue 12, Villa 45" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Type de terrain</label><select value={formData.typeTerrain || ""} onChange={(e) => setFormData({ ...formData, typeTerrain: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="plat">Plat</option><option value="pente">En pente</option><option value="difficile">Accès difficile</option></select></div>
      </div>
    </motion.div>
  );
}

function Step4({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><HardHat size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Matériaux gros œuvre</h2><p className="text-sm text-white/60">Sélectionnez les matériaux de base</p></div></div>
      <div className="space-y-4">
        <div><label className="mb-2 block text-sm font-bold text-white">Ciment</label><select value={formData.materiauxGrosOeuvre?.ciment || ""} onChange={(e) => setFormData({ ...formData, materiauxGrosOeuvre: { ...formData.materiauxGrosOeuvre, ciment: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="cpj42">Ciment CPJ 42.5 - 5 200 FCFA/sac</option><option value="cpj35">Ciment CPJ 35 - 4 800 FCFA/sac</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Fer à béton</label><select value={formData.materiauxGrosOeuvre?.fer || ""} onChange={(e) => setFormData({ ...formData, materiauxGrosOeuvre: { ...formData.materiauxGrosOeuvre, fer: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="ha12">HA 12mm - 4 200 FCFA/barre</option><option value="ha10">HA 10mm - 3 800 FCFA/barre</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Briques/Parpaings</label><select value={formData.materiauxGrosOeuvre?.briques || ""} onChange={(e) => setFormData({ ...formData, materiauxGrosOeuvre: { ...formData.materiauxGrosOeuvre, briques: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="15x20x40">15x20x40 - 350 FCFA/unité</option><option value="20x20x40">20x20x40 - 400 FCFA/unité</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Sable</label><select value={formData.materiauxGrosOeuvre?.sable || ""} onChange={(e) => setFormData({ ...formData, materiauxGrosOeuvre: { ...formData.materiauxGrosOeuvre, sable: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="sable1">Sable fin - 45 000 FCFA/m³</option><option value="sable2">Sable grossier - 40 000 FCFA/m³</option></select></div>
      </div>
    </motion.div>
  );
}

function Step5({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><Paintbrush size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Matériaux finitions</h2><p className="text-sm text-white/60">Sélectionnez les matériaux de finition</p></div></div>
      <div className="space-y-4">
        <div><label className="mb-2 block text-sm font-bold text-white">Carrelage</label><select value={formData.materiauxFinitions?.carrelage || ""} onChange={(e) => setFormData({ ...formData, materiauxFinitions: { ...formData.materiauxFinitions, carrelage: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="premium">Carrelage premium - 12 500 FCFA/m²</option><option value="standard">Carrelage standard - 8 500 FCFA/m²</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Peinture</label><select value={formData.materiauxFinitions?.peinture || ""} onChange={(e) => setFormData({ ...formData, materiauxFinitions: { ...formData.materiauxFinitions, peinture: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="lux">Peinture lux - 15 000 FCFA/seau</option><option value="standard">Peinture standard - 10 000 FCFA/seau</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Toiture</label><select value={formData.materiauxFinitions?.toiture || ""} onChange={(e) => setFormData({ ...formData, materiauxFinitions: { ...formData.materiauxFinitions, toiture: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="tuile">Tuile - 8 000 FCFA/m²</option><option value="bac">Bac acier - 6 500 FCFA/m²</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Menuiserie</label><select value={formData.materiauxFinitions?.menuiserie || ""} onChange={(e) => setFormData({ ...formData, materiauxFinitions: { ...formData.materiauxFinitions, menuiserie: e.target.value } })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="">Sélectionnez...</option><option value="bois">Bois - 25 000 FCFA/porte</option><option value="alu">Aluminium - 35 000 FCFA/porte</option></select></div>
      </div>
    </motion.div>
  );
}

function Step6({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  const toggleFinancement = (mode: string) => {
    const current = formData.financement || [];
    setFormData({ ...formData, financement: current.includes(mode) ? current.filter(f => f !== mode) : [...current, mode] });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><Wallet size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Budget et financement</h2><p className="text-sm text-white/60">Définissez votre budget</p></div></div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-2 block text-sm font-bold text-white">Budget total (FCFA)</label><input type="number" value={formData.budget || ""} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} placeholder="45 000 000" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
          <div><label className="mb-2 block text-sm font-bold text-white">Apport personnel (FCFA)</label><input type="number" value={formData.apport || ""} onChange={(e) => setFormData({ ...formData, apport: Number(e.target.value) })} placeholder="15 000 000" className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
        </div>
        <div><label className="mb-3 block text-sm font-bold text-white">Mode de financement</label><div className="flex flex-wrap gap-2">{['Comptant', 'Échelonné', 'Crédit bancaire', 'Mixte'].map(mode => <button key={mode} type="button" onClick={() => toggleFinancement(mode)} className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${(formData.financement || []).includes(mode) ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60'}`}>{mode}</button>)}</div></div>
      </div>
    </motion.div>
  );
}

function Step7({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6"><div className="grid size-12 place-items-center rounded-[16px] bg-[#FF6B00]"><Calendar size={24} className="text-white" /></div><div><h2 className="text-xl font-black text-white">Délai et planning</h2><p className="text-sm text-white/60">Définissez votre planning</p></div></div>
      <div className="space-y-4">
        <div><label className="mb-2 block text-sm font-bold text-white">Délai souhaité</label><select value={formData.delai || ""} onChange={(e) => setFormData({ ...formData, delai: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="6mois">6 mois</option><option value="12mois">12 mois</option><option value="18mois">18 mois</option><option value="24mois">24 mois+</option></select></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Date de début souhaitée</label><input type="date" value={formData.dateDebut || ""} onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
        <div><label className="mb-2 block text-sm font-bold text-white">Contraintes particulières</label><textarea value={formData.contraintes || ""} onChange={(e) => setFormData({ ...formData, contraintes: e.target.value })} placeholder="Ex: Saison des pluies, accès limité, etc." rows={3} className="w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
      </div>
    </motion.div>
  );
}

function Step8({ formData, selectedPlan, onPlanSelect, showRdvForm, rdvData, setRdvData, prefilledData, viewMode, setViewMode, onHandleSubmit }: { formData: FormData; selectedPlan: string | null; onPlanSelect: (plan: string) => void; showRdvForm: boolean; rdvData: any; setRdvData: (data: any) => void; prefilledData: any; viewMode: "2d" | "3d"; setViewMode: (mode: "2d" | "3d") => void; onHandleSubmit: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      {/* Calculateur BTP - Estimation */}
      {prefilledData && (
        <SuperCalculateur
          surface={prefilledData.terrain?.surface || formData.surfaceConstruite || 150}
          largeur={prefilledData.terrain?.largeur || 15}
          longueur={prefilledData.terrain?.longueur || 20}
          chambres={prefilledData.preferences?.chambres || formData.chambres || 3}
          sallesDeBain={prefilledData.preferences?.sallesDeBain || formData.sallesDeBain || 2}
          etages={prefilledData.preferences?.etages || formData.niveaux || 1}
          garage={prefilledData.preferences?.garage || false}
          piscine={prefilledData.preferences?.piscine || false}
          jardin={false}
          standing="moyen"
          style={prefilledData.preferences?.style || "Moderne"}
          mode="complet"
        />
      )}
      
      <p className="text-center text-sm text-white/60">
        💡 Comparez cette estimation avec les plans professionnels ci-dessous pour choisir la formule adaptée à votre budget.
      </p>

      <div className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-black text-white mb-4">📋 Récapitulatif</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">Nom du projet</span><span className="font-bold text-white">{formData.nom || '—'}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Type</span><span className="font-bold text-white">{formData.type || '—'}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Surface</span><span className="font-bold text-white">{formData.surfaceConstruite || 0} m²</span></div>
          <div className="flex justify-between"><span className="text-white/60">Localisation</span><span className="font-bold text-white">{formData.ville || '—'}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Budget</span><span className="font-bold text-white">{formatFcfa(formData.budget || 0)}</span></div>
        </div>
      </div>

      {/* Plan gratuit - TOUJOURS affiché */}
      <div className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-black text-white mb-4">🎨 VOTRE PLAN GRATUIT</h2>
        <p className="text-xs italic text-white/60 mb-4">⚠️ Ceci est juste une maquette de base générée selon vos renseignements. Nos experts vous fourniront un plan professionnel détaillé lors du rendez-vous.</p>
        
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setViewMode("2d")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${viewMode === "2d" ? "bg-[#FF6B00] text-white" : "bg-white/20 text-white"}`}
          >
            📐 Vue 2D
          </button>
          <button 
            onClick={() => setViewMode("3d")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${viewMode === "3d" ? "bg-[#FF6B00] text-white" : "bg-white/20 text-white"}`}
          >
            🏠 Vue 3D
          </button>
        </div>
        
        <div className="bg-white rounded-xl p-4">
          {viewMode === "2d" ? (
            <PlanGenerator2D
              surface={formData.surfaceConstruite || prefilledData?.terrain?.surface || 150}
              largeur={prefilledData?.terrain?.largeur || 15}
              longueur={prefilledData?.terrain?.longueur || 20}
              chambres={formData.chambres || prefilledData?.preferences?.chambres || 3}
              sallesDeBain={formData.sallesDeBain || prefilledData?.preferences?.sallesDeBain || 2}
              etages={formData.niveaux || prefilledData?.preferences?.etages || 1}
              garage={prefilledData?.preferences?.garage || false}
              piscine={prefilledData?.preferences?.piscine || false}
              style={prefilledData?.preferences?.style || "Moderne"}
            />
          ) : (
            <PlanGenerator3D
              surface={formData.surfaceConstruite || prefilledData?.terrain?.surface || 150}
              largeur={prefilledData?.terrain?.largeur || 15}
              longueur={prefilledData?.terrain?.longueur || 20}
              chambres={formData.chambres || prefilledData?.preferences?.chambres || 3}
              sallesDeBain={formData.sallesDeBain || prefilledData?.preferences?.sallesDeBain || 2}
              etages={formData.niveaux || prefilledData?.preferences?.etages || 1}
              garage={prefilledData?.preferences?.garage || false}
              piscine={prefilledData?.preferences?.piscine || false}
              style={prefilledData?.preferences?.style || "Moderne"}
            />
          )}
        </div>
      </div>

      {/* BOUTON PRINCIPAL - Continuer avec le plan gratuit */}
      {prefilledData && (
        <div className="mt-6 space-y-3">
          {/* BOUTON PRINCIPAL */}
          <PremiumButton 
            variant="primary"
            onClick={onHandleSubmit}
            className="w-full"
          >
            ✅ Continuer avec le plan gratuit
          </PremiumButton>
          
          <p className="text-xs text-white/60 text-center">
            Nos experts vous contacteront pour discuter des options professionnelles
          </p>
          
          {/* Séparateur */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-xs text-white/60">OU</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
        </div>
      )}

      <div className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-xl font-black text-white mb-4">🎯 Choisissez votre plan professionnel</h2>
        <div className="space-y-4">
          {[
            { id: 'standard', name: 'PLAN STANDARD', price: '100 000 FCFA', features: ['Plan 2D détaillé', 'Plan 3D', 'Liste des matériaux', 'Devis estimatif'] },
            { id: 'premium', name: 'PLAN PREMIUM', price: '200 000 FCFA', features: ['Tout le Standard +', 'Plans électriques', 'Plans plomberie', 'Coupe et façades', 'Suivi technique (1 visite)'], recommended: true },
            { id: 'expert', name: 'PLAN EXPERT', price: '350 000 FCFA', features: ['Tout le Premium +', 'Plans structure complets', 'Étude de sol', 'Suivi de chantier (3 visites)', 'Assistance administrative'] }
          ].map(plan => (
            <div key={plan.id} onClick={() => onPlanSelect(plan.id)} className={`rounded-[20px] border-2 p-6 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-white bg-white/20' : 'border-white/20 bg-white/10'} ${plan.recommended ? 'relative' : ''}`}>
              {plan.recommended && <span className="absolute -top-3 right-4 rounded-full bg-[#FF6B00] px-3 py-1 text-xs font-bold text-white">Recommandé</span>}
              <div className="flex items-start justify-between mb-3"><h3 className="text-lg font-black text-white">{plan.name}</h3><p className="text-2xl font-black text-white">{plan.price}</p></div>
              <ul className="space-y-2 mb-4">{plan.features.map((feature, i) => <li key={i} className="text-sm text-white/60 flex items-start gap-2"><CheckCircle2 size={16} className="text-[#22C55E] mt-0.5" />{feature}</li>)}</ul>
              <button className="w-full bg-white/20 text-white font-bold py-3 rounded-xl">{selectedPlan === plan.id ? '✓ Sélectionné' : 'SÉLECTIONNER'}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton soumettre avec plan payant */}
      {selectedPlan && (
        <PremiumButton 
          variant="secondary"
          onClick={onHandleSubmit}
          className="w-full mt-4"
        >
          💼 Soumettre avec le plan {selectedPlan}
        </PremiumButton>
      )}

      {showRdvForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-2 rounded-[24px] bg-white/10 backdrop-blur-xl p-6 shadow-lg border border-white/20">
          <h2 className="text-xl font-black text-white mb-4">📅 Prendre rendez-vous avec un expert</h2>
          <div className="space-y-4">
            <div><label className="mb-2 block text-sm font-bold text-white">Lieu du rendez-vous</label><div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lieu" value="bureau" checked={rdvData.lieu === 'bureau'} onChange={(e) => setRdvData({ ...rdvData, lieu: e.target.value })} className="accent-[#FF6B00]" /><span className="text-sm text-white">Dans nos bureaux</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="lieu" value="terrain" checked={rdvData.lieu === 'terrain'} onChange={(e) => setRdvData({ ...rdvData, lieu: e.target.value })} className="accent-[#FF6B00]" /><span className="text-sm text-white">Sur votre terrain</span></label></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-2 block text-sm font-bold text-white">Date souhaitée</label><input type="date" value={rdvData.date} onChange={(e) => setRdvData({ ...rdvData, date: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
              <div><label className="mb-2 block text-sm font-bold text-white">Heure souhaitée</label><select value={rdvData.heure} onChange={(e) => setRdvData({ ...rdvData, heure: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none"><option value="09:00">09:00</option><option value="10:00">10:00</option><option value="11:00">11:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option><option value="16:00">16:00</option></select></div>
            </div>
            <div><label className="mb-2 block text-sm font-bold text-white">Nom complet</label><input type="text" value={rdvData.nom} onChange={(e) => setRdvData({ ...rdvData, nom: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="mb-2 block text-sm font-bold text-white">Téléphone</label><input type="tel" value={rdvData.telephone} onChange={(e) => setRdvData({ ...rdvData, telephone: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
              <div><label className="mb-2 block text-sm font-bold text-white">Email</label><input type="email" value={rdvData.email} onChange={(e) => setRdvData({ ...rdvData, email: e.target.value })} className="h-[54px] w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
            </div>
            <div><label className="mb-2 block text-sm font-bold text-white">Commentaire</label><textarea value={rdvData.commentaire} onChange={(e) => setRdvData({ ...rdvData, commentaire: e.target.value })} rows={3} className="w-full rounded-[18px] bg-white/20 px-4 text-sm font-bold text-white outline-none" /></div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}