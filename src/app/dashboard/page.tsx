"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HardHat, BrickWall, ChevronRight, Calendar, Bell, CreditCard, Wallet, CalendarClock, Calculator } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { ProgressBar } from "@/components/ui/ProgressBar";
import SuperCalculateur from "@/components/btp/SuperCalculateur";
import { getDatabase, ref, onValue } from "firebase/database";
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
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  photo?: string;
  image_url?: string;
  statut?: string;
  status?: string;
  progression?: number;
  progress?: number;
  date_fin?: string;
  date_debut?: string;
  type?: string;
  localisation?: Localisation;
  plan_choisi?: string;
  rdv_date?: string;
  budget?: number;
  apport_personnel?: number;
  date_soumission?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

function formatDateFrancais(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateCourte(dateStr?: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statutLabel(s?: string): string {
  switch (s) {
    case "en_cours": return "En cours";
    case "en cours": return "En cours";
    case "termine": return "Terminé";
    case "terminé": return "Terminé";
    case "en_pause": return "En pause";
    case "en pause": return "En pause";
    case "en_attente": return "En attente";
    case "en_attente_rdv": return "En attente RDV";
    default: return s || "En cours";
  }
}

function formatLocalisation(loc?: Localisation): string {
  if (!loc) return "—";
  return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
}

function formatFcfa(value: number): string {
  if (!value) return "0 F";
  return new Intl.NumberFormat("fr-TG", { style: "currency", currency: "XAF", currencyDisplay: "code" }).format(value).replace("XAF", "F");
}

/* ------------------------------------------------------------------ */
/* Composants                                                         */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon: Icon, label, value, color = "#0B5FFF" }: { 
  icon: typeof HardHat; 
  label: string; 
  value: string | number; 
  color?: string;
}) {
  // Couleurs prédéfinies pour chaque carte
  const getBgStyle = () => {
    switch (color) {
      case "#0B5FFF": return "bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B]";
      case "#FF7A00": return "bg-gradient-to-br from-[#FF7A00] to-[#D97706]";
      case "#22C55E": return "bg-gradient-to-br from-[#22C55E] to-[#16A34A]";
      case "#EC4899": return "bg-gradient-to-br from-[#EC4899] to-[#DB2777]";
      default: return "bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B]";
    }
  };

  return (
    <div className="rounded-[22px] border border-white/50 bg-white/90 backdrop-blur-sm p-4 flex items-center gap-3">
      <div className={`grid size-12 place-items-center rounded-[16px] text-white ${getBgStyle()}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-[var(--navy)]">{value}</p>
      </div>
    </div>
  );
}

const actionItems = [
  { icon: Calculator, label: "Simulation", color: "#FF7A00", href: "/simulation" },
  { icon: BrickWall, label: "Nouveau chantier", color: "#0B5FFF", href: "/nouveau-chantier" },
  { icon: HardHat, label: "Rénovation", color: "#22C55E", href: "/renovation" },
];

function ActionButton({ icon: Icon, label, color, href }: { 
  icon: typeof HardHat; 
  label: string; 
  color: string;
  href: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Link
        href={href}
        className="group flex h-full flex-col items-center gap-2 rounded-[16px] border border-white/50 bg-white/90 p-3 text-center shadow-[0_4px_12px_rgba(16,24,40,0.06)] backdrop-blur-sm transition-all active:scale-95 hover:shadow-[0_6px_16px_rgba(16,24,40,0.08)]"
      >
        <motion.div
          className="grid size-10 place-items-center rounded-[12px] text-white shadow-md"
          style={{ backgroundColor: color }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon size={18} aria-hidden />
        </motion.div>
        <span className="text-[10px] font-black leading-tight text-[var(--navy)] group-hover:text-[var(--primary)] transition-colors">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-white/50 bg-white/90">
      <div className="h-36 w-full bg-[#E7EBF5]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-[#E7EBF5]" />
        <div className="h-3 w-1/2 rounded bg-[#E7EBF5]" />
        <div className="h-9 w-full rounded-[16px] bg-[#E7EBF5]" />
      </div>
    </div>
  );
}

function ChantierCard({ chantier }: { chantier: Chantier; }) {
  const photo = chantier.photo || chantier.image_url;
  const nom = chantier.nom_projet || chantier.nom || "Chantier";
  const pct = Number(chantier.progression ?? chantier.progress ?? 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[22px] border border-white/50 bg-white/90 shadow-[0_8px_24px_rgba(16,24,40,0.06)]"
    >
      <div className="relative h-36 w-full bg-[#E7EBF5]">
        {photo ? <Image src={photo} alt={nom} fill className="object-cover" /> : <div className="grid size-full place-items-center text-[#9CA3AF]"><HardHat size={40} /></div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-[var(--navy)]">{nom}</h3>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#0B5FFF]">{statutLabel(chantier.statut)}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted)]">
          <HardHat size={12} /> {chantier.type || "—"} · {formatLocalisation(chantier.localisation)}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          💰 Budget : <span className="font-bold text-[var(--navy)]">{formatFcfa(chantier.budget || 0)}</span>
        </p>
        
        {/* PROGRESSION pour les chantiers en cours */}
        {chantier.statut === "en_cours" && (
          <div className="mt-3">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
        {/* INFOS PLAN & RDV pour les chantiers en attente */}
        {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && (
          <div className="mt-3 space-y-1">
            {chantier.plan_choisi && (
              <p className="text-xs text-[var(--muted)]">
                🎯 Plan : <span className="font-bold text-[var(--navy)]">{chantier.plan_choisi}</span>
              </p>
            )}
            {chantier.rdv_date && (
              <p className="text-xs text-[var(--muted)]">
                📅 RDV : <span className="font-bold text-[var(--navy)]">{formatDateCourte(chantier.rdv_date)}</span>
              </p>
            )}
          </div>
        )}
        
        {/* DATE FIN pour les chantiers terminés */}
        {(chantier.statut === "termine" || chantier.statut === "terminé") && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            🏁 Terminé le : <span className="font-bold text-[var(--navy)]">{formatDateCourte(chantier.date_fin)}</span>
          </p>
        )}
        
        <div className="mt-4 flex gap-2">
          <Link href={`/chantier/${chantier.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] py-2.5 text-sm font-black text-white transition active:scale-95">
            Voir détails <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardClientPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [mesChantiers, setMesChantiers] = useState<Chantier[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const nomClient = user?.displayName || user?.email?.split("@")[0] || "Client";

  // Calculer les stats depuis les vrais chantiers
  const chantiersActifs = mesChantiers.filter(c => c.statut === "en_cours").length;
  const prochainRdv = mesChantiers
    .filter(c => (c.statut === "en_attente" || c.statut === "en_attente_rdv") && c.rdv_date)
    .sort((a, b) => new Date(a.rdv_date!).getTime() - new Date(b.rdv_date!).getTime())[0];

  useEffect(() => {
    console.log("🟢 [1] useEffect dashboard démarré. user?.uid =", user?.uid);
    
    if (!user?.uid) {
      console.log("🔴 [2] Pas d'utilisateur connecté, arrêt.");
      setLoading(false);
      return;
    }

    console.log("🟢 [3] Initialisation Firebase...");
    try {
      console.log("🟢 [4] Appel de onValue sur 'chantiers'...");
      const db = getDatabase();
      const chantiersRef = ref(db, 'chantiers');
      
      const unsubscribe = onValue(chantiersRef, (snapshot) => {
        console.log("🟢 [5] CALLBACK onValue DÉCLENCÉ !");
        const data = snapshot.val();
        console.log("📦 [6] DONNÉES BRUTES FIREBASE:", data);

        if (data) {
          // Filtrer pour ne garder que les chantiers du client connecté (HORS simulations)
          const liste = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .filter((c: Chantier) => c.userId === user?.uid && c.statut !== 'simulation_brouillon');

          console.log("✅ [8] CHANTIERS LUS DEPUIS FIREBASE:", liste);
          console.log("📊 [9] NOMBRE DE CHANTIERS TROUVÉS:", liste.length);

          setMesChantiers(liste);
        } else {
          console.log("⚠️ [10] Aucune donnée dans le nœud 'chantiers'");
          setMesChantiers([]);
        }
        setLoading(false);
      });

      // Charger les notifications du client
      const notificationsRef = ref(db, `notifications/${user.uid}`);
      const unsubscribeNotif = onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const notifs = Object.values(data).filter((n: any) => n.lu === false);
          setNotifications(notifs);
        } else {
          setNotifications([]);
        }
      });

      const promosRef = ref(db, 'promotions');
      const unsubscribePromos = onValue(promosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const promosActives = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(p => p.active === true);
          console.log("📦 PROMOS CLIENT (temps réel):", promosActives);
        }
      });

      return () => {
        console.log("🧹 [11] Nettoyage du listener onValue");
        unsubscribe();
        unsubscribePromos();
        unsubscribeNotif();
      };
    } catch (error) {
      console.error("💥 [12] ERREUR FATALE DANS LE USEEFFECT :", error);
      setLoading(false);
    }
  }, [user?.uid]);

  // Calculer les dépenses du mois (pour l'instant 0) et notifications non lues
  const depensesMois = 0;
  const notifsNonLues = notifications.length;

  return (
    <div className="relative min-h-screen bg-[var(--bg-dashboard)]">
      {/* Background avec image et overlay */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: 'url(/images/villa-bg.jpg)' }}></div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10"></div>
      
      {/* Contenu principal avec padding pour scroll correct */}
      <main className="relative z-20 flex flex-col gap-3 px-4 pt-4 pb-28">
        {/* 1. HEADER PERSONNALISÉ */}
        <header className="rounded-[22px] border border-white/50 bg-white/90 backdrop-blur-sm">
          <div className="px-4 pt-4 pb-2 sm:px-6">
            <h1 className="text-2xl font-black tracking-[-0.03em] text-[var(--navy)] sm:text-3xl">Bonjour {nomClient}</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">{formatDateFrancais(new Date())}</p>
            <div className="mt-2"><WeatherWidget title="Météo du jour" /></div>
          </div>
        </header>

        {/* 2. 3 BOUTONS D'ACTIONS RAPIDES (grille 3 colonnes) */}
        <section className="grid gap-3 sm:grid-cols-3">
          <ActionButton 
            icon={Calculator} 
            label="Simulation" 
            color="#FF7A00"
            href="/simulation"
          />
          <ActionButton 
            icon={BrickWall} 
            label="Nouveau chantier" 
            color="#0B5FFF"
            href="/nouveau-chantier"
          />
          <ActionButton 
            icon={HardHat} 
            label="Rénovation" 
            color="#22C55E"
            href="/renovation"
          />
        </section>

        {/* 3. SUPER CALCULATEUR (Widget d'estimation rapide) */}
        <section>
          <SuperCalculateur
            surface={100}
            chambres={3}
            sallesDeBain={2}
            etages={1}
            garage={false}
            piscine={false}
            jardin={false}
            standing="moyen"
            style="moderne"
            mode="widget"
          />
        </section>

        {/* 4. SECTION "RÉSUMÉ RAPIDE" - 4 SummaryCards avec couleurs distinctes */}
        {!loading && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard 
              icon={HardHat} 
              label="Chantiers actifs" 
              value={chantiersActifs}
              color="#0B5FFF"
            />
            <SummaryCard 
              icon={Wallet} 
              label="Dépensé ce mois" 
              value={formatFcfa(depensesMois)}
              color="#FF7A00"
            />
            <SummaryCard 
              icon={CalendarClock} 
              label="Prochain RDV" 
              value={prochainRdv ? formatDateCourte(prochainRdv.rdv_date) : "Aucun"}
              color="#22C55E"
            />
            <SummaryCard 
              icon={Bell} 
              label="Notifications" 
              value={notifsNonLues}
              color="#EC4899"
            />
          </section>
        )}

        {/* 5. SECTION "MES CHANTIERS" */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonChantier /><SkeletonChantier />
          </div>
        ) : mesChantiers.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/50 bg-white/90 p-8 text-center backdrop-blur-sm">
            <HardHat size={48} className="mx-auto mb-3 text-[#9CA3AF]" />
            <p className="text-sm font-bold text-[var(--muted)]">Vous n'avez pas encore de chantier. Commencez par une simulation.</p>
            <Link href="/nouveau-chantier" className="mt-3 inline-flex items-center gap-2 rounded-[16px] bg-[var(--primary)] px-6 py-2.5 text-sm font-black text-white">
              <BrickWall size={18} /> Créer un chantier
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)]">Mes chantiers</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {mesChantiers.map((c) => <ChantierCard key={c.id} chantier={c} />)}
            </div>
          </div>
        )}
        
        {/* 6. BLOC "À PROPOS DE BÂTIZEN.CI" */}
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
          <h3 className="text-lg font-bold text-[var(--navy)] mb-3">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
          <p className="text-sm text-gray-700 mb-3">
            BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire. 
            Nous simplifions la construction en vous connectant avec des experts qualifiés, 
            en vous offrant des outils de simulation avancés et en assurant un suivi transparent de vos projets.
          </p>
          <p className="text-sm text-gray-700">
            Notre mission : rendre la construction accessible, transparente et professionnelle pour tous.
          </p>
        </div>

        {/* 7. BLOC "ALERTE ARNAQUE" */}
        <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-lg rounded-2xl border border-red-200">
          <h3 className="text-lg font-bold text-red-700 mb-3">🚨 ALERTE ARNAQUE</h3>
          <p className="text-sm text-gray-800 mb-2 font-semibold">
            ⚠️ BÂTIZEN.CI ne demande JAMAIS :
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-3">
            <li>• Votre code OTP par téléphone</li>
            <li>• Un paiement avant contrat signé</li>
            <li>• Vos mots de passe complets</li>
            <li>• Des frais cachés ou supplémentaires non annoncés</li>
          </ul>
          <p className="text-sm text-gray-700">
            📞 En cas de doute, contactez-nous : +225 07 07 07 07 07
          </p>
        </div>

        {/* 8. BLOC "NOS ENGAGEMENTS" */}
        <div className="mt-4 p-4 bg-green-50/80 backdrop-blur-lg rounded-2xl border border-green-200">
          <h3 className="text-lg font-bold text-green-700 mb-3">🤝 NOS ENGAGEMENTS</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Transparence totale des prix et des délais</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Experts qualifiés et certifiés</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Suivi en temps réel de votre projet</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Garantie décennale sur tous les travaux</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span>Support client 7j/7</span>
            </li>
          </ul>
        </div>

        {/* 9. CHATBOT */}
        <ChatBot />
      </main>
    </div>
  );
}