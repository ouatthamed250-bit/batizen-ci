"use client";

import { useEffect, useState } from "react";
import { HardHat } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";

// ✅ NOUVEAUX IMPORTS : Types et Utilitaires centralisés
import type { Chantier } from "@/types/chantier";
import { formatDateCourte, formatLocalisation } from "@/utils/formatters";

export default function ProjectsPage() {
  const { user } = useAuthContext();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const chantiersRef = ref(db, 'chantiers');
    
    // ✅ OPTIMISATION MAJEURE : Filtrer côté serveur (Firebase) par userId
    // Au lieu de tout télécharger et filtrer en JS, on ne demande que les chantiers de l'utilisateur.
    const q = query(chantiersRef, orderByChild("userId"), equalTo(user.uid));

    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // On filtre maintenant uniquement sur le statut, car le userId est déjà vérifié par Firebase
        const userChantiers = Object.entries(data as Record<string, any>)
          .filter(([_, chantier]) => chantier.statut === 'termine' || chantier.statut === 'terminé')
          .map(([id, chantier]) => ({ id, ...(chantier as object) })) as Chantier[];

        setChantiers(userChantiers);
      } else {
        setChantiers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("❌ Erreur chargement projets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="pt-2 pb-4">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Archive</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
            📁 Mes chantiers terminés
          </h1>
          <p className="mt-2 max-w-xl text-blue-100">
            Retrouvez ici l'ensemble de vos projets achevés et leurs documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-black text-white backdrop-blur-sm border border-white/20">
            {chantiers.length} projet{chantiers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[28px] bg-white/5 border border-white/10">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0B5FFF] border-t-transparent" />
          <p className="mt-4 text-white font-bold">Chargement de vos projets...</p>
        </div>
      ) : chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[28px] bg-white/10 border border-white/20 backdrop-blur-xl">
          <div className="grid size-20 place-items-center rounded-full bg-white/10 text-blue-200">
            <HardHat size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-white">Aucun chantier terminé pour le moment</h2>
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Vos projets terminés apparaîtront ici une fois achevés.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chantiers.map((chantier) => (
            <Link key={chantier.id} href={`/chantier/${chantier.id}`}>
              <div className="h-full rounded-[24px] border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl hover:bg-white/15 hover:shadow-xl hover:border-white/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-white group-hover:text-[#FF7A00] transition-colors line-clamp-2">
                    {chantier.nom_projet || chantier.nom || 'Chantier'}
                  </h3>
                </div>
                <p className="text-xs text-blue-200 mt-1 font-medium">{chantier.type || 'Type non spécifié'}</p>
                <p className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                  📍 {formatLocalisation(chantier.localisation)}
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    ✅ Terminé
                  </span>
                  {chantier.date_fin && (
                    <span className="text-xs text-blue-200 font-semibold">
                      🏁 {formatDateCourte(chantier.date_fin)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <ChatBot />
      </div>
    </div>
  );
}
