"use client";
import { useState } from "react";
import { ref, push } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import materiauxData from "@/data/materiaux-btp-300.json";

export default function ImportMateriauxPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  const handleImport = async () => {
    setStatus("loading");
    try {
      const { database } = getFirebaseServices();
      let done = 0;
      for (const item of materiauxData as any[]) {
        await push(ref(database, "materiaux"), {
          nom: item.nom,
          categorie: item.categorie,
          sousCategorie: item.sousCategorie,
          prix_unitaire: item.prixMoyen,
          prixMin: item.prixMin,
          prixMax: item.prixMax,
          unite: item.unite,
          notes: item.notes,
          disponible: true,
        });
        done++;
        setCount(done);
      }
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] p-6 text-white">
      <h1 className="text-xl font-black text-[#FF7A00] mb-4">Import base matériaux (303 items)</h1>
      <p className="text-white/60 mb-4">Import unique — {(materiauxData as any[]).length} matériaux à importer dans Firebase.</p>
      <button
        onClick={handleImport}
        disabled={status === "loading" || status === "done"}
        className="h-12 px-6 rounded-xl bg-[#FF7A00] font-bold disabled:opacity-50"
      >
        {status === "idle" && "Lancer l'import"}
        {status === "loading" && `Import en cours... ${count}/${(materiauxData as any[]).length}`}
        {status === "done" && `✅ Terminé : ${count} matériaux importés`}
        {status === "error" && "❌ Erreur — voir la console"}
      </button>
    </div>
  );
}