"use client";

import { useState, useCallback, useRef } from "react";
import type { Service } from "@/data/services";

interface RendezVousModalProps {
  service: Service | null;
  onClose: () => void;
}

interface FormData {
  nom: string;
  telephone: string;
  email: string;
  typeRenovation: string;
  adresse: string;
  date: string;
  heure: string;
  description: string;
  photos: File[];
}

interface Calculs {
  distance: number | null;
  frais: number;
}

const TYPES_RENOVATION = [
  "Rénovation complète",
  "Rénovation partielle",
  "Extension de maison",
  "Aménagement intérieur",
  "Ravalement de façade",
  "Installation électrique",
  "Plomberie",
  "Peinture et décoration",
  "Autre",
];

// Villes ivoiriennes avec distance estimée depuis Abidjan (km)
const VILLES_DISTANCES: Record<string, number> = {
  "abidjan": 0,
  "cocody": 5,
  "plateau": 3,
  "yopougon": 15,
  "marcory": 8,
  "treichville": 6,
  "koumassi": 12,
  "port-bouët": 18,
  "bingerville": 20,
  "grand-bassam": 40,
  "anyama": 25,
  "songon": 30,
  "assini": 60,
  "jacqueville": 70,
  "dabou": 50,
  "grand-lahou": 120,
  "san-pédro": 350,
  "bouaké": 350,
  "yamassoukro": 240,
  "korhogo": 580,
  "daloa": 320,
  "man": 500,
  "gagnoa": 280,
  "soubré": 400,
  "abengourou": 200,
  "bondoukou": 420,
  "odienné": 650,
  "touba": 600,
  "séguéla": 550,
  "bouna": 500,
  "ferkessédougou": 600,
  "boundiali": 620,
  "tengréla": 680,
};

function estimerDistance(adresse: string): { distance: number; ville: string | null } {
  const lower = adresse.toLowerCase().trim();
  if (!lower) return { distance: 0, ville: null };

  // Chercher la ville la plus proche dans l'adresse
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

  // Si aucune ville trouvée, estimer par la longueur de l'adresse (fallback)
  if (!bestVille) {
    // Fallback: plus l'adresse est longue, plus c'est loin
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

export default function RendezVousModal({ service, onClose }: RendezVousModalProps) {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    telephone: "",
    email: "",
    typeRenovation: service?.nom || "",
    adresse: "",
    date: "",
    heure: "matin",
    description: "",
    photos: [],
  });
  const [calculs, setCalculs] = useState<Calculs>({ distance: null, frais: 5000 });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (field: keyof FormData, value: string | File[]) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Calcul automatique quand l'adresse change
        if (field === "adresse") {
          const { distance } = estimerDistance(value as string);
          const frais = Math.max(distance * 100, 5000);
          setCalculs({ distance, frais });
        }

        return updated;
      });

      // Effacer l'erreur du champ
      if (errors[field]) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
      }
    },
    [errors]
  );

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...files].slice(0, 5), // max 5 photos
      }));

      // Générer les previews
      const newPreviews: string[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newPreviews.push(ev.target.result as string);
            if (newPreviews.length === files.length) {
              setPhotoPreviews((prev) =>
                [...prev, ...newPreviews].slice(0, 5)
              );
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

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
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est requise";
    if (!formData.date) newErrors.date = "La date est requise";
    if (!formData.description.trim()) newErrors.description = "La description est requise";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setStep("confirmation");
    }
  };

  // Fermeture avec Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  if (!service) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-[8px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[25px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        style={{
          animation: "modalOpen 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {step === "form" ? (
          <>
            {/* En-tête */}
            <div className="sticky top-0 z-10 rounded-t-[25px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Demande de devis</h2>
                  <p className="mt-1 text-sm text-white/80">{service.nom}</p>
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

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Nom */}
              <FieldWrapper label="Nom complet" error={errors.nom} required>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  placeholder="Votre nom et prénom"
                  className="input-field"
                />
              </FieldWrapper>

              {/* Téléphone */}
              <FieldWrapper label="Téléphone" error={errors.telephone} required>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange("telephone", e.target.value)}
                  placeholder="+225 01 02 03 04 05"
                  className="input-field"
                />
              </FieldWrapper>

              {/* Email */}
              <FieldWrapper label="Email" error={errors.email}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="votre@email.com (optionnel)"
                  className="input-field"
                />
              </FieldWrapper>

              {/* Type de rénovation */}
              <FieldWrapper label="Type de rénovation" required>
                <select
                  value={formData.typeRenovation}
                  onChange={(e) => handleChange("typeRenovation", e.target.value)}
                  className="input-field"
                >
                  {TYPES_RENOVATION.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              {/* Adresse */}
              <FieldWrapper label="Adresse du chantier" error={errors.adresse} required>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => handleChange("adresse", e.target.value)}
                  placeholder="Ville, quartier, rue..."
                  className="input-field"
                  list="villes-list-rdv"
                />
                <datalist id="villes-list-rdv">
                  {Object.keys(VILLES_DISTANCES).map((v) => (
                    <option key={v} value={v.charAt(0).toUpperCase() + v.slice(1)} />
                  ))}
                </datalist>
              </FieldWrapper>

              {/* Calculs automatiques */}
              {formData.adresse.trim() && (
                <div className="animate-[fadeIn_0.3s_ease] space-y-2 rounded-[16px] bg-gradient-to-br from-[#FFF7ED] to-[#FFE4CC] p-4">
                  {calculs.distance !== null && (
                    <p className="flex items-center gap-2 text-sm font-bold text-[#FF6B00]">
                      <span>📍</span> Distance estimée : {calculs.distance} km
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-sm font-bold text-[#FF6B00]">
                    <span>🚗</span> Frais de déplacement : {formatFcfa(calculs.frais)}
                  </p>
                  <p className="flex items-center gap-2 text-lg font-black text-[#FF6B00]">
                    <span>💰</span> Total pour la visite : {formatFcfa(calculs.frais)}
                  </p>
                </div>
              )}

              {/* Date */}
              <FieldWrapper label="Date souhaitée" error={errors.date} required>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="input-field"
                />
              </FieldWrapper>

              {/* Heure */}
              <FieldWrapper label="Heure souhaitée" required>
                <select
                  value={formData.heure}
                  onChange={(e) => handleChange("heure", e.target.value)}
                  className="input-field"
                >
                  <option value="matin">Matin (8h - 12h)</option>
                  <option value="apres-midi">Après-midi (14h - 18h)</option>
                </select>
              </FieldWrapper>

              {/* Description */}
              <FieldWrapper label="Description des travaux" error={errors.description} required>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Décrivez les travaux à réaliser..."
                  rows={5}
                  className="input-field resize-none"
                />
              </FieldWrapper>

              {/* Photos */}
              <FieldWrapper label="Photos du lieu (max 5)">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[#FF6B00]/30 bg-[#FFF7ED] px-4 py-4 text-sm font-bold text-[#FF6B00] transition-all hover:border-[#FF6B00]/60 hover:bg-[#FFE4CC]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Ajouter des photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* Previews */}
                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {photoPreviews.map((preview, i) => (
                        <div key={i} className="group relative aspect-square overflow-hidden rounded-[10px]">
                          <img
                            src={preview}
                            alt={`Photo ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FieldWrapper>

              {/* Bouton submit */}
              <button
                type="submit"
                className="w-full rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)] active:scale-[0.98]"
              >
                Confirmer le rendez-vous
              </button>
            </form>
          </>
        ) : (
          /* Écran de confirmation */
          <div className="p-8 text-center">
            <div
              className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
              style={{ animation: "checkmarkPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h2
              className="mt-6 text-2xl font-black text-[#1a1a1a]"
              style={{ animation: "fadeInUp 0.5s ease 0.3s both" }}
            >
              ✅ Rendez-vous confirmé !
            </h2>

            <div
              className="mt-6 space-y-3 rounded-[20px] bg-gradient-to-br from-[#F7F9FC] to-[#EAF2FF] p-6 text-left"
              style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Date</p>
                  <p className="font-bold text-[#1a1a1a]">
                    {new Date(formData.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {formData.heure === "matin" ? "Matin" : "Après-midi"}
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
                <span className="text-xl">🚗</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Distance</p>
                  <p className="font-bold text-[#1a1a1a]">{calculs.distance ?? "—"} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Frais de déplacement</p>
                  <p className="font-bold text-[#FF6B00]">{formatFcfa(calculs.frais)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🔧</span>
                <div>
                  <p className="text-xs font-bold uppercase text-[#6B7280]">Service</p>
                  <p className="font-bold text-[#1a1a1a]">{service.nom}</p>
                </div>
              </div>
            </div>

            <p
              className="mt-4 text-sm font-bold text-[#6B7280]"
              style={{ animation: "fadeInUp 0.5s ease 0.7s both" }}
            >
              📞 Notre équipe vous contactera dans les 24 heures
            </p>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ animation: "fadeInUp 0.5s ease 0.9s both" }}
            >
              Fermer
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes modalOpen {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes checkmarkPop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function FieldWrapper({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
        {required && <span className="ml-1 text-[#FF6B00]">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs font-semibold text-red-500">{error}</p>
      )}
    </div>
  );
}