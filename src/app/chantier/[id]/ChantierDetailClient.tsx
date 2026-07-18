"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Phone,
  MessageCircle,
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  RefreshCw,
  Clock,
  Download,
  ImageOff,
  Image as ImageIcon,
  Users,
  CreditCard,
  FileText,
  ListChecks,
  ChevronRight,
  Calendar,
  CalendarClock,
  MessageSquare,
  BookOpen,
  BarChart3,
  Info,
  Send,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Eye,
  FileDown,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { rtdbGet, rtdbGetList, rtdbSubscribeList } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";
import { AffichageEquipe } from "@/components/admin/ChantierMessaging";
import { ref, push, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import SuperCalculateur from "@/components/btp/SuperCalculateur";
import ChatBot from "@/components/ChatBot";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Chantier = {
  id?: string;
  nom?: string;
  nom_projet?: string;
  adresse?: string;
  date_debut?: string;
  date_fin?: string;
  progression?: number;
  progress?: number;
  photo?: string;
  image_url?: string;
  chef_id?: string;
  userId?: string;
  statut?: string; // "en_attente" | "en_cours" | "termine"
  type?: string;
  budget?: number;
  plan_choisi?: string;
  delai?: string;
  date_creation?: string;
  dateActivation?: number;
  rdv_date?: string;
  localisation?: {
    ville?: string;
    commune?: string;
    quartier?: string;
    adresse?: string;
  };
  materiaux?: Record<string, unknown>;
  superficie?: number;
  description?: string;
};

type Etape = {
  id: string;
  nom?: string;
  titre?: string;
  statut?: string; // termine | en_cours | a_venir
  date?: string;
  description?: string;
  pourcentage?: number;
};

type Photo = {
  id: string;
  url?: string;
  date?: string;
  titre?: string;
  categorie?: string; // "avant" | "pendant" | "apres"
};

type Membre = {
  id: string;
  nom?: string;
  role?: string;
  telephone?: string;
  photo?: string;
  type?: string; // chef | ouvrier
};

type Paiement = {
  id: string;
  date?: string;
  montant?: number;
  mode?: string;
  statut?: string; // paye | en_attente | en_retard
};

type DocumentItem = {
  id: string;
  nom?: string;
  date?: string;
  type?: string;
  url?: string;
  taille?: string;
};

type RendezVous = {
  id: string;
  date?: string;
  heure?: string;
  lieu?: string;
  type?: string;
  statut?: string; // planifie | passe | annule
  notes?: string;
};

type Message = {
  id: string;
  expediteur?: string;
  contenu?: string;
  date?: string;
  heure?: string;
  photoProfil?: string;
  role?: string; // client | admin | equipe
};

type Rapport = {
  id: string;
  date?: string;
  titre?: string;
  auteur?: string;
  resume?: string;
  contenu?: string;
  statut?: string; // lu | non_lu
  url?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDateFr(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getDate()} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function formatDateTimeFr(d?: string, h?: string): string {
  if (!d) return "—";
  const date = formatDateFr(d);
  if (h) return `${date} à ${h}`;
  return date;
}

function etapeIcon(statut?: string) {
  switch (statut) {
    case "termine":
      return <CheckCircle2 className="size-5 shrink-0 text-[#22C55E]" />;
    case "en_cours":
      return <RefreshCw className="size-5 shrink-0 animate-spin text-[#0B5FFF]" />;
    default:
      return <Clock className="size-5 shrink-0 text-[#9CA3AF]" />;
  }
}

function etapeLabel(statut?: string): string {
  switch (statut) {
    case "termine": return "Terminé";
    case "en_cours": return "En cours";
    default: return "À venir";
  }
}

function etapeColor(statut?: string): string {
  switch (statut) {
    case "termine": return "#22C55E";
    case "en_cours": return "#0B5FFF";
    default: return "#9CA3AF";
  }
}

function rdvStatutBadge(statut?: string) {
  switch (statut) {
    case "passe":
      return <span className="rounded-full bg-[#9CA3AF]/10 px-2 py-0.5 text-[10px] font-black text-[#9CA3AF]">Passé</span>;
    case "annule":
      return <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-black text-[#EF4444]">Annulé</span>;
    default:
      return <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-black text-[#22C55E]">Planifié</span>;
  }
}

function messageRoleLabel(role?: string): string {
  switch (role) {
    case "admin": return "Admin";
    case "equipe": return "Équipe";
    default: return role || "Client";
  }
}

const tabContentVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

const TABS = [
  { key: "resume", label: "Résumé", icon: Info },
  { key: "avancement", label: "Avancement", icon: ListChecks },
  { key: "planning", label: "Planning", icon: Calendar },
  { key: "rendezvous", label: "Rendez-vous", icon: CalendarClock },
  { key: "photos", label: "Photos", icon: ImageOff },
  { key: "album", label: "Album", icon: ImageIcon },
  { key: "equipe", label: "Équipe", icon: Users },
  { key: "paiements", label: "Paiements", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "passeport", label: "Passeport", icon: BookOpen },
  { key: "rapports", label: "Rapports", icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Helper to format localisation safely                                */
/* ------------------------------------------------------------------ */

function formatLocalisation(loc: Chantier["localisation"] | string | undefined | null, fallbackAdresse?: string): string {
  if (!loc) return fallbackAdresse || "—";
  // Si localisation est déjà une chaîne (ex: "Cotonou, Cadjehoun")
  if (typeof loc === "string") return loc;
  const parts: string[] = [];
  if (loc.ville) parts.push(loc.ville);
  if (loc.commune) parts.push(loc.commune);
  if (loc.quartier) parts.push(loc.quartier);
  const base = parts.join(", ");
  if (loc.adresse) {
    return base ? `${base} - ${loc.adresse}` : loc.adresse;
  }
  return base || fallbackAdresse || "—";
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ChantierDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [equipe, setEquipe] = useState<Membre[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("resume");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [albumIndex, setAlbumIndex] = useState<number | null>(null);

  // Nouvelles données
const [planning, setPlanning] = useState<Etape[]>([]);
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [album, setAlbum] = useState<Photo[]>([]);
  const [rapports, setRapports] = useState<Rapport[]>([]);
const [ouvriersList, setOuvriersList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fonction de téléchargement universelle
  const handleTelechargerFichier = async (url: string, nomFichier: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = nomFichier;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert("Impossible de télécharger le fichier.");
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let unsubMessages: Unsubscribe | null = null;

    async function load() {
      const [c, e, p, eq, pa, d] = await Promise.all([
        rtdbGet<Chantier>(`chantiers/${id}`),
        rtdbGetList<Etape>(`chantiers/${id}/etapes`),
        rtdbGetList<Photo>(`chantiers/${id}/photos`),
        rtdbGetList<Membre>(`chantiers/${id}/equipe`),
        rtdbGetList<Paiement>(`chantiers/${id}/paiements`),
        rtdbGetList<DocumentItem>(`chantiers/${id}/documents`),
      ]);
      if (cancelled) return;
      setChantier(c);
      setEtapes(e);
      setPhotos(p);
      setEquipe(eq);
      setPaiements(pa);
      setDocuments(d);
      setLoading(false);

      // Charger les nouvelles collections en parallèle
      if (!cancelled) {
        const [plan, rdv, alb, rap] = await Promise.all([
          rtdbGetList<Etape>(`chantiers/${id}/planning`),
          rtdbGetList<RendezVous>(`chantiers/${id}/rendezvous`),
          rtdbGetList<Photo>(`chantiers/${id}/album`),
          rtdbGetList<Rapport>(`chantiers/${id}/rapports`),
        ]);
        setPlanning(plan);
        setRendezvous(rdv);
        setAlbum(alb);
        setRapports(rap);
      }
    }

    load();

    // Messages en temps réel
    if (id) {
      unsubMessages = rtdbSubscribeList<Message>(`chantiers/${id}/messages`, (data) => {
        setMessages(data);
      });
    }

    return () => {
      cancelled = true;
      if (unsubMessages) unsubMessages();
    };
  }, [id]);

  const nom = chantier?.nom_projet || chantier?.nom || "Chantier";
  const pct = Number(chantier?.progression ?? chantier?.progress ?? 0);
  const chef = equipe.find((m) => (m.type || "chef") === "chef") || equipe[0];
  const ouvriers = equipe.filter((m) => (m.type || "chef") === "ouvrier");
  const totalPaye = paiements.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

  const waLink = (tel?: string) =>
    tel ? `https://wa.me/${tel.replace(/[^0-9]/g, "")}` : "#";

  // Vérifie si un onglet est verrouillé
  const isTabLocked = (key: TabKey): boolean => {
    const statut = chantier?.statut;
    if (statut === "en_cours" || statut === "termine") return false;
    // en_attente: seulement resume et documents
    const allowed = ["resume", "documents"];
    return !allowed.includes(key);
  };

  // Envoyer un message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !id) return;
    try {
      const { database } = getFirebaseServices();
      const messagesRef = ref(database, `chantiers/${id}/messages`);
      await push(messagesRef, {
        expediteur: user?.displayName || "Client",
        contenu: newMessage.trim(),
        date: new Date().toISOString().split("T")[0],
        heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        photoProfil: user?.photoURL || "",
        role: "client",
      });
      setNewMessage("");

      // Envoyer notification à l'équipe/admin
      const { sendNotification } = await import("@/lib/notifications");
      if (chantier?.userId && chantier.userId !== user?.uid) {
        await sendNotification(chantier.userId, {
          type: "nouveau_message",
          chantierId: id,
          chantierNom: nom,
          message: `Nouveau message dans votre chantier "${nom}"`,
        });
      }
    } catch (err) {
      console.error("Erreur envoi message", err);
    }
  }, [newMessage, id, user, chantier, nom]);

  // Filtrer les onglets à afficher selon le statut
  const visibleTabs = (): TabKey[] => {
    const statut = chantier?.statut;
    if (statut === "en_cours" || statut === "termine") {
      // Si terminé, certains onglets restent accessibles en lecture seule
      if (statut === "termine") {
        return ["resume", "album", "passeport", "documents", "rapports", "avancement", "photos", "equipe", "paiements"];
      }
      return TABS.map(t => t.key);
    }
    // en_attente
    return ["resume", "documents"];
  };

  const affichableTabs = visibleTabs();

  // Bandeau de statut
  const renderStatusBanner = () => {
    const statut = chantier?.statut;
    if (statut === "en_attente") {
      return (
        <div className="mb-4 rounded-[18px] border border-[#FFF7ED] bg-[#FFF7ED] p-4">
          <p className="text-sm font-black text-[#B45309]">⏳ Votre chantier est en attente de validation par nos experts.</p>
          {chantier?.rdv_date && (
            <p className="mt-1 text-xs font-semibold text-[#B45309]">Un expert vous contactera suite à votre rendez-vous du {formatDateFr(chantier.rdv_date)}.</p>
          )}
        </div>
      );
    }
    if (statut === "en_cours") {
      return (
        <div className="mb-4 rounded-[18px] border border-[#ECFDF5] bg-[#ECFDF5] p-4">
          <p className="text-sm font-black text-[#047857]">✅ Votre chantier est en cours ! Suivez l avancement en temps réel.</p>
        </div>
      );
    }
    if (statut === "termine") {
      return (
        <div className="mb-4 rounded-[18px] border border-[#EFF6FF] bg-[#EFF6FF] p-4">
          <p className="text-sm font-black text-[#1E40AF]">🎉 Félicitations ! Votre chantier est terminé.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-28">
      {/* HEADER DU CHANTIER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          {chantier?.photo || chantier?.image_url ? (
            <Image src={(chantier.photo || chantier.image_url)!} alt={nom} fill className="object-cover" />
          ) : (
            <div className="size-full bg-[#0D2B6B]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B6B]/85 via-[#0D2B6B]/70 to-[#0D2B6B]/95" />
        </div>

        <div className="relative px-4 pt-10 pb-6 sm:px-6">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-white/80 transition hover:text-white"
          >
            ← Retour
          </Link>
          <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
            {loading ? "Chargement..." : nom}
          </h1>
          {chantier?.adresse && (
            <p className="mt-1 text-sm font-semibold text-white/80">📍 {chantier.adresse}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-white/70">
            {chantier?.date_debut && <span>Début : {formatDateFr(chantier.date_debut)}</span>}
            {chantier?.date_fin && <span>Fin prévue : {formatDateFr(chantier.date_fin)}</span>}
          </div>
          <div className="mt-4 max-w-md">
            <ProgressBar value={pct} label="Progression globale" />
          </div>
        </div>
      </header>

      {/* TABS NAV */}
      <div className="sticky top-0 z-20 border-b border-[#E7EBF5] bg-[#F7F9FC]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-2 py-2">
          {TABS.map((t) => {
            const isVisible = affichableTabs.includes(t.key);
            const isLocked = !isVisible;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                disabled={isLocked}
                title={isLocked ? "Disponible après activation du chantier" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
                  activeTab === t.key
                    ? "bg-[#0D2B6B] text-white shadow"
                    : isLocked
                    ? "cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]"
                    : "bg-white text-[#6B7280] hover:text-[#0D2B6B]"
                }`}
              >
                <t.icon size={15} aria-hidden={true} />
                {t.label}
                {isLocked && <span className="text-[10px]">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* BANDEAU STATUT */}
      {chantier && renderStatusBanner()}

      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {/* ONGLET 0 - RÉSUMÉ */}
              {activeTab === "resume" && (
                <section aria-label="Résumé">
                  <div className="space-y-4 rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                    <h2 className="text-lg font-black text-[#0D2B6B]">Résumé du projet</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Nom du projet</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{chantier?.nom_projet || chantier?.nom || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Type</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{chantier?.type || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Localisation</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{formatLocalisation(chantier?.localisation, chantier?.adresse)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Budget total</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{chantier?.budget ? formatFcfa(chantier.budget) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Plan choisi</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{chantier?.plan_choisi || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Délai</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{chantier?.delai || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Date de création</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_creation)}</p>
                      </div>
                      {chantier?.dateActivation && (
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Date d activation</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(new Date(chantier.dateActivation).toISOString())}</p>
                        </div>
                      )}
                      {chantier?.statut === "termine" && (
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Date de fin</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_fin)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#6B7280]">Progression globale</p>
                        <p className="text-sm font-black text-[#0D2B6B]">{pct}%</p>
                      </div>
                    </div>
{chantier?.description && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[#6B7280]">Description</p>
                        <p className="text-sm text-[#374151]">{chantier.description}</p>
                      </div>
                    )}

{/* SECTION "MON ÉQUIPE" - Ouvriers affectés à ce chantier */}
                    <div className="mt-6 p-4 bg-white/90 rounded-2xl border border-white/50">
                      <h3 className="font-bold text-[var(--navy)] mb-3 flex items-center gap-2">👷 Mon Équipe sur ce chantier</h3>
                      {ouvriers.length === 0 ? (
                        <p className="text-sm text-gray-500">L'équipe sera assignée prochainement par l'administration.</p>
                      ) : (
                        <div className="space-y-2">
                          {ouvriers.map((ouvrier: Membre) => (
                            <div key={ouvrier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                              <div>
                                <p className="font-bold text-sm text-[var(--navy)]">{ouvrier.nom}</p>
                                <p className="text-xs text-gray-600">{ouvrier.role || "Membre"}</p>
                              </div>
                              {(ouvrier.type === "chef" || ouvrier.type === "chef_de_chantier") && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">👑 Chef</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <a
                        href={waLink(chef?.telephone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#25D366] px-5 py-3 text-sm font-black text-white transition active:scale-95"
                      >
                        Contacter l expert <MessageCircle size={16} />
                      </a>
                    </div>
                  </div>

                  {/* Super Calculateur - Suivi du budget */}
                  {chantier?.budget && (
                    <SuperCalculateur
                      surface={Number(chantier.superficie) || 150}
                      chambres={3}
                      sallesDeBain={2}
                      etages={1}
                      garage={false}
                      piscine={false}
                      jardin={false}
                      standing="moyen"
                      style="moderne"
                      mode="suivi"
                      budgetDepense={totalPaye}
                    />
                  )}
                </section>
              )}

              {/* ONGLET 1 - AVANCEMENT */}
              {activeTab === "avancement" && (
                <section aria-label="Avancement">
                  {etapes.length === 0 ? (
                    <EmptyState text="Aucune étape renseignée" />
                  ) : (
                    <div className="relative space-y-4 pl-2">
                      {etapes.map((e, i) => (
                        <div key={e.id} className="relative rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <div className="flex items-start gap-3">
                            {etapeIcon(e.statut)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                                  style={{ backgroundColor: etapeColor(e.statut) }}
                                >
                                  {etapeLabel(e.statut)}
                                </span>
                              </div>
                              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
                              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
                              <div className="mt-3">
                                <ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 2 - PLANNING */}
              {activeTab === "planning" && (
                <section aria-label="Planning">
                  {isTabLocked("planning") ? (
                    <LockedTab />
                  ) : planning.length === 0 ? (
                    <EmptyState text="Aucune planification disponible" />
                  ) : (
                    <div className="relative space-y-4 pl-2">
                      {planning.map((e, i) => (
                        <div key={e.id} className="relative rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <div className="flex items-start gap-3">
                            {etapeIcon(e.statut)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                                  style={{ backgroundColor: etapeColor(e.statut) }}
                                >
                                  {etapeLabel(e.statut)}
                                </span>
                              </div>
                              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
                              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
                              <div className="mt-3">
                                <ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 3 - RENDEZ-VOUS */}
              {activeTab === "rendezvous" && (
                <section aria-label="Rendez-vous">
                  {isTabLocked("rendezvous") ? (
                    <LockedTab />
                  ) : rendezvous.length === 0 ? (
                    <EmptyState text="Aucun rendez-vous planifié" />
                  ) : (
                    <div className="space-y-3">
                      {rendezvous.map((r) => (
                        <div key={r.id} className="rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-[#0D2B6B]">{r.type || "Rendez-vous"}</h3>
                                {rdvStatutBadge(r.statut)}
                              </div>
                              <p className="mt-1 text-sm text-[#374151]">
                                📅 {formatDateTimeFr(r.date, r.heure)}
                              </p>
                              {r.lieu && <p className="mt-1 text-xs text-[#6B7280]">📍 {r.lieu}</p>}
                              {r.notes && <p className="mt-2 text-sm text-[#374151]">{r.notes}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 4 - PHOTOS */}
              {activeTab === "photos" && (
                <section aria-label="Photos">
                  {photos.length === 0 ? (
                    <EmptyState text="Aucune photo disponible" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {photos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => p.url && setLightbox(p.url)}
                          className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm"
                        >
                          {p.url ? (
                            <Image src={p.url} alt="Photo chantier" fill className="object-cover transition group-hover:scale-105" />
                          ) : null}
                          {p.date && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white">
                              {formatDateFr(p.date)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 5 - ALBUM */}
              {activeTab === "album" && (
                <section aria-label="Album">
                  {isTabLocked("album") ? (
                    <LockedTab />
                  ) : album.length === 0 ? (
                    <EmptyState text="Aucune photo dans l album" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {album.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setAlbumIndex(idx); setLightbox(p.url || null); }}
                          className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm"
                        >
                          {p.url ? (
                            <Image src={p.url} alt={p.titre || "Photo album"} fill className="object-cover transition group-hover:scale-105" />
                          ) : null}
<span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white line-clamp-1">
                            {p.titre || `Photo ${idx + 1}`}
                          </span>
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#0D2B6B]">
                            {p.categorie === "avant" ? "Avant" : p.categorie === "apres" ? "Après" : "Pendant"}
                          </span>
                          {p.url && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleTelechargerFichier(p.url!, `photo_${p.id}.jpg`); }}
                              className="absolute top-2 left-2 rounded-full bg-white/90 p-1.5 text-[#0D2B6B] hover:bg-white"
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}


              {/* ONGLET 6 - ÉQUIPE */}
              {activeTab === "equipe" && (
                <section aria-label="Équipe">
                  {equipe.length === 0 ? (
                    <EmptyState text="Équipe non renseignée" />
                  ) : (
                    <div className="space-y-3">
                      {chef && (
                        <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#6B7280]">Chef de chantier</p>
                          <div className="flex items-center gap-3">
                            <div className="relative size-14 overflow-hidden rounded-full bg-[#E7EBF5]">
                              {chef.photo ? <Image src={chef.photo} alt={chef.nom || ""} fill className="object-cover" /> : <Users className="m-3 size-8 text-[#9CA3AF]" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-[#0D2B6B]">{chef.nom}</h3>
                              {chef.telephone && <p className="text-xs text-[#6B7280]">📞 {chef.telephone}</p>}
                            </div>
                            {chef.telephone && (
                              <a
                                href={waLink(chef.telephone)}
                                target="_blank"
                                rel="noreferrer"
                                className="grid size-10 place-items-center rounded-full bg-[#25D366] text-white"
                                aria-label="Contacter sur WhatsApp"
                              >
                                <MessageCircle size={18} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {ouvriers.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-3 shadow-sm">
                          <div className="relative size-11 overflow-hidden rounded-full bg-[#E7EBF5]">
                            {o.photo ? <Image src={o.photo} alt={o.nom || ""} fill className="object-cover" /> : <Users className="m-2.5 size-6 text-[#9CA3AF]" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-black text-[#0D2B6B]">{o.nom}</h4>
                            <p className="text-xs text-[#6B7280]">{o.role}{o.telephone ? ` · 📞 ${o.telephone}` : ""}</p>
                          </div>
                          {o.telephone && (
                            <a
                              href={waLink(o.telephone)}
                              target="_blank"
                              rel="noreferrer"
                              className="grid size-9 place-items-center rounded-full bg-[#25D366] text-white"
                              aria-label="Contacter sur WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 7 - PAIEMENTS */}
              {activeTab === "paiements" && (
                <section aria-label="Paiements">
                  {paiements.length === 0 ? (
                    <EmptyState text="Aucun paiement enregistré" />
                  ) : (
                    <div className="space-y-3">
                      {paiements.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-4 shadow-sm">
                          <div className="grid size-11 place-items-center rounded-[14px] bg-[#0D2B6B]/10 text-[#0D2B6B]">
                            <CreditCard size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#0D2B6B]">{formatFcfa(Number(p.montant) || 0)}</p>
                            <p className="text-xs text-[#6B7280]">
                              {formatDateFr(p.date)}{p.mode ? ` · ${p.mode}` : ""}{p.statut ? ` · ${p.statut}` : ""}
                            </p>
                          </div>
                          {p.statut === "paye" && <CheckCircle className="size-5 text-[#22C55E]" />}
                          {p.statut === "en_retard" && <AlertTriangle className="size-5 text-[#EF4444]" />}
                          {p.statut === "en_attente" && <Clock3 className="size-5 text-[#9CA3AF]" />}
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-[18px] bg-[#0D2B6B] p-4 text-white">
                        <span className="text-sm font-black">Total payé</span>
                        <span className="text-lg font-black">{formatFcfa(totalPaye)}</span>
                      </div>
                      <Link
                        href="/paiement"
                        className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#FF7A00,#FF9500)] py-3 text-sm font-black text-white transition active:scale-95"
                      >
                        Effectuer un paiement <ChevronRight size={16} />
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 8 - DOCUMENTS */}
              {activeTab === "documents" && (
                <section aria-label="Documents">
                  {documents.length === 0 ? (
                    <EmptyState text="Aucun document disponible" />
                  ) : (
                    <div className="space-y-3">
                      {documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-4 shadow-sm">
                          <div className="grid size-11 place-items-center rounded-[14px] bg-[#8B5CF6]/10 text-[#8B5CF6]">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#0D2B6B]">{d.nom}</p>
                            <p className="text-xs text-[#6B7280]">
                              {d.type ? `${d.type} · ` : ""}{formatDateFr(d.date)}
                            </p>
                          </div>
                          {d.url && (
                            <div className="flex gap-2">
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="grid size-9 place-items-center rounded-full bg-[#0D2B6B] text-white"
                                aria-label="Voir en ligne"
                              >
                                <Eye size={16} />
                              </a>
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="grid size-9 place-items-center rounded-full bg-[#0D2B6B] text-white"
                                aria-label="Télécharger"
                              >
                                <Download size={16} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 9 - MESSAGES */}
              {activeTab === "messages" && (
                <section aria-label="Messages">
                  {isTabLocked("messages") ? (
                    <LockedTab />
                  ) : messages.length === 0 ? (
                    <EmptyState text="Aucun message pour le moment" />
                  ) : (
                    <div className="flex h-[60vh] flex-col rounded-[20px] border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 400 }}>
                        {messages.map((m) => (
                          <div key={m.id} className={`flex ${m.role === "client" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.role === "client" ? "bg-[#0D2B6B] text-white" : "bg-[#F3F4F6] text-[#374151]"}`}>
                              <p className="text-xs font-black">{m.expediteur || messageRoleLabel(m.role)}</p>
                              <p className="mt-1 text-sm">{m.contenu}</p>
                              <p className="mt-1 text-[10px] opacity-70">{formatDateTimeFr(m.date, m.heure)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 border-t border-[#E7EBF5] p-3">
                        <input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrire un message..."
                          className="flex-1 rounded-full border border-[#E7EBF5] px-4 py-2 text-sm focus:border-[#0D2B6B] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="grid size-10 place-items-center rounded-full bg-[#0D2B6B] text-white disabled:opacity-30"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 10 - PASSEPORT */}
              {activeTab === "passeport" && (
                <section aria-label="Passeport numérique">
                  {isTabLocked("passeport") ? (
                    <LockedTab />
                  ) : (
                    <div className="space-y-4 rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                      <h2 className="text-lg font-black text-[#0D2B6B]">Passeport numérique</h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Projet</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.nom_projet || chantier?.nom || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Type</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.type || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Localisation</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{formatLocalisation(chantier?.localisation, chantier?.adresse)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#6B7280]">Budget</p>
                          <p className="text-sm font-black text-[#0D2B6B]">{chantier?.budget ? formatFcfa(chantier.budget) : "—"}</p>
                        </div>
                      </div>
                      {chantier?.materiaux && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-[#6B7280]">Matériaux</p>
                          <pre className="mt-1 rounded-[14px] bg-[#F7F9FC] p-3 text-xs text-[#374151]">{JSON.stringify(chantier.materiaux, null, 2)}</pre>
                        </div>
                      )}
                      {photos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-[#6B7280]">Photos clés</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {photos.slice(0, 6).map((p) => (
                              <div key={p.id} className="relative aspect-square overflow-hidden rounded-[14px] bg-[#E7EBF5]">
                                {p.url && <Image src={p.url} alt="Photo clé" fill className="object-cover" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {equipe.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold text-[#6B7280]">Équipe</p>
                          <ul className="mt-2 space-y-2">
                            {equipe.map((m) => (
                              <li key={m.id} className="flex items-center justify-between rounded-[14px] border border-[#E7EBF5] p-3">
                                <span className="text-sm font-black text-[#0D2B6B]">{m.nom}</span>
                                <span className="text-xs text-[#6B7280]">{m.role}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 11 - RAPPORTS */}
              {activeTab === "rapports" && (
                <section aria-label="Rapports">
                  {isTabLocked("rapports") ? (
                    <LockedTab />
                  ) : rapports.length === 0 ? (
                    <EmptyState text="Aucun rapport disponible" />
                  ) : (
                    <div className="space-y-3">
                      {rapports.map((r) => (
                        <div key={r.id} className="flex items-start gap-3 rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <div className="grid size-11 place-items-center rounded-[14px] bg-[#0B5FFF]/10 text-[#0B5FFF]">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-[#0D2B6B]">{r.titre || "Rapport"}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${r.statut === "lu" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#FEF3C7] text-[#B45309]"}`}>
                                {r.statut === "lu" ? "Lu" : "Non lu"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#6B7280]">
                              {formatDateFr(r.date)} · {r.auteur || "—"}
                            </p>
                            {r.resume && <p className="mt-2 text-sm text-[#374151]">{r.resume}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => { setLightbox(null); setAlbumIndex(null); }}
        >
          <div className="relative">
            <Image src={lightbox} alt="Photo plein écran" width={800} height={800} className="max-h-[90vh] w-auto rounded-[16px] object-contain" />
            {albumIndex !== null && album.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex - 1 + album.length) % album.length); setLightbox(album[(albumIndex - 1 + album.length) % album.length].url || null); }}
                  className="grid size-10 place-items-center rounded-full bg-white/90 text-[#0D2B6B] shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex + 1) % album.length); setLightbox(album[(albumIndex + 1) % album.length].url || null); }}
                  className="grid size-10 place-items-center rounded-full bg-white/90 text-[#0D2B6B] shadow"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setLightbox(null); setAlbumIndex(null); }}
              className="absolute -top-8 right-0 text-sm font-black text-white"
            >
              Fermer <X size={18} className="inline" />
            </button>
          </div>
        </div>
      )}

      <ChatBot />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7EBF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-stretch gap-1 p-2">
          <ActionBtn icon={Phone} label="Appeler" href={chef?.telephone ? `tel:${chef.telephone}` : "#"} color="#0B5FFF" />
          <ActionBtn icon={MessageCircle} label="Chat" href={chef?.telephone ? waLink(chef.telephone) : "#"} color="#25D366" />
          <ActionBtn icon={AlertTriangle} label="Problème" href="/support" color="#EF4444" />
          <ActionBtn icon={CalendarPlus} label="Visite" href="/nouveau-chantier" color="#FF7A00" />
        </div>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#E7EBF5] bg-white p-10 text-center">
      <p className="text-sm font-bold text-[#6B7280]">{text}</p>
    </div>
  );
}

function LockedTab() {
  return (
    <div className="rounded-[22px] border border-dashed border-[#E7EBF5] bg-[#F9FAFB] p-10 text-center">
      <p className="text-sm font-bold text-[#6B7280]">🔒 Cet onglet sera disponible une fois le chantier activé par nos experts.</p>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: typeof Phone;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") || href.startsWith("tel") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2.5 text-white transition active:scale-95"
      style={{ backgroundColor: color }}
    >
      <Icon size={18} aria-hidden />
      <span className="text-[10px] font-black leading-none">{label}</span>
    </Link>
  );
}