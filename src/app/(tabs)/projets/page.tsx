"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { FolderKanban, HardHat } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref, onValue } from "firebase/database";
import Link from "next/link";

type Chantier = {
  id: string;
  nom?: string;
  nom_projet?: string;
  type?: string;
  localisation?: string;
  statut?: string;
  status?: string;
  progression?: number;
  progress?: number;
};

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
      if (data) {
        // Filtrer uniquement les chantiers de cet utilisateur
        const entries = Object.entries(data as Record<string, any>);
        const userChantiers = entries
          .filter(([id, chantier]) => chantier.userId === user.uid)
          .map(([id, chantier]) => ({ id, ...(chantier as object) })) as Chantier[];

        setChantiers(userChantiers);
      } else {
        setChantiers([]);
      }
      setLoading(false);
      console.log("📦 Chantiers récupérés pour user", user?.uid, ":", chantiers);
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
          {chantiers.map((chantier, i) => (
            <Link key={chantier.id} href={`/chantier/${chantier.id}`}>
              <div className="rounded-[20px] border border-white/50 bg-white/90 p-5 shadow-lg backdrop-blur-sm hover:shadow-xl transition cursor-pointer">
                <h3 className="font-black text-[var(--navy)]">{chantier.nom_projet || chantier.nom || 'Chantier'}</h3>
                <p className="text-xs text-[var(--muted)] mt-1">{chantier.type || '—'}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{chantier.localisation || '—'}</p>
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                  chantier.statut === 'en_cours' ? 'bg-green-100 text-green-700' :
                  chantier.statut === 'en_attente' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {chantier.statut || 'en_attente'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </ScreenWrapper>
  );
}
