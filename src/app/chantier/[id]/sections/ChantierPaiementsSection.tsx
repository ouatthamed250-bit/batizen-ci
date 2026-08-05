"use client";

import { useState, useEffect } from "react";
import { ref, push, onValue, query, orderByChild, equalTo } from "firebase/database";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getFirebaseServices } from "@/lib/firebase";
import { useAuthContext } from "@/contexts/AuthContext";
import { GenerateReceiptButton } from "@/components/ui/GenerateReceiptButton";

export function ChantierPaiementsSection({ chantierId, chantier }: { chantierId: string; chantier: any }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(ref(database, 'paiements'), orderByChild('chantierId'), equalTo(chantierId));
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (data) {
        setPaiements(Object.entries(data).filter(([_, p]: [string,any]) => p.actif).map(([id, p]: [string,any]) => ({ id, ...p })).sort((a:any,b:any) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime()));
      } else setPaiements([]);
    });
    return () => unsub();
  }, [chantierId, database]);

  const totalPaye = paiements.filter((p:any) => p.statut === "valide").reduce((sum:number, p:any) => sum + p.montant, 0);
  const budgetTotal = chantier?.budget || 0;
  const resteAPayer = budgetTotal - totalPaye;
  const pctPaye = budgetTotal > 0 ? Math.round((totalPaye / budgetTotal) * 100) : 0;

  const modeLabel = (mode: string) => {
    switch (mode) {
      case "wave": return "Wave";
      case "orange": return "Orange Money";
      case "mtn": return "MTN Mobile Money";
      default: return "Autre";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.montant <= 0) { alert("Montant invalide"); return; }
    try {
      await push(ref(database, 'paiements'), { chantierId, clientId: user?.uid, montant: form.montant, datePaiement: new Date().toISOString().split('T')[0], mode: form.mode, statut: "en_attente", reference: form.reference, preuveUrl: form.preuveUrl, description: form.description, creePar: user?.uid, creeParRole: "client", dateCreation: Date.now(), actif: true });
      alert("✅ Paiement envoyé !"); setShowForm(false); setForm({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
    } catch { alert("Erreur"); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-5 bg-green-500/20 backdrop-blur-xl rounded-[28px] border border-green-400/30 shadow-xl"><p className="text-xs text-green-700 mb-1">Payé</p><p className="text-2xl font-black text-green-700">{totalPaye.toLocaleString('fr-FR')} F</p><p className="text-xs text-green-600">{pctPaye}%</p></div>
        <div className="p-5 bg-orange-500/20 backdrop-blur-xl rounded-[28px] border border-orange-400/30 shadow-xl"><p className="text-xs text-orange-700 mb-1">Reste</p><p className="text-2xl font-black text-orange-700">{resteAPayer.toLocaleString('fr-FR')} F</p></div>
        <div className="p-5 bg-blue-500/20 backdrop-blur-xl rounded-[28px] border border-blue-400/30 shadow-xl"><p className="text-xs text-blue-700 mb-1">Paiements</p><p className="text-2xl font-black text-blue-700">{paiements.length}</p></div>
      </div>
      <button onClick={() => setShowForm(!showForm)} className="w-full px-4 py-3 bg-[#0B5FFF] text-white rounded-xl font-bold">{showForm ? "✖️ Annuler" : "💳 Déclarer un paiement"}</button>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <input type="number" value={form.montant} onChange={(e) => setForm({...form, montant: parseInt(e.target.value)||0})} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Montant FCFA" required />
          <select value={form.mode} onChange={(e) => setForm({...form, mode: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm"><option value="wave">Wave</option><option value="orange">Orange</option><option value="mtn">MTN</option><option value="autre">Autre</option></select>
          <input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Réf transaction" required />
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setUploading(true); const url = await uploadToCloudinary(f); setForm({...form, preuveUrl: url}); } catch { alert("Erreur upload"); } finally { setUploading(false); } } }} className="w-full px-3 py-2" />
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Description" />
          <button type="submit" disabled={uploading} className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold">{uploading ? "Upload..." : "✅ Envoyer"}</button>
        </form>
      )}

      {paiements.map((p:any) => (
        <div key={p.id} className={`p-4 rounded-xl border ${p.statut === "valide" ? "bg-green-50 border-green-200" : p.statut === "rejete" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
          <div className="flex justify-between"><span className="text-2xl font-black">{p.montant?.toLocaleString('fr-FR')} F</span><span className={`text-xs px-3 py-1 rounded-full font-bold ${p.statut === "valide" ? "bg-green-100 text-green-700" : p.statut === "rejete" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{p.statut === "valide" ? "✅ Validé" : p.statut === "rejete" ? "❌ Rejeté" : "⏳ En attente"}</span></div>
          {p.statut === "valide" && (
            <div className="mt-3">
              <GenerateReceiptButton
                clientName={user?.displayName || user?.email || "Client"}
                projectName={chantier?.nom_projet || chantier?.nom}
                items={[{ description: p.description || "Paiement chantier", quantity: 1, unitPrice: p.montant, total: p.montant }]}
                totalAmount={p.montant}
                paymentMethod={modeLabel(p.mode)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}