"use client";

import { useEffect, useState } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HardHat } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref, onValue } from "firebase/database";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";
import BtpBackground from "@/components/btp/BtpBackground";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

type Chantier = {
  id: string;
  nom?: string;
  nom_projet?: string;
  type?: string;
  localisation?: Localisation;
  statut?: string;
  status?: string;
  progression?: number;
  progress?: number;
  userId?: string;
  date_fin?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatLocalisation(loc?: Localisation): string {
  if (!loc) return "—";
  return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
}

function formatDateCourte(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

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

    const unsubscribe = onValue(chantiersRef, (snapshot) => {
      const data = snapshot.val();
      console.log("═══════════════════════════════════════");
      console.log("🔍 DÉBUT CHARGEMENT MES PROJETS TERMINÉS");
      console.log("👤 User UID:", user?.uid);
      console.log("📦 Données brutes:", data);

      if (data) {
        // NE GARDER QUE LES CHANTIERS TERMINÉS (archive)
        const userChantiers = Object.entries(data as Record<string, any>)
          .filter(([id, chantier]) => {
            console.log("🔎 Vérification chantier:", id, "userId:", chantier.userId, "statut:", chantier.statut);
            return chantier.userId === user?.uid && 
                   (chantier.statut === 'termine' || chantier.statut === 'terminé');
          })
          .map(([id, chantier]) => ({ id, ...(chantier as object) })) as Chantier[];

        console.log("✅ Chantiers terminés filtrés:", userChantiers);
        console.log("📊 Nombre:", userChantiers.length);
        setChantiers(userChantiers);
      } else {
        console.log("⚠️ Aucune donnée dans Firebase");
        setChantiers([]);
      }
      setLoading(false);
      console.log("═══════════════════════════════════════");
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const pageContent = (
    <div className="min-h-screen pt-24 pb-24 px-2">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 mx-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Archive</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
            📁 Mes chantiers terminés
          </h1>
          <p className="mt-2 max-w-xl text-blue-100">
            Retrouvez ici l'ensemble de vos projets achevés et leurs documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-black text-white">
            {chantiers.length} projet{chantiers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mx-2">
          <div className="animate-pulse text-white">Chargement...</div>
        </div>
      ) : chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mx-2">
          <div className="grid size-20 place-items-center rounded-[28px] bg-white/10 text-blue-200">
            <HardHat size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-white">Aucun chantier terminé pour le moment</h2>
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Vos projets terminés apparaîtront ici une fois achevés.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 mx-2">
          {chantiers.map((chantier) => (
            <Link key={chantier.id} href={`/chantier/${chantier.id}`}>
              <div className="rounded-[20px] border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl hover:shadow-xl transition cursor-pointer">
                <h3 className="font-black text-white">{chantier.nom_projet || chantier.nom || 'Chantier'}</h3>
                <p className="text-xs text-blue-200 mt-1">{chantier.type || '—'}</p>
                
                <p className="text-xs text-blue-200 mt-1">{formatLocalisation(chantier.localisation)}</p>
                
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300">
                  Terminé
                </span>
                
                {chantier.date_fin && (
                  <p className="mt-2 text-xs text-blue-200">
                    🏁 Fin : {formatDateCourte(chantier.date_fin)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ChatBot />
    </div>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="medium">
      {pageContent}
    </BtpBackground>
  );
}
