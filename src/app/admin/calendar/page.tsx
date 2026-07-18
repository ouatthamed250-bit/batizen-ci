"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, remove } from "firebase/database";

type RDV = {
  id: string;
  client?: string;
  clientId?: string;
  type?: string;
  date?: string;
  lieu?: string;
  statut?: string;
};

export default function AdminCalendarPage() {
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const rdvsRef = ref(db, "rdvs");
    const unsub = onValue(rdvsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rdvList: RDV[] = Object.entries(data).map(([id, r]: [string, any]) => ({ id, ...r }));
      setRdvs(rdvList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce RDV ?")) return;
    const db = getDatabase();
    await remove(ref(db, `rdvs/${id}`));
  };

  // Grouper les RDV par date
  const rdvsParDate = rdvs.reduce((acc, rdv) => {
    const date = rdv.date?.slice(0, 10) || "sans-date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(rdv);
    return acc;
  }, {} as Record<string, RDV[]>);

  const datesTriees = Object.keys(rdvsParDate).sort();

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-black text-[#FF7A00]">📅 Calendrier des RDV</h1>
        
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-[12px] bg-white/5" />
            <div className="h-64 rounded-[16px] bg-white/5" />
          </div>
        ) : (
          <div className="space-y-6">
            {datesTriees.map(date => (
              <div key={date} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                <h2 className="mb-3 font-black text-[#FF7A00]">
                  {new Date(date).toLocaleDateString("fr-FR", { 
                    weekday: "long", 
                    day: "numeric", 
                    month: "long", 
                    year: "numeric" 
                  })}
                </h2>
                <div className="space-y-3">
                  {rdvsParDate[date].map(rdv => (
                    <div key={rdv.id} className="rounded-[12px] border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold">{rdv.client || "Client"}</p>
                          <p className="text-xs text-white/60">{rdv.type || "RDV"}</p>
                          <p className="mt-1 text-xs text-white/50">{rdv.lieu || "Lieu non précisé"}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            rdv.statut === "validé" ? "bg-green-500/20 text-green-400" :
                            rdv.statut === "annulé" ? "bg-red-500/20 text-red-400" :
                            "bg-orange-500/20 text-orange-400"
                          }`}>
                            {rdv.statut || "En attente"}
                          </span>
                          <button 
                            onClick={() => handleDelete(rdv.id)}
                            className="text-xs text-red-400"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {datesTriees.length === 0 && (
              <p className="text-center text-white/50">Aucun RDV planifié.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}