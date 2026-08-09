"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { generateDevisPDF, generateDevisNumber, formatDateDevis, type DevisItem } from "@/lib/generateDevisPDF";
import { saveGeneratedDocument } from "@/lib/saveGeneratedDocument";

export function DevisFormModal({ chantier, chantierId, clientInfo, onClose }: { chantier: any; chantierId: string; clientInfo?: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DevisItem[]>([{ designation: "", quantite: 1, unite: "u", prixUnitaire: 0 }]);
  const [mainOeuvre, setMainOeuvre] = useState(0);
  const [remise, setRemise] = useState(0);

  const addItem = () => {
    if (items.length < 8) setItems((prev) => [...prev, { designation: "", quantite: 1, unite: "u", prixUnitaire: 0 }]);
  };
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof DevisItem, value: string) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: field === "designation" || field === "unite" ? value : Number(value) || 0 } : item));
  };

  const totalMateriel = items.reduce((sum, it) => sum + it.quantite * it.prixUnitaire, 0);
  const sousTotal = totalMateriel + mainOeuvre;
  const totalTTC = sousTotal - remise;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const blob = await generateDevisPDF({
        devisNumber: generateDevisNumber(),
        devisDate: formatDateDevis(),
        clientName: clientInfo?.displayName || clientInfo?.email || "Client",
        clientAdresse: chantier?.localisation?.ville,
        items,
        mainOeuvre,
        remise,
      });

      const nom = `Devis_${(chantier?.nom_projet || "chantier").replace(/\s+/g, "_")}.pdf`;
      await saveGeneratedDocument(blob, { chantierId, nom, type: "devis" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      a.click();
      URL.revokeObjectURL(url);

      alert("✅ Devis généré et envoyé au client !");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du devis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[20px] bg-[#0D2B6B] p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">📋 Générer un devis</h3>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold">Lignes du devis (max 8)</label>
          {items.map((item, i) => (
            <div key={i} className="rounded-[10px] bg-white/5 p-2">
              <div className="mb-1 flex gap-1">
                <input value={item.designation} onChange={(e) => updateItem(i, "designation", e.target.value)} placeholder="Désignation" className="flex-1 rounded-[6px] bg-white/10 p-1.5 text-xs outline-none" />
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="rounded-[6px] bg-red-500/20 px-2 text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                <input type="number" value={item.quantite} onChange={(e) => updateItem(i, "quantite", e.target.value)} placeholder="Qté" className="rounded-[6px] bg-white/10 p-1.5 text-xs outline-none" />
                <input value={item.unite} onChange={(e) => updateItem(i, "unite", e.target.value)} placeholder="Unité" className="rounded-[6px] bg-white/10 p-1.5 text-xs outline-none" />
                <input type="number" value={item.prixUnitaire} onChange={(e) => updateItem(i, "prixUnitaire", e.target.value)} placeholder="Prix U." className="rounded-[6px] bg-white/10 p-1.5 text-xs outline-none" />
              </div>
            </div>
          ))}
          {items.length < 8 && (
            <button onClick={addItem} className="flex w-full items-center justify-center gap-1 rounded-[10px] bg-white/5 py-2 text-xs font-bold">
              <Plus size={14} /> Ajouter une ligne
            </button>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold">Main d'œuvre (FCFA)</label>
            <input type="number" value={mainOeuvre} onChange={(e) => setMainOeuvre(Number(e.target.value) || 0)} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">Remise (FCFA)</label>
            <input type="number" value={remise} onChange={(e) => setRemise(Number(e.target.value) || 0)} className="w-full rounded-[10px] bg-white/5 p-2 text-sm outline-none ring-1 ring-white/10" />
          </div>

          <div className="rounded-[10px] bg-white/5 p-3 text-sm">
            <div className="flex justify-between"><span>Total matériel</span><span>{totalMateriel.toLocaleString("fr-FR")} F</span></div>
            <div className="flex justify-between"><span>Sous-total</span><span>{sousTotal.toLocaleString("fr-FR")} F</span></div>
            <div className="flex justify-between font-black text-[#FF7A00]"><span>Total TTC</span><span>{totalTTC.toLocaleString("fr-FR")} F</span></div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full rounded-[12px] bg-[#FF7A00] py-3 text-sm font-black disabled:opacity-50">
            {loading ? "Génération..." : "📤 Générer et envoyer au client"}
          </button>
        </div>
      </div>
    </div>
  );
}