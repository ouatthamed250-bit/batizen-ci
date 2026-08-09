"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { generateContractPDF, generateContractNumber, formatDateContract, type EcheancierRow } from "@/lib/generateContractPDF";
import { saveGeneratedDocument } from "@/lib/saveGeneratedDocument";

const PRESTATIONS = [
  { key: "etude", label: "Étude du projet" },
  { key: "plans", label: "Plans architecturaux" },
  { key: "devis", label: "Devis détaillé" },
  { key: "gros_oeuvre", label: "Gros œuvre" },
  { key: "second_oeuvre", label: "Second œuvre" },
  { key: "finitions", label: "Finitions" },
  { key: "suivi", label: "Suivi de chantier" },
  { key: "livraison", label: "Livraison clé en main" },
  { key: "assistance", label: "Assistance et conseils" },
  { key: "autre", label: "Autre" },
];

export function ContratFormModal({ chantier, chantierId, clientInfo, onClose }: { chantier: any; chantierId: string; clientInfo?: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState(chantier?.description || "");
  const [prestations, setPrestations] = useState<string[]>([]);
  const [prestationAutre, setPrestationAutre] = useState("");
  const [dateDebut, setDateDebut] = useState(chantier?.dateDebut || "");
  const [dateFin, setDateFin] = useState("");
  const [dureeEstimee, setDureeEstimee] = useState(chantier?.delai || "");
  const [acomptePourcent, setAcomptePourcent] = useState(30);
  const [echeancier, setEcheancier] = useState<EcheancierRow[]>([
    { description: "", date: "", montant: 0 },
    { description: "", date: "", montant: 0 },
    { description: "", date: "", montant: 0 },
    { description: "", date: "", montant: 0 },
  ]);
  const [notes, setNotes] = useState("");

  const togglePrestation = (key: string) => {
    setPrestations((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const updateEcheancier = (i: number, field: keyof EcheancierRow, value: string) => {
    setEcheancier((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: field === "montant" ? Number(value) || 0 : value } : row)));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const blob = await generateContractPDF({
        contractNumber: generateContractNumber(),
        contractDate: formatDateContract(),
        clientName: clientInfo?.displayName || clientInfo?.email || "Client",
        clientPhone: clientInfo?.telephone || clientInfo?.phone || chantier?.rendezVous?.telephone,
        clientEmail: clientInfo?.email,
        clientAdresse: chantier?.localisation?.adresse,
        clientVille: chantier?.localisation?.ville,
        chantierLieu: chantier?.localisation?.commune,
        chantierType: chantier?.type,
        surfaceEstimee: chantier?.surface,
        descriptionTravaux: description,
        prestations,
        prestationAutre,
        dateDebut,
        dateFin,
        dureeEstimee,
        montantTotal: chantier?.budget || 0,
        acomptePourcent,
        echeancier: echeancier.filter((r) => r.description || r.montant),
        notes,
      });

      const nom = `Contrat_${(chantier?.nom_projet || "chantier").replace(/\s+/g, "_")}.pdf`;
      await saveGeneratedDocument(blob, { chantierId, nom, type: "contrat" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      a.click();
      URL.revokeObjectURL(url);

      alert("✅ Contrat généré et envoyé au client !");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du contrat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-[#0D2B6B] p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">📝 Générer un contrat</h3>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold">Description des travaux</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold">Prestations incluses</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESTATIONS.map((p) => (
                <button key={p.key} type="button" onClick={() => togglePrestation(p.key)} className={`rounded-[8px] px-2 py-1.5 text-left text-xs font-bold ${prestations.includes(p.key) ? "bg-[#FF7A00] text-white" : "bg-white/5 text-white/60"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {prestations.includes("autre") && (
              <input value={prestationAutre} onChange={(e) => setPrestationAutre(e.target.value)} placeholder="Préciser..." className="mt-2 w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-bold">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Date de fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Durée estimée</label>
            <input value={dureeEstimee} onChange={(e) => setDureeEstimee(e.target.value)} placeholder="Ex: 6 mois" className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Acompte (%)</label>
            <input type="number" min={0} max={100} value={acomptePourcent} onChange={(e) => setAcomptePourcent(Number(e.target.value) || 0)} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold">Échéancier de paiement</label>
            {echeancier.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                <input value={row.description} onChange={(e) => updateEcheancier(i, "description", e.target.value)} placeholder={`Tranche ${i + 1}`} className="rounded-[8px] bg-white/5 p-1.5 text-xs outline-none ring-1 ring-white/10" />
                <input type="date" value={row.date} onChange={(e) => updateEcheancier(i, "date", e.target.value)} className="rounded-[8px] bg-white/5 p-1.5 text-xs outline-none ring-1 ring-white/10" />
                <input type="number" value={row.montant || ""} onChange={(e) => updateEcheancier(i, "montant", e.target.value)} placeholder="FCFA" className="rounded-[8px] bg-white/5 p-1.5 text-xs outline-none ring-1 ring-white/10" />
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Notes et clauses particulières</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full rounded-[12px] bg-[#FF7A00] py-3 text-sm font-black disabled:opacity-50">
            {loading ? "Génération..." : "📤 Générer et envoyer au client"}
          </button>
        </div>
      </div>
    </div>
  );
}