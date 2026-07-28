"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle2, MapPin, Building2, Route, Truck, ChevronRight, HardHat, Home, PaintBucket, Camera, Phone, Mail, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import BtpBackground from "@/components/btp/BtpBackground";
import { formatFcfa } from "@/utils/currency";
import { useAuthContext } from "@/contexts/AuthContext";
import { ref, set, push } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Step = 1 | 2 | 3 | 4 | 5;

const ETAPES = [
  { id: 1, label: "Type & Lieu", icon: MapPin },
  { id: 2, label: "Surface & Structure", icon: Building2 },
  { id: 3, label: "État & Besoins", icon: AlertTriangle },
  { id: 4, label: "Matériaux & Budget", icon: DollarSign },
  { id: 5, label: "Contact & Photos", icon: Camera },
];

export default function RenovationPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [etape, setEtape] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Champs formulaire répartis sur les 5 étapes
  const [lieu, setLieu] = useState("");
  const [typeBien, setTypeBien] = useState("maison");
  const [typeRenovation, setTypeRenovation] = useState("interieur");
  const [ville, setVille] = useState("Abidjan");
  const [quartier, setQuartier] = useState("");

  const [surface, setSurface] = useState(80);
  const [pieces, setPieces] = useState(3);
  const [etages, setEtages] = useState(1);
  const [anneeConstruction, setAnneeConstruction] = useState(2000);
  const [horsAbidjan, setHorsAbidjan] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [transportGere, setTransportGere] = useState(false);

  const [descriptionProblemes, setDescriptionProblemes] = useState("");
  const [urgence, setUrgence] = useState("1_3_mois");
  const [accesLieu, setAccesLieu] = useState("libre");

  const [materiaux, setMateriaux] = useState("standard");
  const [budgetEstime, setBudgetEstime] = useState(500000);
  const [delaiSouhaite, setDelaiSouhaite] = useState("3_mois");

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [preferenceRdv, setPreferenceRdv] = useState("matin");

  const prixVisite = Math.max(10000, (surface || 50) * 200);

  const handleUploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setPhotos(prev => [...prev, url]);
    } catch (err) {
      console.error("Erreur upload photo:", err);
    } finally {
      setUploading(false);
    }
  };

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
        typeBien,
        typeRenovation,
        ville,
        quartier,
        surface,
        pieces,
        etages,
        anneeConstruction,
        horsAbidjan,
        distanceKm: horsAbidjan ? distanceKm : 0,
        transportGere,
        descriptionProblemes,
        urgence,
        accesLieu,
        materiaux,
        budgetEstime,
        delaiSouhaite,
        photos,
        nomComplet,
        telephone,
        email,
        preferenceRdv,
        prixVisite,
        statut: "en_attente",
        createdAt: Date.now(),
      });
      setRequestId(id);
    } catch (err) {
      console.error("Erreur soumission:", err);
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [user, lieu, typeBien, typeRenovation, ville, quartier, surface, pieces, etages, anneeConstruction, horsAbidjan, distanceKm, transportGere, descriptionProblemes, urgence, accesLieu, materiaux, budgetEstime, delaiSouhaite, photos, nomComplet, telephone, email, preferenceRdv, prixVisite, submitting]);

  const canNext = (): boolean => {
    switch (etape) {
      case 1: return lieu.trim().length > 0 && ville.length > 0;
      case 2: return surface >= 20 && pieces >= 1;
      case 3: return descriptionProblemes.trim().length > 0;
      case 4: return budgetEstime >= 50000;
      case 5: return nomComplet.trim().length > 0 && telephone.trim().length >= 8;
      default: return true;
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {ETAPES.map((e, i) => (
          <div key={e.id} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 ${etape === e.id ? "scale-110" : ""}`}>
              <div className={`size-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                etape === e.id ? "bg-[#FF7A00] text-white shadow-lg ring-2 ring-[#FF7A00]/50" :
                etape > e.id ? "bg-green-500 text-white" : "bg-white/20 text-white/50"
              }`}>
                {etape > e.id ? <CheckCircle2 size={16} /> : <e.icon size={16} />}
              </div>
              <span className={`text-[9px] font-bold text-center hidden sm:block ${etape >= e.id ? "text-white" : "text-white/40"}`}>{e.label}</span>
            </div>
            {i < ETAPES.length - 1 && <div className={`h-0.5 w-6 sm:w-10 mx-1 rounded-full ${etape > e.id ? "bg-green-500" : "bg-white/20"}`} />}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/60 text-center mt-2">Étape {etape}/5</p>
    </div>
  );

  const renderEtape = () => {
    switch (etape) {
      case 1: return (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><MapPin size={20} /> Type de rénovation & Localisation</h2>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Type de rénovation</label>
            <select value={typeRenovation} onChange={e => setTypeRenovation(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="interieur">Intérieur (peinture, carrelage, plomberie)</option>
              <option value="facade">Façade / Ravalement</option>
              <option value="toiture">Toiture / Étanchéité</option>
              <option value="extension">Extension / Surélévation</option>
              <option value="electricite">Électricité générale</option>
              <option value="plomberie">Plomberie / Sanitaires</option>
              <option value="complet">Rénovation complète</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Type de bien</label>
            <select value={typeBien} onChange={e => setTypeBien(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="maison">Maison / Villa</option>
              <option value="appartement">Appartement</option>
              <option value="bureau">Bureau / Local professionnel</option>
              <option value="commerce">Commerce / Boutique</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Ville</label>
            <select value={ville} onChange={e => setVille(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="Abidjan">Abidjan</option><option value="Yamoussoukro">Yamoussoukro</option><option value="Bouaké">Bouaké</option>
              <option value="Korhogo">Korhogo</option><option value="San-Pédro">San-Pédro</option><option value="Daloa">Daloa</option><option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Quartier / Commune</label>
            <input type="text" value={quartier} onChange={e => setQuartier(e.target.value)} placeholder="Ex: Cocody, Riviera" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Lieu précis</label>
            <input type="text" value={lieu} onChange={e => setLieu(e.target.value)} placeholder="Ex: Rue 12, Villa 45" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Building2 size={20} /> Surface & Structure</h2>
          <div>
            <div className="flex justify-between text-sm font-bold text-blue-100 mb-2">
              <span>Surface totale (m²)</span><span className="font-black text-white">{surface} m²</span>
            </div>
            <input type="range" min="15" max="1000" step="5" value={surface} onChange={e => setSurface(parseInt(e.target.value))} className="w-full accent-[#FF7A00]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Nombre de pièces concernées</label>
            <select value={pieces} onChange={e => setPieces(Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} pièce{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Nombre d'étages</label>
            <select value={etages} onChange={e => setEtages(parseInt(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value={1}>RDC</option><option value={2}>R+1</option><option value={3}>R+2</option><option value={4}>R+3</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Année de construction</label>
            <select value={anneeConstruction} onChange={e => setAnneeConstruction(Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              {[2025,2024,2023,2022,2021,2020,2015,2010,2005,2000,1990,1980,1970,1960,1950].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="horsAbidjan" checked={horsAbidjan} onChange={e => setHorsAbidjan(e.target.checked)} className="w-5 h-5 rounded accent-[#FF7A00]" />
            <label htmlFor="horsAbidjan" className="text-sm font-bold text-white">Situé hors d'Abidjan</label>
          </div>
          {horsAbidjan && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold text-white/70">Distance depuis Abidjan (km)</label>
                <input type="number" min={1} value={distanceKm || ""} onChange={e => setDistanceKm(parseInt(e.target.value) || 0)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="transportGere" checked={transportGere} onChange={e => setTransportGere(e.target.checked)} className="w-5 h-5 rounded accent-[#FF7A00]" />
                <label htmlFor="transportGere" className="text-sm font-bold text-white"><Truck size={14} className="inline mr-1" /> Je gère mon transport</label>
              </div>
            </>
          )}
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><AlertTriangle size={20} /> État & Besoins</h2>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Description des problèmes / besoins</label>
            <textarea value={descriptionProblemes} onChange={e => setDescriptionProblemes(e.target.value)} rows={4} placeholder="Ex: fissures aux murs, infiltration d'eau, peinture dégradée, électricité vétuste..."
              className="w-full rounded-[18px] bg-white/10 border border-white/20 px-4 py-3 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Urgence</label>
            <select value={urgence} onChange={e => setUrgence(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="immediat">🔴 Immédiat (dégâts urgents)</option>
              <option value="1_3_mois">🟡 Sous 1 à 3 mois</option>
              <option value="6_mois">🟢 Sous 6 mois</option>
              <option value="1_an">⚪ Sous 1 an</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Accès au lieu</label>
            <select value={accesLieu} onChange={e => setAccesLieu(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="libre">Libre (propriétaire)</option>
              <option value="rdv">Sur rendez-vous</option>
              <option value="occupe">Occupé par locataire</option>
            </select>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><DollarSign size={20} /> Matériaux & Budget</h2>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Type de matériaux souhaité</label>
            <select value={materiaux} onChange={e => setMateriaux(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="standard">Standard (bon rapport qualité/prix)</option>
              <option value="premium">Premium (haut de gamme)</option>
              <option value="ecologique">Écologique / Bio</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Budget estimatif (FCFA)</label>
            <input type="number" value={budgetEstime} onChange={e => setBudgetEstime(Number(e.target.value))} min={50000} step={50000} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
            <p className="text-xs text-white/60 mt-1">{formatFcfa(budgetEstime)}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Délai souhaité</label>
            <select value={delaiSouhaite} onChange={e => setDelaiSouhaite(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="1_mois">1 mois</option><option value="3_mois">3 mois</option><option value="6_mois">6 mois</option><option value="12_mois">12 mois</option>
            </select>
          </div>
          <div className="rounded-[16px] bg-[#FF7A00]/10 border border-[#FF7A00]/30 p-4 text-center">
            <p className="text-sm font-bold text-[#FF7A00]">💳 Frais de visite technique : {formatFcfa(prixVisite)}</p>
            <p className="text-xs text-white/60 mt-1">Payable à la confirmation de la demande</p>
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Camera size={20} /> Contact & Photos</h2>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Nom complet</label>
            <input type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)} placeholder="Votre nom" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70"><Phone size={14} className="inline" /> Téléphone</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+225 01 02 03 04 05" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70"><Mail size={14} className="inline" /> Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70"><Clock size={14} className="inline" /> Préférence de rendez-vous</label>
            <select value={preferenceRdv} onChange={e => setPreferenceRdv(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="matin">Matin (9h-12h)</option>
              <option value="apres_midi">Après-midi (14h-17h)</option>
              <option value="weekend">Week-end</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-white/70">Photos du lieu (optionnel)</label>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPhoto(f); }} className="hidden" id="photo-upload" />
            <label htmlFor="photo-upload" className="inline-flex items-center gap-2 h-[54px] rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white cursor-pointer hover:bg-white/20 transition">
              <Camera size={18} /> Ajouter une photo
            </label>
            {uploading && <p className="text-xs text-white/60 mt-1">⏳ Upload...</p>}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />)}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="medium">
      <div className="min-h-screen pt-8 pb-24 px-2">
        <div className="mx-auto max-w-2xl space-y-6">

          {!requestId ? (
            <>
              <div className="text-center mb-2">
                <h1 className="text-2xl font-black text-white">🔨 Demande de rénovation</h1>
                <p className="text-sm text-blue-100 mt-1">En 5 étapes, décrivez votre projet</p>
              </div>

              {renderProgressBar()}

              <PremiumCard>
                {renderEtape()}
              </PremiumCard>

              <div className="flex gap-3">
                {etape > 1 && (
                  <button onClick={() => setEtape((etape - 1) as Step)} className="flex-1 h-[56px] rounded-[18px] bg-white/10 border border-white/20 font-bold text-white transition hover:bg-white/20 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> Précédent
                  </button>
                )}
                {etape < 5 ? (
                  <PremiumButton onClick={() => canNext() ? setEtape((etape + 1) as Step) : alert("Veuillez remplir tous les champs obligatoires de cette étape.")} className="flex-1" icon={ArrowRight}>
                    Suivant
                  </PremiumButton>
                ) : (
                  <PremiumButton onClick={() => canNext() ? handleSoumettre() : alert("Veuillez remplir votre nom et téléphone.")} disabled={submitting} className="flex-1" icon={CheckCircle2}>
                    {submitting ? "Envoi..." : "Soumettre ma demande"}
                  </PremiumButton>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="grid size-24 place-items-center rounded-full bg-[#22C55E] text-white shadow-[0_20px_40px_rgba(34,197,94,0.3)] mb-6"><CheckCircle2 size={48} /></div>
              <h1 className="text-2xl font-black text-white">Demande envoyée !</h1>
              <p className="mt-3 max-w-[280px] text-sm text-blue-100">Après étude, vous serez contacté pour confirmation et activation du suivi de votre rénovation.</p>
              <div className="mt-8 w-full space-y-3">
                <PremiumButton onClick={() => router.push("/dashboard")} className="w-full">🏠 Retour au tableau de bord</PremiumButton>
                <PremiumButton onClick={() => router.push(`/renovation-en-cours/${requestId}`)} variant="secondary" className="w-full">👁️ Voir ma demande</PremiumButton>
              </div>
            </div>
          )}

        </div>
      </div>
    </BtpBackground>
  );
}