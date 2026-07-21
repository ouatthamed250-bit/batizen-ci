"use client";

import { useEffect, useState } from "react";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HardHat } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref, onValue } from "firebase/database";
import Link from "next/link";
import ChatBot from "@/components/ChatBot";

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

  return (
    <ScreenWrapper>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 mx-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Archive</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            📁 Mes chantiers terminés
          </h1>
          <p className="mt-2 max-w-xl text-[#6B7280]">
            Retrouvez ici l'ensemble de vos projets achevés et leurs documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#EAF2FF] px-4 py-2 text-sm font-black text-[#0B5FFF]">
            {chantiers.length} projet{chantiers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mx-2">
          <div className="animate-pulse">Chargement...</div>
        </div>
      ) : chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mx-2">
          <div className="grid size-20 place-items-center rounded-[28px] bg-[#F7F9FC] text-[#6B7280]">
            <HardHat size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-[#0D2B6B]">Aucun chantier terminé pour le moment</h2>
          <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
            Vos projets terminés apparaîtront ici une fois achevés.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 mx-2">
          {chantiers.map((chantier) => (
            <Link key={chantier.id} href={`/chantier/${chantier.id}`}>
              <div className="rounded-[20px] border border-white/50 bg-white/90 p-5 shadow-lg backdrop-blur-sm hover:shadow-xl transition cursor-pointer">
                <h3 className="font-black text-[var(--navy)]">{chantier.nom_projet || chantier.nom || 'Chantier'}</h3>
                <p className="text-xs text-[var(--muted)] mt-1">{chantier.type || '—'}</p>
                
                {/* ✅ Utilisation du helper au lieu d'afficher l'objet brut */}
                <p className="text-xs text-[var(--muted)] mt-1">{formatLocalisation(chantier.localisation)}</p>
                
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  Terminé
                </span>
                
                {chantier.date_fin && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    🏁 Fin : {formatDateCourte(chantier.date_fin)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ChatBot />
    </ScreenWrapper>
  );
}