"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFirebaseServices } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { formatFcfa } from "@/utils/currency";
import { ETAPES_RENOVATION, getEtapeIndex } from "@/utils/renovation-helpers";

export default function AdminRenovationsPage() {
  const [demandes, setDemandes] = useState<any[]>([]);

  useEffect(() => {
    const { database } = getFirebaseServices();
    const unsub = onValue(ref(database, "demandesRenovation"), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setDemandes([]); return; }
      const list: any[] = [];
      Object.entries(data).forEach(([uid, demands]: [string, any]) => {
        Object.entries(demands).forEach(([id, d]: [string, any]) => {
          list.push({ ...d, id, uid });
        });
      });
      setDemandes(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/admin" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft size={18} /> Retour
        </Link>
        <h1 className="text-2xl font-black">🔨 Demandes de rénovation</h1>
        {demandes.length === 0 ? (
          <p className="text-white/50">Aucune demande pour l'instant.</p>
        ) : (
          <div className="grid gap-4">
            {demandes.map(d => {
              const etapeIdx = getEtapeIndex(d.statut || "en_attente");
              const etape = ETAPES_RENOVATION[Math.max(0, etapeIdx)];
              return (
                <Link key={d.id} href={`/admin/renovation/${d.uid}/${d.id}`} className="rounded-[16px] border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{d.lieu || "Sans lieu"}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">{etape.icon} {etape.label}</span>
                  </div>
                  <p className="text-sm text-white/60">{d.surface}m² · {d.etages > 1 ? `R+${d.etages - 1}` : "RDC"}</p>
                  {d.montantEstime && <p className="text-sm text-[#FF7A00] font-bold mt-1">{formatFcfa(d.montantEstime)}</p>}
                  <p className="text-xs text-white/40 mt-2">UID: {d.uid?.substring(0, 12)}...</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}