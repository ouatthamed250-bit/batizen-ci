"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CheckCircle2, AlertCircle, MapPin, Home, Layers, Calendar, Clock, Camera, Phone, Mail, User, FileText, ChevronRight, Navigation, Plus, Trash2 } from "lucide-react";

interface RenovationFormData {
  nom: string;
  telephone: string;
  email: string;
  surface: number;
  etages: number;
  adresse: string;
  latitude?: number;
  longitude?: number;
  distance: number;
  travaux: string[];
  date: string;
  heure: string;
  description: string;
  paiement: "maintenant" | "sur_place";
  photos: File[];
  cgvAccepted: boolean;
}

interface CalculDetails {
  base: number;
  surfaceAdjustment: number;
  etagesAdjustment: number;
  transportAdjustment: number;
  total: number;
}

const TRAVAUX_OPTIONS = [
  { id: "peinture", label: "Peinture", icon: "🎨" },
  { id: "plomberie", label: "Plomberie", icon: "🚿" },
  { id: "electricite", label: "Électricité", icon: "⚡" },
  { id: "carrelage", label: "Carrelage", icon: "🧱" },
  { id: "toiture", label: "Toiture", icon: "🏠" },
  { id: "menuiserie", label: "Menuiserie", icon: "🪟" },
  { id: "climatisation", label: "Climatisation", icon: "❄️" },
  { id: "isolation", label: "Isolation", icon: "🔇" },
  { id: "facade", label: "Façade", icon: "🏢" },
  { id: "autre", label: "Autre", icon: "🔧" },
];

const ETAGES_OPTIONS = [
  { value: 1, label: "1 étage", adjustment: 0 },
  { value: 2, label: "2 étages", adjustment: 20000 },
  { value: 3, label: "3 étages et +", adjustment: 40000 },
];

function getTransportAdjustment(distance: number): number {
  if (distance <= 10) return 5000;
  if (distance <= 30) return 10000;
  if (distance <= 50) return 20000;
  if (distance <= 100) return 35000;
  return 50000;
}

const VILLES_DISTANCES: Record<string, number> = {
  abidjan: 0, cocody: 5, plateau: 3, yopougon: 15, marcory: 8,
  treichville: 6, koumassi: 12, "port-bouët": 18, bingerville: 20,
  "grand-bassam": 40, anyama: 25, songon: 30, assini: 60,
  jacqueville: 70, dabou: 50, "grand-lahou": 120, "san-pédro": 350,
  bouaké: 350, yamassoukro: 240, korhogo: 580, daloa: 320,
  man: 500, gagnoa: 280, soubré: 400, abengourou: 200,
  bondoukou: 420, odienné: 650, touba: 600, séguéla: 550,
  bouna: 500, ferkessédougou: 600, boundiali: 620, tengréla: 680,
};

function estimerDistance(adresse: string): { distance: number; ville: string | null } {
  const lower = adresse.toLowerCase().trim();
  if (!lower) return { distance: 0, ville: null };

  let bestDistance = 0;
  let bestVille: string | null = null;

  for (const [ville, dist] of Object.entries(VILLES_DISTANCES)) {
    if (lower.includes(ville)) {
      if (dist > bestDistance) {
        bestDistance = dist;
        bestVille = ville;
      }
    }
  }

  if (!bestVille) {
    const estimated = Math.min(Math.max(lower.length * 2, 5), 100);
    return { distance: estimated, ville: null };
  }

  return { distance: bestDistance, ville: bestVille };
}

function formatFcfa(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

type Props = {
  onClose?: () => void;
  onSubmit?: (data: RenovationFormData) => void;
};

export default function RenovationCalculator({ onClose, onSubmit }: Props) {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [formData, setFormData] = useState<Omit<RenovationFormData, "distance">>({
    nom: "",
    telephone: "",
    email: "",
    surface: 0,
    etages: 1,
    adresse: "",
    travaux: [],
    date: "",
    heure: "matin",
    description: "",
    paiement: "maintenant",
    photos: [],
    cgvAccepted: false,
  });

  const [calculDetails, setCalculDetails] = useState<CalculDetails>({
    base: 100000,
    surfaceAdjustment: 0,
    etagesAdjustment: 0,
    transportAdjustment: 5000,
    total: 105000,
  });

  const [distance, setDistance] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcule automatiquement les tarifs en temps réel
  useEffect(() => {
    const surface = formData.surface || 0;
    let surfaceAdj = 0;
    if (surface >= 50 && surface < 100) surfaceAdj = 15000;
    else if (surface >= 100 && surface < 200) surfaceAdj = 30000;
    else if (surface >= 200) surfaceAdj = 50000;

    const etageOption = ETAGES_OPTIONS.find((e) => e.value === formData.etages);
    const etagesAdj = etageOption?.adjustment || 0;
    const transportAdj = getTransportAdjustment(distance);

    const total = 100000 + surfaceAdj + etagesAdj + transportAdj;

    setCalculDetails({
      base: 100000,
      surfaceAdjustment: surfaceAdj,
      etagesAdjustment: etagesAdj,
      transportAdjustment: transportAdj,
      total,
    });
  }, [formData.surface, formData.etages, distance]);

  const estimerDepuisAdresse = useCallback((adresse: string) => {
    const { distance: dist } = estimerDistance(adresse);
    setDistance(dist);
  }, []);

  useEffect(() => {
    if (formData.adresse.trim()) {
      estimerDepuisAdresse(formData.adresse);
    } else {
      setDistance(0);
    }
  }, [formData.adresse, estimerDepuisAdresse]);

  // Géolocalisation (si disponible)
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((p) => ({ ...p, latitude, longitude }));

        // Tentative de géocodage via Nominatim pour remplir l'adresse
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
          );
          const data = await res.json();
          const addr = data.display_name || "";
          setFormData((p) => ({ ...p, adresse: addr }));
          // calcul distance depuis Abidjan (approximation)
          setDistance(0);
        } catch (e) {
          // garder les coordonnées
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        alert("Géolocalisation impossible : " + err.message);
      },
      { timeout: 10000 }
    );
  }, []);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const c = { ...prev };
        delete c[field];
        return c;
      });
    }
  }, [errors]);

  const toggleTravaux = useCallback((travauxId: string) => {
    setFormData((prev) => ({
      ...prev,
      travaux: prev.travaux.includes(travauxId)
        ? prev.travaux.filter((t) => t !== travauxId)
        : [...prev.travaux, travauxId],
    }));
  }, []);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 5),
    }));

    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newPreviews.push(ev.target.result as string);
          if (newPreviews.length === files.length) {
            setPhotoPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removePhoto = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.telephone.trim()) newErrors.telephone = "Le téléphone est requis";
    else if (!/^(\+225)?[0-9]{8,10}$/.test(formData.telephone.replace(/\s/g, "")))
      newErrors.telephone = "Format invalide (ex: +225 01 02 03 04 05)";
    if (!formData.surface || formData.surface <= 0) newErrors.surface = "La surface est requise";
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est requise";
    if (!formData.date) newErrors.date = "La date est requise";
    if (formData.travaux.length === 0) newErrors.travaux = "Sélectionnez au moins un type de travaux";
    if (!formData.description.trim()) newErrors.description = "La description est requise";
    if (!formData.paiement) newErrors.paiement = "Sélectionnez une option de paiement";
    if (!formData.cgvAccepted) newErrors.cgvAccepted = "Vous devez accepter les CGV";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveToFirebase = useCallback(async (finalData: RenovationFormData) => {
    if (!onSubmit) return;
    await onSubmit(finalData);
  }, [onSubmit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const finalData: RenovationFormData = {
        ...formData,
        distance,
      };

      await saveToFirebase(finalData);
      setStep("confirmation");
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose?.();
  }, [onClose]);

  if (step === "confirmation") {
    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" onClick={onClose} />
        <div className="relative z-10 max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-[25px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{ animation: "modalOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          <div className="p-8 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white shadow-[0_10px_30px_rgba(34,197,94,0.3)]" style={{ animation: "checkmarkPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-black text-[#1a1a1a]" style={{ animation: "fadeInUp 0.5s ease 0.3s both" }}>
              ✅ Demande de visite confirmée !
            </h2>

            <div className="mt-6 space-y-3 rounded-[20px] bg-gradient-to-br from-[#F7F9FC] to-[#EAF2FF] p-6 text-left" style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Date de visite</p>
                  <p className="font-bold text-[#1a1a1a]">
                    {new Date(formData.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    {" · "}{formData.heure === "matin" ? "Matin (8h-12h)" : "Après-midi (14h-18h)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Lieu</p>
                  <p className="font-bold text-[#1a1a1a]">{formData.adresse}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">📏</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Surface</p>
                  <p className="font-bold text-[#1a1a1a]">{formData.surface} m² · {formData.etages} étage(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Total à régler</p>
                  <p className="font-bold text-[#FF6B00] text-xl">{formatFcfa(calculDetails.total)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Paiement</p>
                  <p className="font-bold text-[#1a1a1a]">
                    {formData.paiement === "maintenant" ? "✅ Payer maintenant (Wave)" : "🔒 Payer lors de la visite"}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm font-bold text-[#6B7280]" style={{ animation: "fadeInUp 0.5s ease 0.7s both" }}>
              📞 Notre équipe vous contactera dans les 24 heures
            </p>

            {formData.paiement === "maintenant" && (
              <div className="mt-4 rounded-[16px] bg-[#FFF7ED] p-4 text-left" style={{ animation: "fadeInUp 0.5s ease 0.8s both" }}>
                <p className="text-sm font-bold text-[#FF6B00]">
                  💡 Vous serez redirigé vers la page de paiement Wave pour finaliser votre réservation.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                if (formData.paiement === "maintenant") {
                  window.location.href = "/paiement?montant=" + calculDetails.total + "&type=renovation";
                }
                onClose?.();
              }}
              className="mt-6 w-full rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ animation: "fadeInUp 0.5s ease 0.9s both" }}
            >
              {formData.paiement === "maintenant" ? "Procéder au paiement" : "Fermer"}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes modalOpen {
            from { opacity: 0; transform: scale(0.8) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes checkmarkPop {
            0% { opacity: 0; transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[8px]" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-[25px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]" style={{ animation: "modalOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
        {/* En-tête */}
        <div className="sticky top-0 z-10 rounded-t-[25px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Demande de visite technique</h2>
              <p className="mt-1 text-sm text-white/80">Rénovation · Expertise terrain</p>
            </div>
            <button
              onClick={onClose}
              className="grid size-10 place-items-center rounded-xl bg-white/20 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/30"
              aria-label="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Badges de confiance */}
        <div className="flex flex-wrap gap-2 px-6 pt-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#16A34A]">
            🔒 Paiement sécurisé & traçable
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#16A34A]">
            📄 Devis officiel sous 48h
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#16A34A]">
            ✅ Frais déductibles du montant final
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Informations personnelles */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <User size={20} className="text-[#FF6B00]" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Nom complet *</label>
                <input type="text" value={formData.nom} onChange={(e) => handleChange("nom", e.target.value)} placeholder="Votre nom et prénom" className="input-field" />
                {errors.nom && <p className="text-xs font-semibold text-red-500">{errors.nom}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Téléphone *</label>
                <input type="tel" value={formData.telephone} onChange={(e) => handleChange("telephone", e.target.value)} placeholder="+225 01 02 03 04 05" className="input-field" />
                {errors.telephone && <p className="text-xs font-semibold text-red-500">{errors.telephone}</p>}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Email (optionnel)</label>
                <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="votre@email.com" className="input-field" />
              </div>
            </div>
          </section>

          {/* Détails du projet */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Home size={20} className="text-[#FF6B00]" />
              Détails du projet
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Surface totale (m²) *</label>
                <input type="number" min="1" value={formData.surface || ""} onChange={(e) => handleChange("surface", parseInt(e.target.value) || 0)} placeholder="Ex: 120" className="input-field" />
                {errors.surface && <p className="text-xs font-semibold text-red-500">{errors.surface}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Nombre d'étages *</label>
                <select value={formData.etages} onChange={(e) => handleChange("etages", parseInt(e.target.value))} className="input-field">
                  {ETAGES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Adresse du chantier *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => handleChange("adresse", e.target.value)}
                    placeholder="Ville, quartier, rue..."
                    className="input-field flex-1"
                    list="villes-list"
                  />
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    className="rounded-[12px] bg-[#F7F9FC] px-3 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#E7EBF5]"
                  >
                    {gpsLoading ? "…" : <Navigation size={18} />}
                  </button>
                </div>
                <datalist id="villes-list">
                  {Object.keys(VILLES_DISTANCES).map((v) => (
                    <option key={v} value={v.charAt(0).toUpperCase() + v.slice(1)} />
                  ))}
                </datalist>
                {errors.adresse && <p className="text-xs font-semibold text-red-500">{errors.adresse}</p>}
              </div>
            </div>
          </section>

          {/* Types de travaux */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Types de travaux *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {TRAVAUX_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleTravaux(opt.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-bold transition-all ${
                    formData.travaux.includes(opt.id)
                      ? "bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-md"
                      : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#E7EBF5]"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {errors.travaux && <p className="text-xs font-semibold text-red-500">{errors.travaux}</p>}
          </div>

          {/* Calculateur en temps réel */}
          <section className="rounded-[20px] bg-gradient-to-br from-[#FFF7ED] to-[#FFE4CC] p-5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#FF6B00]">
              <FileText size={20} />
              📊 Détail du tarif d'intervention
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Base fixe (expertise + équipe) :</span>
                <span className="font-bold text-[#1a1a1a]">{formatFcfa(calculDetails.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Ajustement surface ({formData.surface || 0} m²) :</span>
                <span className="font-bold text-[#1a1a1a]">{calculDetails.surfaceAdjustment === 0 ? "0 FCFA" : `+${formatFcfa(calculDetails.surfaceAdjustment)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Ajustement étages ({formData.etages} étage(s)) :</span>
                <span className="font-bold text-[#1a1a1a]">{calculDetails.etagesAdjustment === 0 ? "0 FCFA" : `+${formatFcfa(calculDetails.etagesAdjustment)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Transport ({distance} km) :</span>
                <span className="font-bold text-[#1a1a1a]">{formatFcfa(calculDetails.transportAdjustment)}</span>
              </div>
              <div className="my-3 border-t border-[#FF6B00]/20" />
              <div className="flex justify-between text-lg font-black">
                <span className="text-[#FF6B00]">TOTAL À RÉGLER :</span>
                <span className="text-[#FF6B00]">{formatFcfa(calculDetails.total)}</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-[#6B7280]">
              Ces frais couvrent le déplacement de notre ingénieur, l'analyse technique de votre bien, et les recommandations personnalisées. Montant déductible à 100% du devis final si vous validez nos travaux.
            </p>
          </section>

          {/* Date et heure */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Calendar size={20} className="text-[#FF6B00]" />
              Planification
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Date souhaitée *</label>
                <input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} min={new Date().toISOString().split("T")[0]} className="input-field" />
                {errors.date && <p className="text-xs font-semibold text-red-500">{errors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Heure souhaitée *</label>
                <select value={formData.heure} onChange={(e) => handleChange("heure", e.target.value)} className="input-field">
                  <option value="matin">Matin (8h - 12h)</option>
                  <option value="apres-midi">Après-midi (14h - 18h)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Description des travaux *</label>
              <textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Décrivez les travaux à réaliser..." rows={4} className="input-field resize-none" />
              {errors.description && <p className="text-xs font-semibold text-red-500">{errors.description}</p>}
            </div>
          </section>

          {/* Photos */}
          <section>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Photos du lieu (max 5)</label>
            <div className="mt-2 space-y-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[#FF6B00]/30 bg-[#FFF7ED] px-4 py-4 text-sm font-bold text-[#FF6B00] transition-all hover:border-[#FF6B00]/60 hover:bg-[#FFE4CC]">
                <Plus size={20} />
                Ajouter des photos
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {photoPreviews.map((preview, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-[10px]">
                      <img src={preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Trash2 size={16} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Options de paiement */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Clock size={20} className="text-[#FF6B00]" />
              Option de paiement
            </h3>
            <div className="space-y-3">
              <label className={`flex cursor-pointer items-start gap-4 rounded-[16px] border-2 p-4 transition-all ${formData.paiement === "maintenant" ? "border-[#FF6B00] bg-[#FFF7ED]" : "border-[#E7EBF5] hover:border-[#FF6B00]/50"}`}>
                <input type="radio" name="paiement" value="maintenant" checked={formData.paiement === "maintenant"} onChange={(e) => handleChange("paiement", e.target.value)} className="hidden" />
                <div className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${formData.paiement === "maintenant" ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#E7EBF5]"}`}>
                  {formData.paiement === "maintenant" && <div className="size-3 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1a1a1a]">Payer maintenant (recommandé)</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">
                      ✅ Confirmation immédiate + priorité planning
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">Paiement via Wave. Reçu envoyé par SMS & Email dès validation. Expert programmé sous 24-48h.</p>
                </div>
              </label>

              <label className={`flex cursor-pointer items-start gap-4 rounded-[16px] border-2 p-4 transition-all ${formData.paiement === "sur_place" ? "border-[#FF6B00] bg-[#FFF7ED]" : "border-[#E7EBF5] hover:border-[#FF6B00]/50"}`}>
                <input type="radio" name="paiement" value="sur_place" checked={formData.paiement === "sur_place"} onChange={(e) => handleChange("paiement", e.target.value)} className="hidden" />
                <div className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${formData.paiement === "sur_place" ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#E7EBF5]"}`}>
                  {formData.paiement === "sur_place" && <div className="size-3 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1a1a1a]">Payer lors de la visite</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                      🔒 Engagement confirmé par SMS
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">Expert se déplace avec terminal de paiement mobile. Paiement sur place (Wave, espèces, ou carte). Idéal pour vérifier l'identité de l'expert avant règlement.</p>
                </div>
              </label>
            </div>
            {errors.paiement && <p className="mt-2 text-xs font-semibold text-red-500">{errors.paiement}</p>}
          </section>

          {/* CGV */}
          <section>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={formData.cgvAccepted}
                onChange={(e) => handleChange("cgvAccepted", e.target.checked)}
                className="mt-0.5 size-5 rounded border-2 border-[#E7EBF5] text-[#FF6B00] focus:ring-[#FF6B00]"
              />
              <span className="text-sm text-[#6B7280]">
                J'accepte les <a href="/conditions" className="font-bold text-[#FF6B00] hover:underline">Conditions Générales de Vente</a> et la <a href="/confidentialite" className="font-bold text-[#FF6B00] hover:underline">Politique de Confidentialité</a>.
                <br />
                <span className="text-[10px]">Annulation gratuite jusqu'à 24h avant la visite. Passé ce délai, les frais restent acquis pour couvrir le déplacement et la préparation technique.</span>
              </span>
            </label>
            {errors.cgvAccepted && <p className="text-xs font-semibold text-red-500">{errors.cgvAccepted}</p>}
          </section>

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? "Envoi en cours…" : <>Confirmer la demande de visite <ChevronRight size={20} /></>}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalOpen {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}