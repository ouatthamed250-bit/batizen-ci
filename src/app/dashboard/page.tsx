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
import PremiumBackground from "@/components/layout/PremiumBackground";

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

function SummaryCard({ icon: Icon, label, value }: { 
  icon: typeof HardHat; 
  label: string; 
  value: string | number; 
}) {
  return (
    <div className="w-full rounded-[22px] border border-white/30 bg-white/20 backdrop-blur-xl p-3 flex flex-col items-center text-center gap-2 shadow-lg">
      <div className="grid size-10 place-items-center rounded-[16px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B]">
        <Icon size={20} />
      </div>
      <div className="w-full">
        <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-white drop-shadow-md break-words">{value}</p>
      </div>
    </div>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-white/30 bg-white/20 backdrop-blur-xl w-full">
      <div className="h-36 w-full bg-white/10" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-white/20" />
        <div className="h-3 w-1/2 rounded bg-white/20" />
        <div className="h-9 w-full rounded-[16px] bg-white/20" />
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
      className="w-full overflow-hidden rounded-[22px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-lg"
    >
      <div className="relative h-36 w-full bg-white/10">
        {photo ? <Image src={photo} alt={nom} fill className="object-cover" /> : <div className="grid size-full place-items-center text-white/60"><HardHat size={40} /></div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-white drop-shadow-md break-words">{nom}</h3>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-white bg-[#0B5FFF] shadow-md whitespace-nowrap">{statutLabel(chantier.statut)}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80 drop-shadow-md">
          <HardHat size={12} /> {chantier.type || "—"} · {formatLocalisation(chantier.localisation)}
        </p>
        <p className="mt-1 text-xs text-white/80 drop-shadow-md">
          💰 Budget : <span className="font-bold text-white">{formatFcfa(chantier.budget || 0)}</span>
        </p>
        
        {chantier.statut === "en_cours" && (
          <div className="mt-3">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
        {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && (
          <div className="mt-3 space-y-1">
            {chantier.plan_choisi && (
              <p className="text-xs text-white/80 drop-shadow-md">
                🎯 Plan : <span className="font-bold text-white break-words">{chantier.plan_choisi}</span>
              </p>
            )}
            {chantier.rdv_date && (
              <p className="text-xs text-white/80 drop-shadow-md">
                📅 RDV : <span className="font-bold text-white">{formatDateCourte(chantier.rdv_date)}</span>
              </p>
            )}
          </div>
        )}
        
        {(chantier.statut === "termine" || chantier.statut === "terminé") && (
          <p className="mt-3 text-xs text-white/80 drop-shadow-md">
            🏁 Terminé le : <span className="font-bold text-white">{formatDateCourte(chantier.date_fin)}</span>
          </p>
        )}
        
        <div className="mt-4 flex flex-col gap-2">
          <Link href={`/chantier/${chantier.id}`} className="flex w-full items-center justify-center gap-1.5 rounded-[16px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] py-2.5 text-sm font-black text-white transition active:scale-95 shadow-lg">
            Voir détails <ChevronRight size={16} />
          </Link>
          
          {chantier.statut === "en_attente" && onModifier && onSupprimer && (
            <div className="flex gap-2">
              <button
                onClick={() => onModifier(chantier.id)}
                className="flex-1 rounded-[14px] bg-white/20 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => onSupprimer(chantier.id, chantier.statut!)}
                className="flex-1 rounded-[14px] bg-red-500/30 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg"
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
    <PremiumBackground>
      {/* CORRECTION 1 & 2 : px-3 pour plus de largeur, pb-24 pour ne pas cacher le bas avec la nav */}
      <div className="pt-4 pb-24 px-3 min-h-screen w-full">
        {/* CORRECTION 3 : w-full max-w-lg au lieu de max-w-[430px] pour bien remplir l'écran */}
        <main className="flex flex-col gap-4 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {(() => {
              const hour = new Date().getHours();
              const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
              const userName = user?.displayName || (user?.email ? user.email.split("@")[0] : "Client");
              
              return (
                <>
                  <span className="text-4xl wave-hand" role="img" aria-label="Salutation">✋🏽</span>
                  <div>
                    <h1 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                      {greeting}, <span className="text-[#FF7A00] drop-shadow-md">{userName}</span>
                    </h1>
                    <p className="text-sm text-white/80 font-medium mt-1 drop-shadow-md">
                      Prêt à suivre vos chantiers aujourd'hui ?
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="w-full rounded-3xl p-5 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-md mb-4">
            <WeatherWidget title="Météo du jour" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Simulation", icon: "🧮", href: "/simulation", color: "bg-[#FF7A00]" },
              { label: "Nouveau Chantier", icon: "🏗️", href: "/nouveau-chantier", color: "bg-[#1e3a8a]" },
              { label: "Rénovation", icon: "🔨", href: "/renovation", color: "bg-green-600" }
            ].map((btn, i) => (
              <Link key={i} href={btn.href}
                className={`flex flex-col items-center justify-center p-3 ${btn.color} text-white rounded-2xl shadow-lg transition active:scale-95`}
              >
                <span className="text-2xl mb-1 drop-shadow-md">{btn.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight drop-shadow-sm">{btn.label}</span>
              </Link>
            ))}
          </div>

          <section className="w-full">
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

          {!loading && (
            {/* CORRECTION 4 : grid-cols-2 sur mobile pour mettre les cartes côte à côte et gagner de la place */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
              <SummaryCard icon={HardHat} label="Chantiers actifs" value={chantiersActifs} />
              <SummaryCard icon={Wallet} label="Dépensé ce mois" value={formatFcfa(depensesMois)} />
              <SummaryCard icon={CalendarClock} label="Prochain RDV" value={prochainRdv ? formatDateCourte(prochainRdv.rdv_date) : "Aucun"} />
              <SummaryCard icon={Bell} label="Notifications" value={notifsNonLues} />
            </section>
          )}

          {!isAuthReady ? (
            <div className="flex items-center justify-center py-12 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
              <span className="ml-3 text-white">Chargement de vos chantiers...</span>
            </div>
          ) : loading ? (
            <div className="space-y-3 w-full">
              <SkeletonChantier /><SkeletonChantier />
            </div>
          ) : chantiers.length === 0 ? (
            <div className="w-full rounded-[22px] border border-dashed border-white/30 bg-white/20 p-8 text-center backdrop-blur-xl">
              <HardHat size={48} className="mx-auto mb-3 text-white/60" />
              <p className="text-sm font-bold text-white/80 drop-shadow-md">Vous n'avez pas encore de chantier. Commencez par une simulation.</p>
              <Link href="/nouveau-chantier" className="mt-3 inline-flex items-center gap-2 rounded-[16px] bg-[#0B5FFF] px-6 py-2.5 text-sm font-black text-white shadow-lg">
                <BrickWall size={18} /> Créer un chantier
              </Link>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/80 drop-shadow-md">Mes chantiers</h2>
              <div className="grid gap-3 w-full"> {/* Retiré sm:grid-cols-2 pour forcer 1 colonne large et lisible sur mobile */}
                {chantiers.map((c) => (
                  <ChantierCard key={c.id} chantier={c} onModifier={handleModifierChantier} onSupprimer={handleSupprimerChantier} />
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 w-full bg-white/20 rounded-2xl border border-white/30 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-bold text-white mb-3 drop-shadow-md">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
            <p className="text-sm text-white/90 mb-3 drop-shadow-md">
              BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire. 
              Nous simplifions la construction en vous connectant avec des experts qualifiés, 
              en vous offrant des outils de simulation avancés et en assurant un suivi transparent de vos projets.
            </p>
            <p className="text-sm text-white/90 drop-shadow-md">
              Notre mission : rendre la construction accessible, transparente et professionnelle pour tous.
            </p>
          </div>

          <div className="mt-4 p-4 w-full bg-red-500/20 rounded-2xl border border-red-400/30 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-bold text-red-300 mb-3 drop-shadow-md">🚨 ALERTE ARNAQUE</h3>
            <p className="text-sm text-white/90 mb-2 font-semibold drop-shadow-md">
              ⚠️ BÂTIZEN.CI ne demande JAMAIS :
            </p>
            <ul className="text-sm text-white/80 space-y-1 mb-3">
              <li>• Votre code OTP par téléphone</li>
              <li>• Un paiement avant contrat signé</li>
              <li>• Vos mots de passe complets</li>
              <li>• Des frais cachés ou supplémentaires non annoncés</li>
            </ul>
            <p className="text-sm text-white/80 drop-shadow-md">
              📞 En cas de doute, contactez-nous : +225 07 07 07 07 07
            </p>
          </div>

          <div className="mt-4 p-4 w-full bg-green-500/20 rounded-2xl border border-green-400/30 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-bold text-green-300 mb-3 drop-shadow-md">🤝 NOS ENGAGEMENTS</h3>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="flex items-start">
                <span className="text-green-400 mr-2 drop-shadow-md">✅</span>
                <span>Transparence totale des prix et des délais</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2 drop-shadow-md">✅</span>
                <span>Experts qualifiés et certifiés</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2 drop-shadow-md">✅</span>
                <span>Suivi en temps réel de votre projet</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2 drop-shadow-md">✅</span>
                <span>Garantie décennale sur tous les travaux</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2 drop-shadow-md">✅</span>
                <span>Support client 7j/7</span>
              </li>
            </ul>
          </div>

          <ChatBot />

          <div className="mt-8 w-full">
            <h3 className="font-black text-xl text-white mb-4 flex items-center gap-2 drop-shadow-md">
              🤝 Nos Partenaires de Confiance
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide w-full">
              {partenaires.map((partenaire: any) => (
                <div key={partenaire.id} className="min-w-[280px] bg-white/20 rounded-2xl border border-white/30 backdrop-blur-xl shadow-lg p-4 flex flex-col items-center text-center snap-center">
                  {partenaire.photo_url ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#FF7A00]">
                      <img src={partenaire.photo_url} alt={partenaire.nom} className="w-full h-full object-cover" />
                </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#FF7A00]/20 flex items-center justify-center mb-3 text-3xl">
                      🏢
                    </div>
                  )}
                  <h4 className="font-bold text-white text-lg mb-1 drop-shadow-md break-words w-full">{partenaire.nom}</h4>
                  <p className="text-sm text-white/80 line-clamp-3 drop-shadow-md">{partenaire.description || "Partenaire certifié BÂTIZEN"}</p>
                </div>
              ))}
              <div className="min-w-[280px] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 p-4 flex flex-col items-center justify-center text-center snap-center backdrop-blur-xl">
                <span className="text-4xl mb-2">🏢</span>
                <p className="text-sm font-bold text-white/60 drop-shadow-md">Bientôt disponible</p>
              </div>
              <div className="min-w-[280px] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 p-4 flex flex-col items-center justify-center text-center snap-center backdrop-blur-xl">
                <span className="text-4xl mb-2">🤝</span>
                <p className="text-sm font-bold text-white/60 drop-shadow-md">Bientôt disponible</p>
              </div>
              <div className="min-w-[280px] bg-white/10 rounded-2xl border-2 border-dashed border-white/30 p-4 flex flex-col items-center justify-center text-center snap-center backdrop-blur-xl">
                <span className="text-4xl mb-2">🏗️</span>
                <p className="text-sm font-bold text-white/60 drop-shadow-md">Bientôt disponible</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PremiumBackground>
    </>
  );
}