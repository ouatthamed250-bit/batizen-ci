"use client";

import { useEffect, useState } from "react";
import { onValue, query, ref } from "firebase/database";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";

type Actualite = {
  texte: string;
  type: "prix" | "promo" | "alerte" | "actu" | "conseil";
  actif: boolean;
  date?: string;
};

const DEFAULT_ITEMS: Actualite[] = [
  { texte: "🧱 Ciment CPJ 35 : 4500 FCFA/sac", type: "prix", actif: true },
  { texte: "🎉 -20% sur les carrelages ce week-end !", type: "promo", actif: true },
  { texte: "⚠️ Pluie prévue demain - reportez vos travaux extérieurs", type: "alerte", actif: true },
  { texte: "📰 Nouveau dépôt BATIZEN ouvert à Yamoussoukro", type: "actu", actif: true },
  { texte: "💡 Astuce : protégez votre ciment de l'humidité", type: "conseil", actif: true },
];

export function InfoTicker() {
  const initialItems = hasFirebaseConfig() ? DEFAULT_ITEMS : DEFAULT_ITEMS;
  const initialLoading = hasFirebaseConfig();

  const [items, setItems] = useState<Actualite[]>(initialItems);
  const [loading, setLoading] = useState(initialLoading);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return;
    }

    let unsub: (() => void) | undefined;

    try {
      const { database } = getFirebaseServices();
      const actualitesRef = query(ref(database, "actualites"));

      unsub = onValue(actualitesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: Actualite[] = (Object.values(data) as Actualite[]).filter(
            (a) => a && a.actif !== false && a.texte
          );
          setItems(list.length > 0 ? list : DEFAULT_ITEMS);
        } else {
          setItems(DEFAULT_ITEMS);
        }
        setLoading(false);
      });
    } catch {
      // ignored
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const loopItems = [...items, ...items];

  return (
    <div
      className="ticker-banner group"
      role="marquee"
      aria-label="Informations BÂTIZEN"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#FF6B00] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#FF8C00] to-transparent" />
      <div className="ticker-track flex items-center gap-10 px-4">
        {loopItems.map((item, index) => (
          <span
            key={`${item.texte}-${index}`}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap text-[14px] font-bold text-white"
          >
            <span className="size-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            {item.texte}
          </span>
        ))}
      </div>
    </div>
  );
}