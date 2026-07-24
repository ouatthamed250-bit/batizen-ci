"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HardHat, BrickWall, ChevronRight, Bell, Wallet, CalendarClock, Megaphone } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { WeatherWidget } from "@/components/btp/WeatherWidget";
import { ProgressBar } from "@/components/ui/ProgressBar";
import SuperCalculateur from "@/components/btp/SuperCalculateur";
import { getDatabase, ref as dbRef, onValue, update, query, orderByChild, equalTo } from "firebase/database";
import { logger } from "@/utils/logger";
import dynamic from "next/dynamic";
import AdminSecretModal from "@/components/auth/AdminSecretModal";
import AnnonceTicker from "@/components/ui/AnnonceTicker";
const ChatBot = dynamic(() => import("@/components/ChatBot"), { ssr: false });

// ✅ NOUVEAUX IMPORTS : Types et Utilitaires centralisés
import type { Chantier } from "@/types/chantier";
import { formatDateCourte, formatLocalisation, formatFcfa, getStatutLabel } from "@/utils/formatters";

/* ------------------------------------------------------------------ */
/* Constantes (Hors du composant pour éviter la recréation à chaque render) */
/* ------------------------------------------------------------------ */
const ANNONCES_DEMO = [
  "🎉 Promo: -10% sur votre premier chantier ce mois-ci !",
  "📢 Nouveau: Suivi de chantier par drone disponible.",
  "🔥 Offre spéciale: Audit gratuit pour les rénovations.",
  "⚠️ Rappel: Pensez à valider vos devis en attente."
];

const ACTIONS_RAPIDES = [
  { label: "Simulation", icon: "🧮", href: "/simulation", color: "bg-[#FF7A00]" },
  { label: "Nouveau Chantier", icon: "🏗️", href: "/nouveau-chantier", color: "bg-[#1e3a8a]" },
  { label: "Rénovation", icon: "🔨", href: "/renovation", color: "bg-green-600" }
];

/* ------------------------------------------------------------------ */
/* Composants Internes                                                  */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon: Icon, label, value }: { 
  icon: typeof HardHat; 
  label: string; 
  value: string | number; 
}) {
  return (
    <div className="w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 flex flex-col items-center text-center gap-3 shadow-xl">
      <div className="grid size-14 place-items-center rounded-[20px] text-white bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] shadow-lg">
        <Icon size={26} />
      </div>
      <div className="w-full">
        <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black text-white drop-shadow-md break-words">{value}</p>
      </div>
    </div>
  );
}

function SkeletonChantier() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl w-full shadow-xl">
      <div className="h-40 w-full bg-white/10" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-white/20" />
        <div className="h-4 w-1/2 rounded bg-white/20" />
        <div className="h-10 w-full rounded-[20px] bg-white/20" />
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
      className="w-full overflow-hidden rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl"
    >
      <div className="relative h-32 w-full bg-white/10">
        {photo ? <Image src={photo} alt={nom} fill className="object-cover" /> : <div className="grid size-full place-items-center text-white/60"><HardHat size={48} /></div>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-white drop-shadow-md break-words text-lg">{nom}</h3>
          <span className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black text-white bg-[#0B5FFF] shadow-md whitespace-nowrap">
            {getStatutLabel(chantier.statut)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80 drop-shadow-md">
          <HardHat size={14} /> {chantier.type || "—"} · {formatLocalisation(chantier.localisation)}
        </p>
        <p className="mt-2 text-sm text-white/80 drop-shadow-md">
          💰 Budget : <span className="font-bold text-white">{formatFcfa(chantier.budget || 0)}</span>
        </p>
        
        {chantier.statut === "en_cours" && (
          <div className="mt-4">
            <ProgressBar value={pct} label="Progression" />
          </div>
        )}
        
        {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && (
          <div className="mt-4 space-y-2">
            {chantier.plan_choisi && (
              <p className="text-sm text-white/80 drop-shadow-md">
                 Plan : <span className="font-bold text-white break-words">{chantier.plan_choisi}</span>
              </p>
            )}
            {chantier.rdv_date && (
              <p className="text-sm text-white/80 drop-shadow-md">
                📅 RDV : <span className="font-bold text-white">{formatDateCourte(chantier.rdv_date)}</span>
              </p>
            )}
          </div>
        )}
        
        {(chantier.statut === "termine" || chantier.statut === "terminé") && (
          <p className="mt-4 text-sm text-white/80 drop-shadow-md">
             Terminé le : <span className="font-bold text-white">{formatDateCourte(chantier.date_fin)}</span>
          </p>
        )}
        
        <div className="mt-5 flex flex-col gap-3">
          <Link href={`/chantier/${chantier.id}`} className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] py-3.5 text-sm font-black text-white transition active:scale-95 shadow-lg">
            Voir détails <ChevronRight size={18} />
          </Link>
          
          {chantier.statut === "en_attente" && onModifier && onSupprimer && (
            <div className="flex gap-3">
              <button
                onClick={() => onModifier(chantier.id)}
                className="flex-1 rounded-[16px] bg-white/20 py-3 text-sm font-bold text-white transition active:scale-95 shadow-lg"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => onSupprimer(chantier.id, chantier.statut!)}
                className="flex-1 rounded-[16px] bg-red-500/30 py-3 text-sm font-bold text-white transition active:scale-95 shadow-lg"
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
/* Page Principale                                                      */
/* ------------------------------------------------------------------ */

export default function DashboardClientPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  // ── Mécanisme secret "5 taps" pour ouvrir le modal admin ──
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleLogoTap = useCallback(() => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer) clearTimeout(tapTimer);
    const t = setTimeout(() => { setTapCount(0); }, 2000);
    setTapTimer(t);
    if (newCount >= 5) {
      setTapCount(0);
      if (tapTimer) clearTimeout(tapTimer);
      setShowAdminModal(true);
    }
  }, [tapCount, tapTimer]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]); // ✅ Typage fort
  const [notifications] = useState<any[]>([]); // À connecter plus tard
  const [partenaires, setPartenaires] = useState<any[]>([]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    setIsAuthReady(true);
    const db = getDatabase();
    const chantiersRef = dbRef(db, 'chantiers');
    const q = query(chantiersRef, orderByChild("userId"), equalTo(uid));
    
    const unsubChantiers = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const mesChantiers = Object.entries(data)
          .filter(([_, c]: [string, any]) => c.actif !== false)
          .map(([id, c]: [string, any]) => ({ id, ...c }));
        
        setChantiers(mesChantiers);
        setLoading(false);
      } else {
        setChantiers([]);
        setLoading(false);
      }
    }, (error) => {
      logger.error("❌ Erreur chargement chantiers:", error);
      setLoading(false);
    });

    return () => unsubChantiers();
  }, [user?.uid]);

  useEffect(() => {
    const db = getDatabase();
    const partenairesRef = dbRef(db, 'partenaires');
    const unsubPartenaires = onValue(partenairesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const partenairesActifs = Object.entries(data)
          .filter(([_, p]: [string, any]) => p.actif === true)
          .map(([id, p]: [string, any]) => ({ id, ...p }));
        setPartenaires(partenairesActifs);
      } else {
        setPartenaires([]);
      }
    });
    return () => unsubPartenaires();
  }, []);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Client";
  const chantiersActifs = chantiers.filter(c => c.statut === "en_cours").length;
  const prochainRdv = chantiers
    .filter(c => (c.statut === "en_attente" || c.statut === "en_attente_rdv") && c.rdv_date)
    .sort((a, b) => new Date(a.rdv_date!).getTime() - new Date(b.rdv_date!).getTime())[0];
  
  const depensesMois = 0; // À connecter avec la DB plus tard
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

  const pageContent = (
    <>
      <style>{`
        .wave-hand { display: inline-block; transform-origin: 70% 70%; animation: wave 2.5s infinite; }
        @keyframes wave { 0% { transform: rotate(0deg); } 10% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 30% { transform: rotate(14deg); } 40% { transform: rotate(-4deg); } 50% { transform: rotate(10deg); } 60% { transform: rotate(0deg); } 100% { transform: rotate(0deg); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
      `}</style>
      
      {/* Barre full-width avec logo BÂTIZEN.CI + mécanisme secret "5 taps" admin */}
      <AdminSecretModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <div className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 mb-2 flex items-center justify-center w-screen bg-white/10 backdrop-blur-md border-b border-white/20 py-3 shadow-lg">
        <Image
          alt="Logo BÂTIZEN CI"
          src="/assets/images/logo.png"
          width={36}
          height={36}
          className="rounded-xl cursor-pointer"
          onClick={handleLogoTap}
        />
      </div>

      <div className="flex flex-col gap-5 pt-6 pb-4">
        {/* Salutation */}
        <div className="flex items-center gap-3 mb-2">
          {(() => {
            const hour = new Date().getHours();
            const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
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

        {/* Bande défilante promo */}
        <div className="w-full overflow-hidden bg-[#FF7A00]/10 backdrop-blur-md rounded-[24px] border border-[#FF7A00]/30 py-3 shadow-lg">
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-3">
            {[...ANNONCES_DEMO, ...ANNONCES_DEMO].map((annonce, i) => (
              <span key={i} className="text-sm font-bold text-[#FF7A00] drop-shadow-md flex items-center gap-2">
                <Megaphone size={14} /> {annonce}
              </span>
            ))}
          </div>
        </div>

        {/* Annonces dynamiques (Realtime Database) */}
        <AnnonceTicker />

        {/* Météo */}
        <div className="w-full rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-xl mb-2">
          <WeatherWidget title="Météo du jour" />
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {ACTIONS_RAPIDES.map((btn, i) => (
            <Link key={i} href={btn.href}
              className={`flex flex-col items-center justify-center p-3 ${btn.color} text-white rounded-[22px] shadow-lg transition active:scale-95`}
            >
              <span className="text-2xl mb-1 drop-shadow-md">{btn.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight drop-shadow-sm">{btn.label}</span>
            </Link>
          ))}
        </div>

        {/* Calculateur */}
        <section className="w-full rounded-[28px] overflow-hidden shadow-xl">
          <SuperCalculateur
            surface={100} chambres={3} sallesDeBain={2} etages={1}
            garage={false} piscine={false} jardin={false}
            standing="moyen" style="moderne" mode="widget"
          />
        </section>

        {/* Cartes Résumé */}
        {!loading && (
          <section className="grid grid-cols-2 gap-3 w-full">
            <SummaryCard icon={HardHat} label="Chantiers actifs" value={chantiersActifs} />
            <SummaryCard icon={Wallet} label="Dépensé ce mois" value={formatFcfa(depensesMois)} />
            <SummaryCard icon={CalendarClock} label="Prochain RDV" value={prochainRdv ? formatDateCourte(prochainRdv.rdv_date) : "Aucun"} />
            <SummaryCard icon={Bell} label="Notifications" value={notifsNonLues} />
          </section>
        )}

        {/* Liste des chantiers */}
        {!isAuthReady ? (
          <div className="flex items-center justify-center py-12 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
            <span className="ml-3 text-white font-bold">Chargement...</span>
          </div>
        ) : loading ? (
          <div className="space-y-4 w-full">
            <SkeletonChantier /><SkeletonChantier />
          </div>
        ) : chantiers.length === 0 ? (
          <div className="w-full rounded-[28px] border border-dashed border-white/30 bg-white/20 p-8 text-center backdrop-blur-xl shadow-xl">
            <HardHat size={56} className="mx-auto mb-4 text-white/60" />
            <p className="text-base font-bold text-white/80 drop-shadow-md mb-4">Vous n'avez pas encore de chantier. Commencez par une simulation.</p>
            <Link href="/nouveau-chantier" className="inline-flex items-center gap-2 rounded-[20px] bg-[#0B5FFF] px-8 py-3 text-sm font-black text-white shadow-lg transition active:scale-95">
              <BrickWall size={20} /> Créer un chantier
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {chantiers.map((c) => (
              <ChantierCard key={c.id} chantier={c} onModifier={handleModifierChantier} onSupprimer={handleSupprimerChantier} />
            ))}
          </div>
        )}
        
        {/* Sections Infos */}
        <div className="mt-6 p-5 w-full bg-white/20 rounded-[28px] border border-white/30 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3 drop-shadow-md flex items-center gap-2">🏗️ À PROPOS DE BÂTIZEN.CI</h3>
          <p className="text-sm text-white/90 mb-3 drop-shadow-md leading-relaxed">
            BÂTIZEN.CI est votre partenaire BTP de confiance en Côte d'Ivoire. 
          </p>
          <p className="text-sm text-white/90 drop-shadow-md leading-relaxed">
            Notre mission : rendre la construction accessible, transparente et professionnelle pour tous.
          </p>
        </div>

        <div className="mt-5 p-5 w-full bg-red-500/20 rounded-[28px] border border-red-400/30 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-red-300 mb-3 drop-shadow-md flex items-center gap-2">🚨 ALERTE ARNAQUE</h3>
          <p className="text-sm text-white/90 mb-3 font-semibold drop-shadow-md">⚠️ BÂTIZEN.CI ne demande JAMAIS :</p>
          <ul className="text-sm text-white/80 space-y-2 mb-4">
            <li className="flex items-start gap-2"><span>•</span> Votre code OTP par téléphone</li>
            <li className="flex items-start gap-2"><span>•</span> Un paiement avant contrat signé</li>
            <li className="flex items-start gap-2"><span>•</span> Vos mots de passe complets</li>
            <li className="flex items-start gap-2"><span>•</span> Des frais cachés ou supplémentaires non annoncés</li>
          </ul>
          <p className="text-sm text-white/80 drop-shadow-md font-bold">📞 En cas de doute : +225 07 07 07 07 07</p>
        </div>

        <div className="mt-5 p-5 w-full bg-green-500/20 rounded-[28px] border border-green-400/30 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-green-300 mb-3 drop-shadow-md flex items-center gap-2">🤝 NOS ENGAGEMENTS</h3>
          <ul className="text-sm text-white/80 space-y-3">
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✅</span><span>Transparence totale des prix et des délais</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✅</span><span>Experts qualifiés et certifiés</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✅</span><span>Suivi en temps réel de votre projet</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✅</span><span>Garantie décennale sur tous les travaux</span></li>
            <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✅</span><span>Support client 7j/7</span></li>
          </ul>
        </div>

        <div className="mt-6">
          <ChatBot />
        </div>

        {/* Partenaires */}
        <div className="mt-8 w-full">
          <h3 className="font-black text-xl text-white mb-4 flex items-center gap-2 drop-shadow-md">🤝 Nos Partenaires de Confiance</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide w-full">
            {partenaires.map((partenaire: any) => (
              <div key={partenaire.id} className="min-w-[280px] bg-white/20 rounded-[24px] border border-white/30 backdrop-blur-xl shadow-lg p-4 flex flex-col items-center text-center snap-center">
                {partenaire.photo_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-[#FF7A00]">
                    <Image src={partenaire.photo_url} alt={partenaire.nom} width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FF7A00]/20 flex items-center justify-center mb-3 text-3xl">🏢</div>
                )}
                <h4 className="font-bold text-white text-lg mb-1 drop-shadow-md">{partenaire.nom}</h4>
                <p className="text-sm text-white/80 line-clamp-3 drop-shadow-md">{partenaire.description || "Partenaire certifié BÂTIZEN"}</p>
              </div>
            ))}
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px] bg-white/10 rounded-[24px] border-2 border-dashed border-white/30 p-4 flex flex-col items-center justify-center text-center snap-center backdrop-blur-xl">
                <span className="text-4xl mb-2">🏗️</span>
                <p className="text-sm font-bold text-white/60 drop-shadow-md">Bientôt disponible</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return pageContent;
}


