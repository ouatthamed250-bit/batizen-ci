"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { getDatabase } from "firebase/database";
import { Megaphone } from "lucide-react";

export type Annonce = {
  id: string;
  titre: string;
  contenu: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
  createdAt: number;
};

/**
 * Bande défilante d'annonces — s'affiche en haut des pages connectées.
 * Lit les annonces actives depuis /annonces dans la Realtime Database.
 */
export default function AnnonceTicker() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const annoncesRef = ref(db, "annonces");

    const unsub = onValue(annoncesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const actives = Object.entries(data)
          .filter(([_, a]: [string, any]) => {
            if (!a.active) return false;
            if (a.dateDebut && new Date(a.dateDebut) > now) return false;
            if (a.dateFin && new Date(a.dateFin) < now) return false;
            return true;
          })
          .map(([id, a]: [string, any]) => ({ id, ...a } as Annonce));
        setAnnonces(actives);
      } else {
        setAnnonces([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || annonces.length === 0) return null;

  const messages = annonces.map((a) => `📢 ${a.titre} : ${a.contenu}`);

  return (
    <div className="w-full overflow-hidden bg-green-500/10 backdrop-blur-md rounded-[24px] border border-green-500/30 py-3 shadow-lg mb-4">
      <style>{`
        .animate-marquee-annonce { animation: marqueeAnnonce 25s linear infinite; }
        @keyframes marqueeAnnonce { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}</style>
      <div className="flex animate-marquee-annonce whitespace-nowrap gap-12 px-3">
        {[...messages, ...messages].map((msg, i) => (
          <span
            key={i}
            className="text-sm font-bold text-green-400 drop-shadow-md flex items-center gap-2"
          >
            <Megaphone size={14} /> {msg}
          </span>
        ))}
      </div>
    </div>
  );
}