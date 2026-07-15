"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Clock, HardHat, AlertTriangle, ChevronRight, Share2 } from "lucide-react";

// Types
type JalonStatus = "done" | "active" | "pending";

type Jalon = {
  id: string;
  phase: string;
  description: string;
  progress: number;
  status: JalonStatus;
  budgetPhase: number;
  depense: number;
  dateDebut: string;
  dateFin: string;
};

const JALONS: Jalon[] = [
  { id: "j1", phase: "Terrassement & Fondations", description: "Fouilles, semelles, longrines, dalle de propreté", progress: 100, status: "done",   budgetPhase: 8_500_000,  depense: 8_200_000,  dateDebut: "15/02/2026", dateFin: "10/03/2026" },
  { id: "j2", phase: "Gros Œuvre",                description: "Poteaux, poutres, murs, dalle de toiture",       progress: 64,  status: "active", budgetPhase: 28_000_000, depense: 17_920_000, dateDebut: "11/03/2026", dateFin: "20/05/2026" },
  { id: "j3", phase: "Second Œuvre",              description: "Toiture, menuiserie, plomberie, électricité",     progress: 0,   status: "pending", budgetPhase: 22_000_000, depense: 0,          dateDebut: "21/05/2026", dateFin: "10/07/2026" },
  { id: "j4", phase: "Finitions",                 description: "Carrelage, peinture, sanitaires, appareillage",   progress: 0,   status: "pending", budgetPhase: 16_000_000, depense: 0,          dateDebut: "11/07/2026", dateFin: "10/08/2026" },
  { id: "j5", phase: "Livraison",                 description: "Contrôle qualité, levée de réserves, remise clés",progress: 0,   status: "pending", budgetPhase: 4_000_000,  depense: 0,          dateDebut: "11/08/2026", dateFin: "18/08/2026" },
];

const ALERTES = [
  { type: "warning", msg: "Prix du ciment en hausse de 8% ce mois — prévoir réajustement budget." },
  { type: "info",    msg: "Prochaine validation client requise : dalle R+1 prévue le 28/03/2026." },
];

const PHOTOS = [
  { id: 1, label: "Fondations terminées", date: "10/03/2026", src: "/assets/images/project-villa-abidjan.jpg" },
  { id: 2, label: "Poteaux RDC",          date: "22/03/2026", src: "/assets/images/project-duplex-yamoussoukro.jpg" },
];

function formatFcfa(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant);
}

export default function ChantierEnCoursPage() {
  const [activeJalon, setActiveJalon] = useState<string | null>("j2");

  const totalBudget  = JALONS.reduce((s, j) => s + j.budgetPhase, 0);
  const totalDepense = JALONS.reduce((s, j) => s + j.depense, 0);
  const globalProgress = Math.round(JALONS.reduce((s, j) => s + j.progress, 0) / JALONS.length);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* En-tête projet */}
        <div className="rounded-[25px] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-t-[6px] border-t-[#FF6B00]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF6B00]">CHANTIER ACTIF</p>
              <h1 className="mt-1 text-2xl font-black text-[#1a1a1a]">Villa Riviera Signature</h1>
              <p className="text-sm text-[#6B7280]">Cocody, Abidjan · Gros Œuvre en cours</p>
            </div>
            <button aria-label="Partager" className="grid size-11 place-items-center rounded-full bg-[#FFF7ED] text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-white">
              <Share2 size={18} />
            </button>
          </div>

          {/* Barre de progression */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#6B7280]">Avancement global</span>
              <span className="text-xs font-black text-[#FF6B00]">{globalProgress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#F7F9FC]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] transition-all duration-700" style={{ width: `${globalProgress}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E7EBF5] pt-4">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">Budget total</p>
              <p className="mt-1 font-black text-[#1a1a1a]">{formatFcfa(totalBudget)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">Dépensé</p>
              <p className="mt-1 font-black text-[#FF6B00]">{formatFcfa(totalDepense)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">Restant</p>
              <p className="mt-1 font-black text-[#22C55E]">{formatFcfa(totalBudget - totalDepense)}</p>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {ALERTES.map((a, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-[18px] p-4 text-sm font-semibold ${
            a.type === "warning" ? "bg-[#FFF7ED] border border-[#FFD6AE] text-[#FF6B00]" : "bg-[#FFF7ED] border border-[#FF6B00]/20 text-[#FF6B00]"
          }`}>
            <span className="mt-0.5 shrink-0">{a.type === "warning" ? "⚠️" : "ℹ️"}</span>
            <span>{a.msg}</span>
          </div>
        ))}

        {/* Jalons */}
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#6B7280]">Phases du chantier</p>
          <div className="space-y-3">
            {JALONS.map((j) => {
              const isActive = activeJalon === j.id;
              return (
                <button key={j.id} onClick={() => setActiveJalon(isActive ? null : j.id)}
                  className={`w-full rounded-[20px] border p-4 text-left transition-all ${
                    j.status === "active" ? "border-[#FF6B00] bg-white shadow-[0_8px_24px_rgba(255,107,0,0.1)]" :
                    j.status === "done" ? "border-[#22C55E]/30 bg-[#F0FFF4]" : "border-[#E7EBF5] bg-white"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid size-10 shrink-0 place-items-center rounded-[14px] ${
                      j.status === "done" ? "bg-[#22C55E] text-white" :
                      j.status === "active" ? "bg-[#FF6B00] text-white" : "bg-[#F7F9FC] text-[#6B7280]"
                    }`}>
                      {j.status === "done" ? <CheckCircle2 size={20} /> : j.status === "active" ? <HardHat size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-[#1a1a1a]">{j.phase}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          j.status === "done" ? "bg-[#F0FFF4] text-[#22C55E]" :
                          j.status === "active" ? "bg-[#FFF7ED] text-[#FF6B00]" : "bg-[#F7F9FC] text-[#6B7280]"
                        }`}>
                          {j.status === "done" ? "Terminé" : j.status === "active" ? "En cours" : "À venir"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#6B7280]">{j.dateDebut} → {j.dateFin}</p>
                      {j.status !== "pending" && (
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F7F9FC]">
                          <div className={`h-full rounded-full ${j.status === "done" ? "bg-[#22C55E]" : "bg-[#FF6B00]"} transition-all`} style={{ width: `${j.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className={`shrink-0 text-[#6B7280] transition-transform ${isActive && "rotate-90"}`} />
                  </div>

                  {isActive && (
                    <div className="mt-4 space-y-3 border-t border-[#E7EBF5] pt-4">
                      <p className="text-sm text-[#6B7280]">{j.description}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[14px] bg-[#F7F9FC] p-3">
                          <p className="text-[10px] font-black uppercase text-[#6B7280]">Budget phase</p>
                          <p className="mt-1 font-black text-[#1a1a1a]">{formatFcfa(j.budgetPhase)}</p>
                        </div>
                        <div className="rounded-[14px] bg-[#F7F9FC] p-3">
                          <p className="text-[10px] font-black uppercase text-[#6B7280]">Dépensé</p>
                          <p className="mt-1 font-black text-[#FF6B00]">{formatFcfa(j.depense)}</p>
                        </div>
                      </div>
                      {j.status === "active" && (
                        <button className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] py-3 text-sm font-black text-white shadow-[0_4px_15px_rgba(255,107,0,0.3)] transition active:scale-95">
                          <CheckCircle2 size={16} /> Valider cette phase
                        </button>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos chantier */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6B7280]">Photos chantier</p>
            <button className="flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-3 py-1.5 text-xs font-black text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-white">
              <Camera size={12} /> Ajouter
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PHOTOS.map(p => (
              <div key={p.id} className="overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-white">
                <div className="relative h-32 bg-[#F7F9FC]">
                  <img src={p.src} alt={p.label} className="size-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-black text-[#1a1a1a]">{p.label}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.date}</p>
                </div>
              </div>
            ))}
            <button className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#E7EBF5] bg-[#F7F9FC] transition hover:border-[#FF6B00]/30">
              <Camera size={24} className="text-[#6B7280]" />
              <p className="text-xs font-bold text-[#6B7280]">Nouvelle photo</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}