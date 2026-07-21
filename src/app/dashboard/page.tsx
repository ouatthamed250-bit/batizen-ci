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
import { getDatabase, ref as dbRef, onValue, update, query, orderByChild, equalTo } from "firebase/database";
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

type Promo = {
  id: string;
  titre?: string;
  description?: string;
  image_url?: string;
  active?: boolean;
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

function ChantierCard({ chantier, onModifier, onSupprimer }: { 
  chantier: Chantier; 
  onModifier?: (id: string) => void;
  onSupprimer?: (id: string, statut: string) => void;
}) {
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
        
        {chantier.statut === "en_cours" && (
          <div className="mt-3">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
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
        
        {(chantier.statut === "termine" || chantier.statut === "terminé") && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            🏁 Terminé le : <span className="font-bold text-[var(--navy)]">{formatDateCourte(chantier.date_fin)}</span>
          </p>
        )}
        
        <div className="mt-4 flex flex-col gap-2">
          <Link href={`/chantier/${chantier.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] py-2.5 text-sm font-black text-white transition active:scale-95">
            Voir détails <ChevronRight size={16} />
          </Link>
          
          {chantier.statut === "en_attente" && onModifier && onSupprimer && (
            <div className="flex gap-2">
              <button
                onClick={() => onModifier(chantier.id)}
                className="flex-1 rounded-[14px] bg-blue-500/20 py-2 text-xs font-bold text-blue-400 transition active:scale-95"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => onSupprimer(chantier.id, chantier.statut!)}
                className="flex-1 rounded-[14px] bg-red-500/20 py-2 text-xs font-bold text-red-400 transition active:scale-95"
              >
                🗑️ Supprimer
              </button>
            </div>
          )}
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [partenaires, setPartenaires] = useState<any[]>([]);

  // Effet 1 : Attendre que l'auth soit prête
  useEffect(() => {
    if (user?.uid) {
      console.log("✅ [CLIENT] Auth ready! UID:", user.uid);
      setIsAuthReady(true);
    } else {
      console.log("⏳ [CLIENT] Attente authentification...");
      setIsAuthReady(false);
    }
  }, [user?.uid]);

  // Effet 2 : Charger les chantiers SEULEMENT quand auth est prête - AVEC FILTRE POUR RÈGLE STRICTE
  useEffect(() => {
    if (!isAuthReady || !user?.uid) {
      console.log("⏸️ [CLIENT] Chargement chantiers en pause (auth non prête)");
      return;
    }

    console.log("✅ [SEC] Chantiers chargés avec filtre Firebase (userId filter)");
    
    const db = getDatabase();
    const chantiersRef = dbRef(db, 'chantiers');
    const q = query(chantiersRef, orderByChild("userId"), equalTo(user.uid));
    const unsubChantiers = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const mesChantiers = Object.entries(data)
          .filter(([_, c]: [string, any]) => {
            const isActive = c.actif !== false;
            console.log(`  ✅ Chantier validé: ${c.nom_projet || c.nom}`);
            return isActive;
          })
          .map(([id, c]: [string, any]) => ({ id, ...c }));
        
        console.log(`✅ [CLIENT] ${mesChantiers.length} chantiers chargés`);
        setChantiers(mesChantiers);
        setLoading(false);
      } else {
        console.log("⚠️ [CLIENT] Aucune donnée dans /chantiers");
        setChantiers([]);
        setLoading(false);
      }
    }, (error) => {
      console.error("❌ [CLIENT] Erreur Firebase:", error);
      setLoading(false);
    });

    return () => {
      console.log("🧹 [CLIENT] Nettoyage listener chantiers");
      unsubChantiers();
    };
  }, [isAuthReady, user?.uid]);

  // Listener pour les partenaires
  useEffect(() => {
    const db = getDatabase();
    const partenairesRef = dbRef(db, 'partenaires');
    const unsubPartenaires = onValue(partenairesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const partenairesActifs = Object.entries(data)
          .filter(([id, p]: [string, any]) => p.actif === true)
          .map(([id, p]: [string, any]) => ({ id, ...p }));
        setPartenaires(partenairesActifs);
      } else {
        setPartenaires([]);
      }
    });
    return () => unsubPartenaires();
  }, []);

  const nomClient = user?.displayName || user?.email?.split("@")[0] || "Client";
  
  const chantiersActifs = chantiers.filter(c => c.statut === "en_cours").length;
  const prochainRdv = chantiers
    .filter(c => (c.statut === "en_attente" || c.statut === "en_attente_rdv") && c.rdv_date)
    .sort((a, b) => new Date(a.rdv_date!).getTime() - new Date(b.rdv_date!).getTime())[0];
  
  const depensesMois = 0;
  const notifsNonLues = notifications.length;

  const handleSupprimerChantier = async (id: string, statut: string) => {
    if (statut === "en_cours" || statut === "termine" || statut === "terminé") {
      alert("⚠️ Impossible de supprimer un chantier en cours ou terminé. Veuillez contacter l'administration.");
      return;
    }
    if (!confirm("Voulez-vous vraiment supprimer ce chantier ? Cette action est irréversible.")) return;
    
    const db = getDatabase();
    await update(dbRef(db, `chantiers/${id}`), {
      statut: "supprime_par_client", 
      dateMiseAJour: Date.now() 
    });
    alert("✅ Chantier supprimé avec succès.");
  };

  const handleModifierChantier = (id: string) => {
    window.location.href = `/nouveau-chantier?edit=${id}`;
  };

  return (
    <>
    <style>{`
  .wave-hand {
    display: inline-block;
    transform-origin: 70% 70%;
    animation: wave 2.5s infinite;
  }
  @keyframes wave {
    0% { transform: rotate(0deg); }
    10% { transform: rotate(14deg); }
    20% { transform: rotate(-8deg); }
    30% { transform: rotate(14deg); }
    40% { transform: rotate(-4deg); }
    50% { transform: rotate(10deg); }
    60% { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }
`}</style>
    <div className="pt-20 pb-16 px-4 min-h-screen bg-[#f9fafb] overflow-x-hidden">
      <main className="flex flex-col gap-3">
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const hour = new Date().getHours();
            const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
            const userName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Client");
            
            return (
              <>
                <span className="text-4xl wave-hand" role="img" aria-label="Salutation">✋🏽</span>
                <div>
                  <h1 className="text-2xl font-black text-[#1e3a8a] leading-tight">
                    {greeting}, <span className="text-[#FF7A00]">{userName}</span>
                  </h1>
                  <p className="text-sm text-[#4b5563] font-medium mt-1">
                    Prêt à suivre vos chantiers aujourd'hui ?
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        <div className="w-full rounded-3xl p-5 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-md mb-6">
          <WeatherWidget title="Météo du jour" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Simulation", icon: "🧮", href: "/simulation", color: "bg-[#FF7A00]" },
            { label: "Nouveau Chantier", icon: "🏗️", href: "/nouveau-chantier", color: "bg-[#1e3a8a]" },
            { label: "Rénovation", icon: "", href: "/renovation", color: "bg-green-600" }
          ].map((btn, i) => (
            <Link key={i} href={btn.href}
              className={`flex flex-col items-center justify-center p-3 ${btn.color} text-white rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.2)] border-b-4 border-black/20 active:shadow-none active:border-b-0 active:translate-y-1 transition-all duration-150`}
            >
              <span className="text-2xl mb-1 drop-shadow-md">{btn.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight drop-shadow-sm">{btn.label}</span>
            </Link>
          ))}
        </div>

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

        {!loading && promos.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-3">📢 Promotions en cours</h2>
            <div className="space-y-3">
              {promos.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-[20px] overflow-hidden border border-white/50 bg-white/90 shadow-lg"
                >
                  {p.image_url && (
                    <div className="relative h-32 w-full">
                      <Image src={p.image_url} alt={p.titre || "Promotion"} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-black text-[var(--navy)]">{p.titre || "Promotion"}</h3>
                    {p.description && (
                      <p className="text-xs text-[var(--muted)] mt-1">{p.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {!loading && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={HardHat} label="Chantiers actifs" value={chantiersActifs} color="#0B5FFF" />
            <SummaryCard icon={Wallet} label="Dépensé ce mois" value={formatFcfa(depensesMois)} color="#FF7A00" />
            <SummaryCard icon={CalendarClock} label="Prochain RDV" value={prochainRdv ? formatDateCourte(prochainRdv.rdv_date) : "Aucun"} color="#22C55E" />
            <SummaryCard icon={Bell} label="Notifications" value={notifsNonLues} color="#EC4899" />
          </section>
        )}

        {!isAuthReady ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
            <span className="ml-3 text-gray-500">Chargement de vos chantiers...</span>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <SkeletonChantier /><SkeletonChantier />
          </div>
        ) : chantiers.length === 0 ? (
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
              {chantiers.map((c) => (
                <ChantierCard key={c.id} chantier={c} onModifier={handleModifierChantier} onSupprimer={handleSupprimerChantier} />
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-[#1e3a8a] mb-3">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
          <p className="text-sm text-gray-700 mb-3">
            BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire. 
            Nous simplifions la construction en vous connectant avec des experts qualifiés, 
            en vous offrant des outils de simulation avancés et en assurant un suivi transparent de vos projets.
          </p>
          <p className="text-sm text-gray-700">
            Notre mission : rendre la construction accessible, transparente et professionnelle pour tous.
          </p>
        </div>

        <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
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

        <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-200 shadow-sm">
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

        <ChatBot />

        <div className="mt-8">
          <h3 className="font-black text-xl text-[#1e3a8a] mb-4 flex items-center gap-2">
            🤝 Nos Partenaires de Confiance
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
            {partenaires.map((partenaire: any) => (
              <div key={partenaire.id} className="min-w-[280px] bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col items-center text-center snap-center">
                {partenaire.photo_url ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#FF7A00]">
                    <img src={partenaire.photo_url} alt={partenaire.nom} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#FF7A00]/10 flex items-center justify-center mb-3 text-3xl">
                    🏢
                  </div>
                )}
                <h4 className="font-bold text-[#1e3a8a] text-lg mb-1">{partenaire.nom}</h4>
                <p className="text-sm text-gray-700 line-clamp-3">{partenaire.description || "Partenaire certifié BÂTIZEN"}</p>
              </div>
            ))}
            <div className="min-w-[280px] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center text-center snap-center">
              <span className="text-4xl mb-2">🏢</span>
              <p className="text-sm font-bold text-gray-500">Bientôt disponible</p>
            </div>
            <div className="min-w-[280px] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center text-center snap-center">
              <span className="text-4xl mb-2">🤝</span>
              <p className="text-sm font-bold text-gray-500">Bientôt disponible</p>
            </div>
            <div className="min-w-[280px] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center text-center snap-center">
              <span className="text-4xl mb-2">🏗️</span>
              <p className="text-sm font-bold text-gray-500">Bientôt disponible</p>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}