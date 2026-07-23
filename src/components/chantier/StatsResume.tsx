"use client";

import { useEffect, useState } from "react";
import { FileText, CreditCard, MessageCircle, Image, Calendar } from "lucide-react";
import { getFirebaseServices } from '../../lib/firebase';
interface StatsResumeProps {
  chantierId: string;
}

interface Stats {
  rapportsCount: number;
  paiementsValides: number;
  messagesNonLus: number;
  photosCount: number;
  prochaineEtape: string | null;
  prochainRDV: string | null;
  alerteRetard: boolean;
}

/**
 * Composant StatsResume - Affiche les statistiques automatiques d'un chantier
 * - Nombre de rapports créés
 * - Paiements validés
 * - Messages non lus
 * - Photos dans l'album
 * - Prochaine étape
 * - Prochain RDV
 * - Alertes de retard
 */
export default function StatsResume({ chantierId }: StatsResumeProps) {
  const [stats, setStats] = useState<Stats>({
    rapportsCount: 0,
    paiementsValides: 0,
    messagesNonLus: 0,
    photosCount: 0,
    prochaineEtape: null,
    prochainRDV: null,
    alerteRetard: false,
  });

  useEffect(() => {
    const { db: db } = getFirebaseServices();
    
    // Compter les rapports du chantier
    const rapportsRef = dbRef(db, `rapports`);
    const unsubRapports = onValue(rapportsRef, (snapshot) => {
      const data = snapshot.val() as any;
      if (data) {
        const rapports = Object.values(data).filter((r: any) => 
          String(r.chantierId) === String(chantierId)
        );
        const count = rapports.length;
        const rapportsArray = rapports as any[];
        const dernierRapport = rapportsArray.find((r) => r.prochaine_etape);
        
        setStats(prev => ({
          ...prev,
          rapportsCount: count,
          prochaineEtape: dernierRapport?.prochaine_etape || null,
          alerteRetard: rapportsArray.some((r) => r.statut === "retard"),
        }));
      }
    });

    // Compter les paiements validés
    const paiementsRef = dbRef(db, `paiements`);
    const unsubPaiements = onValue(paiementsRef, (snapshot) => {
      const data = snapshot.val() as any;
      if (data) {
        const paiements = Object.values(data).filter((p: any) => 
          String(p.chantierId) === String(chantierId) && p.statut === "valide"
        );
        setStats(prev => ({ ...prev, paiementsValides: paiements.length }));
      }
    });

    // Compter les messages non lus
    const messagesRef = dbRef(db, `messages`);
    const unsubMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() as any;
      if (data) {
        const messages = Object.values(data).filter((m: any) => 
          String(m.chantierId) === String(chantierId) && !m.lu
        );
        setStats(prev => ({ ...prev, messagesNonLus: messages.length }));
      }
    });

    // Compter les photos de l'album
    const mediasRef = dbRef(db, `chantiers/${chantierId}/medias`);
    const unsubMedias = onValue(mediasRef, (snapshot) => {
      const data = snapshot.val() as any;
      if (data) {
        const medias = Object.values(data).filter((m: any) => m.type === "photo");
        setStats(prev => ({ ...prev, photosCount: medias.length }));
      }
    });

    // Récupérer le prochain RDV
    const rdvRef = dbRef(db, `rendezvous`);
    const unsubRdv = onValue(rdvRef, (snapshot) => {
      const data = snapshot.val() as any;
      if (data) {
        const rdvs = Object.values(data)
          .filter((r: any) => 
            String(r.chantierId) === String(chantierId) && 
            r.statut === "confirme" &&
            new Date(r.date) > new Date()
          )
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (rdvs.length > 0) {
          const prochain = rdvs[0] as any;
          setStats(prev => ({ 
            ...prev, 
            prochainRDV: `${prochain.date} à ${prochain.heure || "—"}` 
          }));
        }
      }
    });

    return () => {
      unsubRapports();
      unsubPaiements();
      unsubMessages();
      unsubMedias();
      unsubRdv();
    };
  }, [chantierId]);

  const StatCard = ({ icon: Icon, label, value, color = "blue" }: {
    icon: typeof FileText;
    label: string;
    value: string | number;
    color?: "blue" | "green" | "orange" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      green: "bg-green-50 border-green-200 text-green-600",
      orange: "bg-orange-50 border-orange-200 text-orange-600",
      red: "bg-red-50 border-red-200 text-red-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
    };
    
    return (
      <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} />
          <span className="text-xs font-bold">{label}</span>
        </div>
        <p className="text-lg font-black">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-[#1e3a8a] flex items-center gap-2">
        <Calendar size={20} />
        Statistiques du chantier
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Rapports" value={stats.rapportsCount} color="blue" />
        <StatCard icon={CreditCard} label="Paiements" value={stats.paiementsValides} color="green" />
        <StatCard icon={MessageCircle} label="Msgs" value={stats.messagesNonLus} color={stats.messagesNonLus > 0 ? "orange" : "blue"} />
        <StatCard icon={Image} label="Photos" value={stats.photosCount} color="purple" />
      </div>

      {stats.prochaineEtape && (
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-600 mb-1">Prochaine étape</p>
          <p className="text-sm font-medium text-blue-800">{stats.prochaineEtape}</p>
        </div>
      )}

      {stats.prochainRDV && (
        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs font-bold text-green-600 mb-1">📅 Prochain RDV</p>
          <p className="text-sm font-medium text-green-800">{stats.prochainRDV}</p>
        </div>
      )}

      {stats.alerteRetard && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-xs font-bold text-red-600 flex items-center gap-1">
            ⚠️ Retard signalé sur un rapport
          </p>
        </div>
      )}
    </div>
  );
}