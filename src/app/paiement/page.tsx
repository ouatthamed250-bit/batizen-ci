"use client";

import { useState } from "react";
import Link from "next/link";
import { PHOTOS_CHANTIER } from "@/data/photos-chantier";
import BtpPageBackground from "@/components/btp/BtpPageBackground";

type Props = {
  searchParams: { montant?: string; type?: string };
};

const MOYENS = [
  {
    id: "wave",
    nom: "Wave",
    badge: null,
    disponible: true,
    couleur: "#000",
    icon: "🌊",
  },
  {
    id: "orange",
    nom: "Orange Money",
    badge: "Bientôt disponible",
    disponible: false,
    couleur: "#FF6600",
    icon: "🍊",
  },
  {
    id: "mtn",
    nom: "MTN Mobile Money",
    badge: "Bientôt disponible",
    disponible: false,
    couleur: "#FFD700",
    icon: "💛",
  },
  {
    id: "moov",
    nom: "Moov Money",
    badge: "Bientôt disponible",
    disponible: false,
    couleur: "#3B82F6",
    icon: "🔵",
  },
  {
    id: "carte",
    nom: "Carte bancaire",
    badge: "Bientôt disponible",
    disponible: false,
    couleur: "#6B7280",
    icon: "💳",
  },
];

export default function PaiementPage({ searchParams }: Props) {
  const montant = Number(searchParams.montant || 0);
  const type = searchParams.type || "renovation";
  const [moyen, setMoyen] = useState<string | null>(null);
  const [telephone, setTelephone] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState(!montant ? "Montant de paiement invalide." : "");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const formatMontant = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const validerTelephone = (tel: string) =>
    /^\+225 ?[0-9]{2} ?[0-9]{2} ?[0-9]{2} ?[0-9]{2} ?[0-9]{2}$/.test(tel.replace(/\s/g, ""));

  const handleEnvoyer = async () => {
    setErreur("");
    if (!moyen) return setErreur("Sélectionnez un moyen de paiement.");
    if (moyen === "wave") {
      if (!telephone) return setErreur("Renseignez votre numéro Wave.");
      if (!validerTelephone(telephone)) return setErreur("Format invalide (ex: +225 01 02 03 04 05).");
    } else {
      return setErreur("Ce moyen de paiement n'est pas encore disponible.");
    }

    setEnvoiEnCours(true);
    setTimeout(() => {
      setEnvoye(true);
      setEnvoiEnCours(false);
    }, 1200);
  };

  return (
    <BtpPageBackground imageUrl={PHOTOS_CHANTIER.equipe} overlayClassName="bg-gradient-to-b from-white/90 to-gray-100">
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-[500px]">
          <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-6 text-white">
              <p className="text-sm font-semibold text-white/80">Montant à régler</p>
              <p className="mt-1 text-3xl font-black">{montant ? formatMontant(montant) : "—"}</p>
              <p className="mt-1 text-xs text-white/70">Type : {type === "renovation" ? "Rénovation / visite technique" : "Nouveau chantier"}</p>
            </div>

            <div className="space-y-3 p-6">
              {MOYENS.map((m) => {
                const actif = moyen === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!m.disponible}
                    onClick={() => setMoyen(m.id)}
                    className={`flex w-full items-center justify-between rounded-[16px] border-2 p-4 transition-all ${
                      actif ? "border-[#FF6B00] bg-[#FFF7ED]" : "border-[#E7EBF5] hover:border-[#FF6B00]/40"
                    } ${!m.disponible ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.icon}</span>
                      <div className="text-left">
                        <p className="font-bold text-[#1a1a1a]">{m.nom}</p>
                        {m.badge && <span className="text-[10px] font-bold text-[#6B7280]">{m.badge}</span>}
                      </div>
                    </div>
                    <span className={`grid size-5 place-items-center rounded-full border-2 ${actif ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#E7EBF5]"}`}>
                      {actif && <span className="size-2.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {moyen === "wave" && !envoye && (
              <div className="px-6 pb-6">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Numéro Wave</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+225 01 02 03 04 05"
                  className="input-field mt-2"
                />
              </div>
            )}

            {erreur && <p className="px-6 text-xs font-semibold text-red-500">{erreur}</p>}

            <div className="p-6 pt-0">
              <button
                onClick={handleEnvoyer}
                disabled={envoiEnCours || envoye}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {envoiEnCours ? "Envoi en cours…" : envoye ? "Demande envoyée ✅" : "Envoyer la demande de paiement"}
              </button>
            </div>

            {envoye && (
              <div className="space-y-3 rounded-[16px] bg-[#FFF7ED] p-4">
                <p className="text-sm font-bold text-[#FF6B00]">
                  Une notification Wave a été envoyée au numéro indiqué. Veuillez confirmer le paiement sur votre application Wave.
                </p>
                <p className="text-xs text-[#6B7280]">
                  Montant : {montant ? formatMontant(montant) : "—"} <br />
                  Numéro : {telephone || "—"}
                </p>
                <Link href="/" className="inline-flex w-full items-center justify-center rounded-[12px] bg-[#1a1a1a] px-4 py-3 text-sm font-bold text-white">
                  Retour à l'accueil
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </BtpPageBackground>
  );
}