"use client";

import { useState, useEffect, type FormEvent } from "react";
import { ref, onValue, push, set, update } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { Megaphone, Plus, Trash2 } from "lucide-react";

type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
  createdAt: number;
  supprime?: boolean;
};

export default function AdminAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    titre: "",
    contenu: "",
    dateDebut: "",
    dateFin: "",
    active: true,
  });

  useEffect(() => {
    const { db } = getFirebaseServices();
    const annoncesRef = ref(db, "annonces");

    const unsub = onValue(annoncesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, a]: [string, any]) => ({ id, ...a } as Annonce))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAnnonces(list);
      } else {
        setAnnonces([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.titre || !form.contenu) return;

    try {
      const { db } = getFirebaseServices();
      const newRef = push(ref(db, "annonces"));
      await set(newRef, {
        titre: form.titre,
        contenu: form.contenu,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        active: form.active,
        createdAt: Date.now(),
      });
      setForm({ titre: "", contenu: "", dateDebut: "", dateFin: "", active: true });
      setMessage({ type: "success", text: "✅ Annonce ajoutée !" });
    } catch (err: any) {
      setMessage({ type: "error", text: `Erreur : ${err.message}` });
    }
  }

  async function handleToggle(annonce: Annonce) {
    try {
      const { db } = getFirebaseServices();
      await update(ref(db, `annonces/${annonce.id}`), { active: !annonce.active });
    } catch (err: any) {
      setMessage({ type: "error", text: `Erreur : ${err.message}` });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      const { db } = getFirebaseServices();
      await update(ref(db, `annonces/${id}`), { active: false, supprime: true });
      setMessage({ type: "success", text: "🗑️ Annonce supprimée" });
    } catch (err: any) {
      setMessage({ type: "error", text: `Erreur : ${err.message}` });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-[#FF7A00] flex items-center gap-2">
        <Megaphone size={22} /> Annonces
      </h1>

      {message && (
        <div
          className={`rounded-[12px] p-4 ${
            message.type === "success"
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[16px] border border-white/10 bg-white/5 p-4"
      >
        <h3 className="mb-3 font-black text-[#FF7A00] flex items-center gap-2">
          <Plus size={18} /> Ajouter une annonce
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Titre"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            className="h-10 rounded-[10px] bg-white/5 px-3 text-sm text-white outline-none"
            required
          />
          <input
            type="text"
            placeholder="Contenu"
            value={form.contenu}
            onChange={(e) => setForm({ ...form, contenu: e.target.value })}
            className="h-10 rounded-[10px] bg-white/5 px-3 text-sm text-white outline-none"
            required
          />
          <input
            type="date"
            value={form.dateDebut}
            onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
            className="h-10 rounded-[10px] bg-white/5 px-3 text-sm text-white outline-none"
          />
          <input
            type="date"
            value={form.dateFin}
            onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
            className="h-10 rounded-[10px] bg-white/5 px-3 text-sm text-white outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Active
          </label>
          <button
            type="submit"
            className="h-10 rounded-[10px] bg-[#FF7A00] font-bold text-white hover:bg-[#E66E00] transition sm:col-span-2"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Liste des annonces */}
      {loading ? (
        <div className="animate-pulse rounded-[16px] bg-white/5 h-32" />
      ) : annonces.length === 0 ? (
        <p className="text-sm text-white/60 text-center py-8">
          Aucune annonce pour le moment.
        </p>
      ) : (
        <div className="grid gap-3">
          {annonces
            .filter((a) => !a.supprime)
            .map((annonce) => (
              <div
                key={annonce.id}
                className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">
                    {annonce.titre}
                  </h4>
                  <p className="text-xs text-white/60 truncate">
                    {annonce.contenu}
                  </p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {annonce.dateDebut && `Du ${annonce.dateDebut}`}
                    {annonce.dateFin && ` au ${annonce.dateFin}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(annonce)}
                    className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
                      annonce.active
                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {annonce.active ? "✅ Active" : "⏸️ Inactive"}
                  </button>
                  <button
                    onClick={() => handleDelete(annonce.id)}
                    className="rounded-[10px] bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}