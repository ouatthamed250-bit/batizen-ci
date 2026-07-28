"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getFirebaseServices } from "@/lib/firebase";
import { ref, onValue, push, set, get } from "firebase/database";

export default function AdminNouveauChantierPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [clients, setClients] = useState<{ id: string; displayName?: string; nom?: string; email?: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState("construction");
  const [surface, setSurface] = useState(100);
  const [ville, setVille] = useState("");
  const [budget, setBudget] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { database } = getFirebaseServices();
    const usersRef = ref(database, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const list = Object.entries(data)
        .filter(([_, u]: [string, any]) => (u.role || u.userRole) === "client")
        .map(([id, u]: [string, any]) => ({ id, ...u }));
      setClients(list);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !nom || !user?.uid) return;
    setSubmitting(true);
    try {
      const { database } = getFirebaseServices();
      const chantiersRef = ref(database, 'chantiers');
      const newRef = push(chantiersRef);
      const id = newRef.key!;
      await set(newRef, {
        id,
        userId: selectedClientId,
        client_id: selectedClientId,
        adminId: user.uid,
        nom_projet: nom,
        type,
        surface,
        budget,
        description,
        localisation: { ville },
        statut: "en_attente",
        createdAt: Date.now(),
        dateMiseAJour: Date.now(),
      });
      router.push('/admin?section=chantiers');
    } catch (err) {
      console.error("Erreur création chantier:", err);
      alert("Erreur lors de la création du chantier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <button onClick={() => router.push("/admin?section=chantiers")} className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 className="text-2xl font-black">🏗️ Nouveau chantier (Admin)</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[16px] border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">Client *</label>
            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="">Sélectionnez un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.displayName || c.nom || c.email || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">Nom du projet *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Ex: Villa à Cocody" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
              <option value="construction">Construction</option>
              <option value="renovation">Rénovation</option>
              <option value="extension">Extension</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Surface (m²)</label>
              <input type="number" value={surface} onChange={e => setSurface(Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">Budget (FCFA)</label>
              <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">Ville</label>
            <input type="text" value={ville} onChange={e => setVille(e.target.value)} placeholder="Abidjan" className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-white/70">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="w-full h-[56px] rounded-[18px] bg-gradient-to-r from-[#FF7A00] to-[#FF8C00] font-black text-white shadow-lg disabled:opacity-50">
            {submitting ? "Création..." : "🚀 Créer le chantier"}
          </button>
        </form>
      </div>
    </div>
  );
}