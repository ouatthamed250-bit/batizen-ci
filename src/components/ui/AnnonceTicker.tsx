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

type Promotion = {
  id: string;
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
};

/**
 * Bande défilante d'annonces — s'affiche en haut des pages connectées.
 * Lit les annonces actives depuis /annonces dans la Realtime Database.
 * La vitesse est réglable (parametres/vitesseAnnonces) depuis l'admin.
 */
export default function AnnonceTicker() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [vitesse, setVitesse] = useState(16);

  useEffect(() => {
    const db = getDatabase();
    const annoncesRef = ref(db, "annonces");

    const unsub = onValue(annoncesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const actives = Object.entries(data)
          .filter(([_, a]: [string, any]) => a.active === true)
          .map(([id, a]: [string, any]) => ({ id, ...a } as Annonce));
        setAnnonces(actives);
      } else {
        setAnnonces([]);
      }
      setLoading(false);
    });
    const vitesseRef = ref(db, "parametres/vitesseAnnonces");
    const unsubVitesse = onValue(vitesseRef, (snapshot) => {
      const v = snapshot.val();
      if (typeof v === "number" && v > 0) setVitesse(v);
    });
    const promotionsRef = ref(db, "promotions");
    const unsubPromotions = onValue(promotionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const actives = Object.entries(data)
          .filter(([_, p]: [string, any]) => p.active === true)
          .map(([id, p]: [string, any]) => ({ id, ...p } as Promotion));
        setPromotions(actives);
      } else {
        setPromotions([]);
      }
    });
    return () => { unsub(); unsubVitesse(); unsubPromotions(); };
  }, []);

  if (loading || (annonces.length === 0 && promotions.length === 0)) return null;

  const messagesAnnonces = annonces.map((a) => `📢 ${a.titre} : ${a.contenu}`);
  const messagesPromotions = promotions.map((p) => `🎁 ${p.titre} : ${p.description}`);
  const messages = [...messagesAnnonces, ...messagesPromotions];

  return (
    <div className="w-full overflow-hidden bg-green-500/10 backdrop-blur-md rounded-[24px] border border-green-500/30 py-3 shadow-lg mb-4">
      <style>{`
        @keyframes marqueeAnnonce { 0% { transform: translateX(0%); } 100% { transform: translateX(-33.333%); } }
      `}</style>
      <div
        className="flex w-max whitespace-nowrap gap-12 px-3"
        style={{ animation: `marqueeAnnonce ${vitesse}s linear infinite` }}
      >
        {[...messages, ...messages, ...messages].map((msg, i) => (
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