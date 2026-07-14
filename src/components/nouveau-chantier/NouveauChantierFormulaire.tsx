"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { User, Home, MapPin, Calendar, Clock, Camera, Phone, Mail, FileText, ChevronRight, Plus, Trash2, Navigation } from "lucide-react";
import { useNouveauChantierSubmit } from "@/hooks/useRenovationSubmit";

interface FormData {
  nom: string;
  telephone: string;
  email: string;
  typeProjet: string;
  surface: number;
  niveaux: number;
  budget: string;
  delai: string;
  adresse: string;
  photos: File[];
  description: string;
  paiement: "maintenant" | "sur_place";
  cgvAccepted: boolean;
}

const TYPES_PROJET = [
  "Maison individuelle",
  "Immeuble résidentiel",
  "Commerce",
  "Entrepôt",
  "Bureaux",
  "École / Équipement public",
  "Autre",
];

const BUDGETS = [
  { value: "moins5", label: "< 5 M FCFA" },
  { value: "5_10", label: "5 - 10 M FCFA" },
  { value: "10_25", label: "10 - 25 M FCFA" },
  { value: "plus25", label: "> 25 M FCFA" },
];

const DELAIS = [
  "3 mois",
  "6 mois",
  "12 mois",
  "18 mois",
  "24 mois et plus",
];

const MONTANT_VISITE = 100000;

interface NouveauChantierFormulaireProps {
  onClose: () => void;
  onSubmit?: (data: FormData) => void;
}

export default function NouveauChantierFormulaire({ onClose, onSubmit }: NouveauChantierFormulaireProps) {
  const { submit } = useNouveauChantierSubmit();
  const [step, setStep] = useState<"form" | "confirmation">("form");

  const getInitialFormData = (): FormData => {
    const key = "nouveau_chantier_brouillon";
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialFormData, ...parsed };
      }
    } catch {}
    return initialFormData;
  };

  const initialFormData: FormData = {
    nom: "",
    telephone: "",
    email: "",
    typeProjet: "",
    surface: 0,
    niveaux: 1,
    budget: "",
    delai: "",
    adresse: "",
    photos: [],
    description: "",
    paiement: "maintenant",
    cgvAccepted: false,
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = "nouveau_chantier_brouillon";
    const toSave = { ...formData };
    delete (toSave as any).photos;
    try { localStorage.setItem(key, JSON.stringify(toSave)); } catch {}
  }, [formData]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }, [errors]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
          );
          const data = await res.json();
          const addr = data.display_name || "";
          setFormData((prev) => ({ ...prev, adresse: addr }));
        } catch (e) {
          // fallback silencieux
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

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 5),
    }));
    const previews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          previews.push(ev.target.result as string);
          if (previews.length === files.length) {
            setPhotoPreviews((prev) => [...prev, ...previews].slice(0, 5));
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
    if (!formData.typeProjet) newErrors.typeProjet = "Sélectionnez un type de projet";
    if (!formData.surface || formData.surface <= 0) newErrors.surface = "La surface est requise";
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est requise";
    if (!formData.description.trim()) newErrors.description = "La description est requise";
    if (!formData.paiement) newErrors.paiement = "Sélectionnez une option de paiement";
    if (!formData.cgvAccepted) newErrors.cgvAccepted = "Vous devez accepter les CGV";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submit(formData);
      if (onSubmit) await onSubmit(formData);
      setStep("confirmation");
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
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
              ✅ Demande de visite d'étude confirmée !
            </h2>

            <div className="mt-6 space-y-3 rounded-[20px] bg-gradient-to-br from-[#F7F9FC] to-[#EAF2FF] p-6 text-left" style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Montant</p>
                  <p className="font-bold text-[#FF6B00] text-xl">100 000 FCFA</p>
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
                <span className="text-xl">🔧</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Projet</p>
                  <p className="font-bold text-[#1a1a1a]">{formData.typeProjet}</p>
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
                  window.location.href = "/paiement?montant=" + MONTANT_VISITE + "&type=nouveau_chantier";
                }
                onClose();
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
              <h2 className="text-2xl font-black">Demande de visite d'étude technique</h2>
              <p className="mt-1 text-sm text-white/80">Nouveau chantier · Forfait visite & faisabilité</p>
            </div>
            <div className="rounded-[12px] bg-white/20 px-3 py-1 text-sm font-black text-white">100 000 FCFA</div>
          </div>
        </div>

        {/* Texte professionnel */}
        <div className="space-y-2 bg-gradient-to-r from-[#F7F9FC] to-white p-4 text-sm text-[#4B5563]">
          <p>
            📐 Visite d'étude technique & faisabilité terrain
          </p>
          <p>
            Cette visite permet à nos ingénieurs topographes et architectes d'analyser la nature du sol, la topographie, les accès et la conformité urbanistique.
          </p>
          <p>
            ✅ Après validation sur site, un rapport d'étude complet et un devis détaillé vous seront transmis sous 48h par BATIZEN.CI.
          </p>
          <p>💡 Frais déductibles à 100% si le projet est concrétisé avec nos équipes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Informations */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </section>

          {/* Projet */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Type de projet *</label>
              <select value={formData.typeProjet} onChange={(e) => handleChange("typeProjet", e.target.value)} className="input-field">
                <option value="">Sélectionner un type</option>
                {TYPES_PROJET.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.typeProjet && <p className="text-xs font-semibold text-red-500">{errors.typeProjet}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Surface terrain (m²) *</label>
              <input type="number" min="1" value={formData.surface || ""} onChange={(e) => handleChange("surface", parseInt(e.target.value) || 0)} placeholder="Ex: 500" className="input-field" />
              {errors.surface && <p className="text-xs font-semibold text-red-500">{errors.surface}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Niveaux souhaités</label>
              <select value={formData.niveaux} onChange={(e) => handleChange("niveaux", parseInt(e.target.value))} className="input-field">
                <option value="1">1 niveau</option>
                <option value="2">2 niveaux</option>
                <option value="3">3 niveaux et +</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Budget prévisionnel</label>
              <select value={formData.budget} onChange={(e) => handleChange("budget", e.target.value)} className="input-field">
                <option value="">Sélectionner une tranche</option>
                {BUDGETS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Délai souhaité</label>
              <select value={formData.delai} onChange={(e) => handleChange("delai", e.target.value)} className="input-field">
                <option value="">Sélectionner un délai</option>
                {DELAIS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Adresse + GPS */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Adresse / GPS du terrain *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  placeholder="Ville, quartier, repère..."
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="rounded-[12px] bg-[#F7F9FC] px-3 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#E7EBF5]"
                >
                  {gpsLoading ? "…" : <Navigation size={18} />}
                </button>
              </div>
              {errors.adresse && <p className="text-xs font-semibold text-red-500">{errors.adresse}</p>}
            </div>
          </section>

          {/* Photos */}
          <section>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Photos du terrain (max 5)</label>
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

          {/* Description */}
          <section>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Description du projet *</label>
              <textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Décrivez le projet envisagé..." rows={4} className="input-field resize-none" />
              {errors.description && <p className="text-xs font-semibold text-red-500">{errors.description}</p>}
            </div>
          </section>

          {/* Paiement */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <FileText size={20} className="text-[#FF6B00]" />
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">✅ Confirmation immédiate + priorité planning</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">Paiement via Wave. Reçu envoyé par SMS & Email. Expert programmé sous 24-48h.</p>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">🔒 Engagement confirmé par SMS</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">Expert se déplace avec terminal de paiement mobile. Paiement sur place (Wave, espèces, ou carte).</p>
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

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? "Envoi en cours…" : <>Demander la visite d'étude technique (100 000 FCFA) <ChevronRight size={20} /></>}
          </button>
        </form>
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