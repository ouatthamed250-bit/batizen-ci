"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
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
  localisation?: Localisation; // ✅ CORRIGÉ : était "string", maintenant c'est l'objet correct
  statut?: string;
  status?: string;
  progression?: number;
  progress?: number;
  userId?: string; // Ajouté pour que le filtre TypeScript soit heureux
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatLocalisation(loc?: Localisation): string {
  if (!loc) return "—";
  return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
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
      console.log("🔍 DÉBUT CHARGEMENT MES PROJETS");
      console.log("👤 User UID:", user?.uid);
      console.log("📦 Données brutes:", data);

      if (data) {
        const userChantiers = Object.entries(data as Record<string, any>)
          .filter(([id, chantier]) => {
            console.log("🔎 Vérification chantier:", id, "userId:", chantier.userId, "statut:", chantier.statut);
            return chantier.userId === user?.uid && chantier.statut !== 'simulation_brouillon';
          })
          .map(([id, chantier]) => ({ id, ...(chantier as object) })) as Chantier[];

        console.log("✅ Chantiers filtrés:", userChantiers);
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
      <PremiumHeader />

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Mes projets</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            Suivi complet chantier
          </h1>
          <p className="mt-2 max-w-xl text-[#6B7280]">
            Tous vos projets, budgets, images et avancements centralisés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#EAF2FF] px-4 py-2 text-sm font-black text-[#0B5FFF]">
            {chantiers.length} projet{chantiers.length !== 1 ? "s" : ""}
          </span>
          <PremiumButton href="/nouveau-chantier" className="shrink-0">
            + Nouveau
          </PremiumButton>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-pulse">Chargement...</div>
        </div>
      ) : chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid size-20 place-items-center rounded-[28px] bg-[#F7F9FC] text-[#6B7280]">
            <HardHat size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-[#0D2B6B]">Aucun projet pour l'instant</h2>
          <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
            Lancez votre premier projet de construction ou de rénovation.
          </p>
          <PremiumButton href="/nouveau-chantier" className="mt-6 max-w-xs">
            Créer mon premier projet
          </PremiumButton>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {chantiers.map((chantier) => (
            <Link key={chantier.id} href={`/chantier/${chantier.id}`}>
              <div className="rounded-[20px] border border-white/50 bg-white/90 p-5 shadow-lg backdrop-blur-sm hover:shadow-xl transition cursor-pointer">
                <h3 className="font-black text-[var(--navy)]">{chantier.nom_projet || chantier.nom || 'Chantier'}</h3>
                <p className="text-xs text-[var(--muted)] mt-1">{chantier.type || '—'}</p>
                
                {/* ✅ CORRIGÉ : Utilisation du helper au lieu d'afficher l'objet brut */}
                <p className="text-xs text-[var(--muted)] mt-1">{formatLocalisation(chantier.localisation)}</p>
                
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                  chantier.statut === 'en_cours' ? 'bg-green-100 text-green-700' :
                  chantier.statut === 'en_attente' || chantier.statut === 'en_attente_rdv' ? 'bg-orange-100 text-orange-700' :
                  chantier.statut === 'termine' || chantier.statut === 'terminé' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {chantier.statut === 'en_attente_rdv' ? 'En attente RDV' : (chantier.statut || 'en_attente')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ChatBot />
      <BottomNav />
    </ScreenWrapper>
  );
}