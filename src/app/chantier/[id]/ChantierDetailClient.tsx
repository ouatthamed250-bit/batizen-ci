"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { update } from "firebase/database";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
import { rtdbGet, rtdbGetList, rtdbSubscribeList, rtdbGetListByChild } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";
import { AffichageEquipe } from "@/components/admin/ChantierMessaging";
import EquipeHierarchiqueClient from "@/components/chantier/EquipeHierarchiqueClient";
import AvancementParEtapes from "@/components/chantier/AvancementParEtapes";
import AlbumChantier from "@/components/chantier/AlbumChantier";
import ClientRendezVous from "@/components/chantier/ClientRendezVous";
import { ref, push, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { LazySection } from "@/components/LazySection";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockedTab } from "@/components/ui/LockedTab";
import { ChantierHeader } from "./sections/ChantierHeader";
import { ChantierTabs } from "./sections/ChantierTabs";
import { ChantierPasseport } from "./sections/ChantierPasseport";
import { ChantierDocuments } from "./sections/ChantierDocuments";
import { ChantierNotes } from "./sections/ChantierNotes";
import { ChantierRapports } from "./sections/ChantierRapports";
import { ChantierLightbox } from "./sections/ChantierLightbox";
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
  statut?: string;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  delai?: string;
  date_creation?: string;
  dateActivation?: number;
  rdv_date?: string;
  localisation?: { ville?: string; commune?: string; quartier?: string; adresse?: string };
  materiaux?: Record<string, unknown>;
  superficie?: number;
  description?: string;
};

type Etape = {
  id: string; nom?: string; titre?: string; statut?: string; date?: string; description?: string; pourcentage?: number;
};

type Photo = { id: string; url?: string; date?: string; titre?: string; categorie?: string };
type Membre = { id: string; nom?: string; role?: string; telephone?: string; photo?: string; type?: string };
type Paiement = { id: string; date?: string; montant?: number; mode?: string; statut?: string; reference?: string; preuveUrl?: string; description?: string };
type PaiementV2 = { id: string; chantierId: string; clientId: string; montant: number; datePaiement: string; mode: "wave" | "orange" | "mtn" | "cash" | "autre"; statut: "en_attente" | "valide" | "rejete"; reference: string; preuveUrl: string; description: string; creePar: string; creeParRole: "admin" | "client"; validePar?: string; dateValidation?: number; dateCreation: number; actif: boolean };
type DocumentItem = { id: string; nom?: string; date?: string; type?: string; url?: string; taille?: string };
type RendezVous = { id: string; date?: string; heure?: string; lieu?: string; type?: string; statut?: string; notes?: string };
type Message = { id: string; expediteur?: string; expediteurNom?: string; expediteurRole?: "client" | "admin" | "equipe"; contenu?: string; date?: string; heure?: string; dateEnvoi?: number; photoProfil?: string; role?: string; type?: "texte" | "vocal" | "piece_jointe"; url?: string; dureeVocal?: number; nomFichier?: string; tailleFichier?: number; lu?: boolean };
type Rapport = { id: string; date?: string; titre?: string; auteur?: string; resume?: string; contenu?: string; statut?: string; url?: string; semaine?: string; dateDebut?: string; dateFin?: string; etape?: string; avancement?: number; problemes?: string; prochaine_etape?: string; commentaires?: string; medias?: Array<{ id: string; url: string; type: "photo" | "video"; legende: string; categorie: "avant" | "pendant" | "apres"; dateUpload: number }> };

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

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
    case "termine": return <CheckCircle2 className="size-5 shrink-0 text-[#22C55E]" />;
    case "en_cours": return <RefreshCw className="size-5 shrink-0 animate-spin text-[#0B5FFF]" />;
    default: return <Clock className="size-5 shrink-0 text-[#9CA3AF]" />;
  }
}

function etapeLabel(statut?: string): string {
  switch (statut) { case "termine": return "Terminé"; case "en_cours": return "En cours"; default: return "À venir"; }
}

function etapeColor(statut?: string): string {
  switch (statut) { case "termine": return "#22C55E"; case "en_cours": return "#0B5FFF"; default: return "#9CA3AF"; }
}

function rdvStatutBadge(statut?: string) {
  switch (statut) {
    case "passe": return <span className="rounded-full bg-[#9CA3AF]/10 px-2 py-0.5 text-[10px] font-black text-[#9CA3AF]">Passé</span>;
    case "annule": return <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-black text-[#EF4444]">Annulé</span>;
    default: return <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-black text-[#22C55E]">Planifié</span>;
  }
}

function messageRoleLabel(role?: string): string {
  switch (role) { case "admin": return "Admin"; case "equipe": return "Équipe"; default: return role || "Client"; }
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
  { key: "notes", label: "Notes", icon: FileDown },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "passeport", label: "Passeport", icon: BookOpen },
  { key: "rapports", label: "Rapports", icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatLocalisation(loc: Chantier["localisation"] | string | undefined | null, fallbackAdresse?: string): string {
  if (!loc) return fallbackAdresse || "—";
  if (typeof loc === "string") return loc;
  const parts: string[] = [];
  if (loc.ville) parts.push(loc.ville);
  if (loc.commune) parts.push(loc.commune);
  if (loc.quartier) parts.push(loc.quartier);
  const base = parts.join(", ");
  if (loc.adresse) return base ? `${base} - ${loc.adresse}` : loc.adresse;
  return base || fallbackAdresse || "—";
}

/* ------------------------------------------------------------------ */
/* Lazy wrappers for heavy components                                  */
/* ------------------------------------------------------------------ */

const LazySuperCalculateurSuivi = () => (
  <LazySection loader={() => import("@/components/btp/SuperCalculateur")} />
);

const LazyChatBot = () => (
  <LazySection loader={() => import("@/components/ChatBot")} />
);

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ChantierDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuthContext();
  const { database } = getFirebaseServices();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [equipe, setEquipe] = useState<Membre[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("resume");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [albumIndex, setAlbumIndex] = useState<number | null>(null);

  const [planning, setPlanning] = useState<Etape[]>([]);
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [medias, setMedias] = useState<any[]>([]);
  const [album, setAlbum] = useState<Photo[]>([]);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [ouvriersList, setOuvriersList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const docsRef = ref(database, `documents/${id}`);
    const unsubDocs = onValue(docsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const docsList = Object.entries(data).filter(([_, d]: [string, any]) => d.actif !== false).map(([docId, d]: [string, any]) => ({ id: docId, ...d })).sort((a, b) => b.dateUpload - a.dateUpload);
        setClientDocuments(docsList);
      } else { setClientDocuments([]); }
    }, (error) => { console.error("❌ Erreur lecture documents:", error); });
    return () => { unsubDocs(); };
  }, [id, database]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let unsubMessages: Unsubscribe | null = null;
    let unsubEquipes: Unsubscribe | null = null;

    async function load() {
      const [c, e, p, pa, d] = await Promise.all([
        rtdbGet<Chantier>(`chantiers/${id}`),
        rtdbGetList<Etape>(`chantiers/${id}/etapes`),
        rtdbGetList<Photo>(`chantiers/${id}/photos`),
        rtdbGetList<Paiement>(`chantiers/${id}/paiements`),
        rtdbGetList<DocumentItem>(`chantiers/${id}/documents`),
      ]);
      if (cancelled) return;
      setChantier(c); setEtapes(e); setPhotos(p); setPaiements(pa); setDocuments(d); setLoading(false);

      if (!cancelled && id) {
        const { getDatabase, query, orderByChild, equalTo, ref: dbRef } = await import("firebase/database");
        const { db: db } = getFirebaseServices();
        const [plan, med, docsFiltered, notesFiltered, rapportsFiltered] = await Promise.all([
          rtdbGetList<Etape>(`chantiers/${id}/planning`),
          rtdbGetList<any>(`chantiers/${id}/medias`),
          (async () => { const q = query(dbRef(db, 'documents'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const data = snap.val(); if (!data) return []; return Object.entries(data).filter(([_, d]: [string, any]) => d?.actif !== false).map(([docId, d]: [string, any]) => ({ id: docId, ...d })); })(),
          (async () => { const q = query(dbRef(db, 'notes'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const data = snap.val(); if (!data) return []; return Object.entries(data).filter(([_, n]: [string, any]) => n?.actif !== false).map(([noteId, n]: [string, any]) => ({ id: noteId, ...n })); })(),
          (async () => { const q = query(dbRef(db, 'rapports'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const data = snap.val(); if (!data) return []; return Object.entries(data).filter(([_, r]: [string, any]) => r?.actif !== false).map(([rapportId, r]: [string, any]) => ({ id: rapportId, ...r })); })()
        ]);
        setPlanning(plan); setMedias(med); setRapports(rapportsFiltered); setNotes(notesFiltered);
        if (docsFiltered.length > 0) setDocuments(docsFiltered);
      }
    }
    load();

    const chantierIdPourEquipe = id;
    unsubEquipes = onValue(ref(database, 'equipes'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const equipeBrute = Object.entries(data).map(([idEq, e]: [string, any]) => ({ id: idEq, ...e }));
        const equipeChantier = equipeBrute.filter(e => String(e.chantierId) === String(chantierIdPourEquipe) && e.actif === true);
        equipeChantier.sort((a: any, b: any) => {
          const aIsChef = a.fonction === "chef_de_chantier" || a.type === "chef_de_chantier" || a.type === "chef";
          const bIsChef = b.fonction === "chef_de_chantier" || b.type === "chef_de_chantier" || b.type === "chef";
          if (aIsChef && !bIsChef) return -1; if (!aIsChef && bIsChef) return 1; return 0;
        });
        setEquipe(equipeChantier);
      } else { setEquipe([]); }
    }, (error) => { console.error("❌ Erreur listener équipes:", error); });

    if (!user || !id) { console.log("⏳ Attente authentification client..."); }
    else {
      unsubMessages = onValue(ref(database, 'messages'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const msgsChantier = Object.entries(data).filter(([idMsg, m]: [string, any]) => m.chantierId === id).map(([idMsg, m]: [string, any]) => ({ id: idMsg, ...m })).sort((a: any, b: any) => a.dateEnvoi - b.dateEnvoi);
          setMessages(msgsChantier);
          msgsChantier.forEach(async (msg) => { if (msg.expediteurRole === "admin" && !msg.lu) { await update(ref(database, `messages/${msg.id}`), { lu: true, dateLecture: Date.now() }); } });
        } else { setMessages([]); }
      }, (error) => { console.error("❌ Erreur listener messages:", error); });
    }

    return () => { cancelled = true; if (unsubMessages) unsubMessages(); if (unsubEquipes) unsubEquipes(); };
  }, [id]);

  const nom = chantier?.nom_projet || chantier?.nom || "Chantier";
  const pct = Number(chantier?.progression ?? chantier?.progress ?? 0);
  const chef = equipe.find((m) => (m.type || "chef") === "chef") || equipe[0];
  const ouvriers = equipe.filter((m) => (m.type || "chef") === "ouvrier");
  const totalPaye = paiements.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

  const waLink = (tel?: string) => tel ? `https://wa.me/${tel.replace(/[^0-9]/g, "")}` : "#";

  const isTabLocked = (key: TabKey): boolean => {
    const statut = chantier?.statut;
    if (statut === "en_cours" || statut === "termine") return false;
    const allowed = ["resume", "documents"];
    return !allowed.includes(key);
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!newMessage.trim() || !id) return;
    try {
      const { database } = getFirebaseServices();
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, { chantierId: id, expediteurId: user?.uid, expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId || "admin", type: "texte", contenu: newMessage.trim(), dateEnvoi: Date.now(), lu: false });
      setNewMessage("");
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
      const { sendNotification } = await import("@/lib/notifications");
      if (chantier?.userId && chantier.userId !== user?.uid) { await sendNotification(chantier.userId, { type: "nouveau_message", chantierId: id, chantierNom: nom, message: `Nouveau message dans votre chantier "${nom}"` }); }
    } catch (err) { console.error("❌ Erreur envoi message:", err); alert("Erreur lors de l'envoi du message"); }
  }, [newMessage, id, user, chantier, nom]);

  const handleDemarrerEnregistrement = async () => { /* same as before */ try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); setMediaRecorder(recorder); const chunks: Blob[] = []; recorder.ondataavailable = (e) => { chunks.push(e.data); }; recorder.onstop = async () => { const blob = new Blob(chunks, { type: 'audio/webm' }); await handleUploadVocal(blob); stream.getTracks().forEach(track => track.stop()); }; recorder.start(); setRecording(true); } catch (error) { console.error("Erreur enregistrement:", error); alert("Impossible d'accéder au microphone."); } };
  const handleArreterEnregistrement = () => { if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); } };

  const handleUploadVocal = async (blob: Blob) => {
    setUploading(true);
    try { const file = new File([blob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' }); const url = await uploadToCloudinary(file); const dureeApprox = Math.round(blob.size / 16000); await push(ref(database, 'messages'), { chantierId: id, expediteurId: user?.uid || "client", expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId, type: "vocal", url, dureeVocal: dureeApprox, dateEnvoi: Date.now(), lu: false }); }
    catch (error) { console.error("Erreur upload vocal:", error); alert("Erreur lors de l'upload du message vocal"); }
    finally { setUploading(false); }
  };

  const handleEnvoyerPieceJointe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try { const url = await uploadToCloudinary(file); await push(ref(database, 'messages'), { chantierId: id, expediteurId: user?.uid || "client", expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId, type: "piece_jointe", url, nomFichier: file.name, tailleFichier: file.size, dateEnvoi: Date.now(), lu: false }); e.target.value = ""; }
    catch (error) { console.error("Erreur upload pièce jointe:", error); alert("Erreur lors de l'upload du fichier"); }
    finally { setUploading(false); }
  };

  const visibleTabs = (): TabKey[] => {
    const statut = chantier?.statut;
    if (statut === "en_cours" || statut === "termine") {
      if (statut === "termine") return ["resume", "album", "passeport", "documents", "rapports", "avancement", "photos", "equipe", "paiements"];
      return TABS.map(t => t.key);
    }
    return ["resume", "documents"];
  };

  const affichableTabs = visibleTabs();

  const renderStatusBanner = () => {
    const statut = chantier?.statut;
    if (statut === "en_attente") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#B45309]">⏳ Votre chantier est en attente de validation par nos experts.</p>{chantier?.rdv_date && <p className="mt-1 text-xs font-semibold text-[#B45309]">Un expert vous contactera suite à votre rendez-vous du {formatDateFr(chantier.rdv_date)}.</p>}</div>;
    if (statut === "en_cours") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#047857]">✅ Votre chantier est en cours ! Suivez l avancement en temps réel.</p></div>;
    if (statut === "termine") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#1E40AF]">🎉 Félicitations ! Votre chantier est terminé.</p></div>;
    return null;
  };

  return (
    <main className="pt-20 pb-16 px-4 min-h-screen bg-transparent">
      <ChantierHeader chantier={chantier} nom={nom} pct={pct} loading={loading} />

      <ChantierTabs tabs={TABS as any} affichableTabs={affichableTabs} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabKey)} />

      {chantier && renderStatusBanner()}

      <div className="w-full pt-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-[28px] bg-white/20" />
            <div className="h-24 rounded-[28px] bg-white/20" />
            <div className="h-24 rounded-[28px] bg-white/20" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="show" exit="exit">
              {activeTab === "resume" && (
                <section aria-label="Résumé">
                  <div className="space-y-4 w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
                    <h2 className="text-lg font-black text-[#0D2B6B]">Résumé du projet</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div><p className="text-xs font-bold text-[#6B7280]">Nom du projet</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.nom_projet || chantier?.nom || "—"}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Type</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.type || "—"}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Localisation</p><p className="text-sm font-black text-[#0D2B6B]">{formatLocalisation(chantier?.localisation, chantier?.adresse)}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Budget total</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.budget ? formatFcfa(chantier.budget) : "—"}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Plan choisi</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.plan_choisi || "—"}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Délai</p><p className="text-sm font-black text-[#0D2B6B]">{chantier?.delai || "—"}</p></div>
                      <div><p className="text-xs font-bold text-[#6B7280]">Date de création</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_creation)}</p></div>
                      {chantier?.dateActivation && <div><p className="text-xs font-bold text-[#6B7280]">Date d activation</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(new Date(chantier.dateActivation).toISOString())}</p></div>}
                      {chantier?.statut === "termine" && <div><p className="text-xs font-bold text-[#6B7280]">Date de fin</p><p className="text-sm font-black text-[#0D2B6B]">{formatDateFr(chantier?.date_fin)}</p></div>}
                      <div><p className="text-xs font-bold text-[#6B7280]">Progression globale</p><p className="text-sm font-black text-[#0D2B6B]">{pct}%</p></div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
                      {chantier?.date_debut && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-[#6B7280]">Date de début prévue</p><p className="text-sm font-black text-[var(--navy)]">{formatDateFr(chantier.date_debut)}</p></div>}
                      {chantier?.date_fin && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-bold text-[#6B7280]">Date de fin prévue</p><p className="text-sm font-black text-[var(--navy)]">{formatDateFr(chantier.date_fin)}</p></div>}
                    </div>
                  </div>
                  {chantier?.budget && <LazySuperCalculateurSuivi />}
                </section>
              )}

              {activeTab === "avancement" && (
                <section aria-label="Avancement">
                  {etapes.length === 0 ? <EmptyState text="Aucune étape renseignée" /> : (
                    <div className="relative space-y-4 pl-2">
                      {etapes.map((e, i) => (
                        <div key={e.id} className="relative rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
                          <div className="flex items-start gap-3">
                            {etapeIcon(e.statut)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2"><h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3><span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: etapeColor(e.statut) }}>{etapeLabel(e.statut)}</span></div>
                              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
                              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
                              <div className="mt-3"><ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "planning" && (
                <section aria-label="Planning">
                  {isTabLocked("planning") ? <LockedTab /> : planning.length === 0 ? <EmptyState text="Aucune planification disponible" /> : (
                    <div className="relative space-y-4 pl-2">
                      {planning.map((e, i) => (
                        <div key={e.id} className="relative rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl">
                          <div className="flex items-start gap-3">
                            {etapeIcon(e.statut)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2"><h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3><span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: etapeColor(e.statut) }}>{etapeLabel(e.statut)}</span></div>
                              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
                              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
                              <div className="mt-3"><ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "rendezvous" && <section aria-label="Rendez-vous">{isTabLocked("rendezvous") ? <LockedTab /> : <ClientRendezVous chantierId={id!} />}</section>}

              {activeTab === "photos" && (
                <section aria-label="Photos">
                  {photos.length === 0 ? <EmptyState text="Aucune photo disponible" /> : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {photos.map((p) => (
                        <button key={p.id} type="button" onClick={() => p.url && setLightbox(p.url)} className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm">
                          {p.url ? <Image src={p.url} alt="Photo chantier" fill className="object-cover transition group-hover:scale-105" /> : null}
                          {p.date && <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white">{formatDateFr(p.date)}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "album" && (
                <section aria-label="Album">
                  {isTabLocked("album") ? <LockedTab /> : medias.length === 0 ? <EmptyState text="Aucune photo dans l album" /> : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {medias.map((m, idx) => (
                        <button key={m.id} type="button" onClick={() => { setAlbumIndex(idx); setLightbox(m.url || null); }} className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm">
                          {m.url ? <Image src={m.url} alt={m.description || m.nom || "Photo album"} fill className="object-cover transition group-hover:scale-105" /> : null}
                          <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white line-clamp-1">{m.description || m.nom || `Photo ${idx + 1}`}</span>
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#0D2B6B]">{m.type === "photo" ? "Photo" : m.type === "video" ? "Vidéo" : "PDF"}</span>
                          {m.url && <button type="button" onClick={(e) => { e.stopPropagation(); handleTelechargerFichier(m.url!, `media_${m.id}`); }} className="absolute top-2 left-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition" title="Télécharger"><Download size={16} /></button>}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "equipe" && <section aria-label="Équipe"><EquipeHierarchiqueClient chantierId={id!} /></section>}

              {activeTab === "paiements" && <section aria-label="Paiements">{isTabLocked("paiements") ? <LockedTab /> : <PaiementsSection chantierId={id!} chantier={chantier!} />}</section>}

              {activeTab === "documents" && <section aria-label="Documents">{isTabLocked("documents") ? <LockedTab /> : <ChantierDocuments clientDocuments={clientDocuments} isTabLocked={false} />}</section>}

              {activeTab === "notes" && <section aria-label="Notes & Checklists">{isTabLocked("notes") ? <LockedTab /> : <ChantierNotes notes={notes} isTabLocked={false} formatDateFr={formatDateFr} />}</section>}

              {activeTab === "messages" && (
                <section aria-label="Messagerie Pro">
                  {isTabLocked("messages") ? <LockedTab /> : (
                    <div className="flex h-[80vh] flex-col w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl">
                      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 500 }}>
                        {messages.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">Aucun message. Commencez la conversation !</p> : messages.map((m) => (
                          <div key={m.id} className={`flex ${m.expediteurRole === "client" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl p-3 ${m.expediteurRole === "client" ? "bg-[#0B5FFF] text-white" : "bg-gray-100 text-gray-800"}`}>
                              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold opacity-70">{m.expediteurNom || m.expediteur}</span><span className="text-xs opacity-50">{m.dateEnvoi ? new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (m.date || "").slice(11, 16)}</span>{m.expediteurRole === "client" && m.lu && <span className="text-xs">✓✓</span>}</div>
                              {m.type === "texte" && <p className="text-sm whitespace-pre-line">{m.contenu}</p>}
                              {m.type === "vocal" && <div className="flex items-center gap-2"><audio controls src={m.url} className="h-8" /><span className="text-xs opacity-70">{m.dureeVocal}s</span></div>}
                              {m.type === "piece_jointe" && <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline">📎 {m.nomFichier} ({m.tailleFichier ? (m.tailleFichier / 1024).toFixed(1) + " KB" : "—"})</a>}
                              {(!m.type && m.contenu) && <p className="text-sm">{m.contenu}</p>}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="flex flex-col gap-2 border-t border-[#E7EBF5] p-3">
                        <div className="flex gap-2">
                          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Votre message..." disabled={uploading} className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#0B5FFF] focus:outline-none disabled:opacity-50" />
                          <button type="button" onClick={() => handleSendMessage()} disabled={!newMessage.trim() || uploading} className="px-4 py-2 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition disabled:opacity-50">Envoyer</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="hidden"><button type="submit">Hidden submit</button></form>
                        <div className="flex gap-2">
                          <button type="button" onClick={recording ? handleArreterEnregistrement : handleDemarrerEnregistrement} disabled={uploading} className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${recording ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}>{recording ? "⏹️ Arrêter" : "🎤 Vocal"}</button>
                          <label className={`flex-1 px-3 py-2 rounded-xl font-bold text-center cursor-pointer transition ${uploading ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>📎 Fichier<input type="file" onChange={handleEnvoyerPieceJointe} className="hidden" disabled={uploading} /></label>
                        </div>
                        {uploading && <p className="text-xs text-gray-500 text-center">⏳ Upload en cours...</p>}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {activeTab === "passeport" && (
                <section aria-label="Passeport numérique">
                  <ChantierPasseport chantier={chantier} photos={photos} equipe={equipe} isTabLocked={isTabLocked("passeport")} formatLocalisation={formatLocalisation} formatDateFr={formatDateFr} />
                </section>
              )}

              {activeTab === "rapports" && (
                <section aria-label="Rapports Hebdomadaires">
                  <ChantierRapports rapports={rapports} isTabLocked={isTabLocked("rapports")} />
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <ChantierLightbox lightbox={lightbox} setLightbox={setLightbox} albumIndex={albumIndex} setAlbumIndex={setAlbumIndex} medias={medias} />

      <LazyChatBot />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* PaiementsSection (composant interne)                                 */
/* ------------------------------------------------------------------ */

function PaiementsSection({ chantierId, chantier }: { chantierId: string; chantier: any }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [paiementForm, setPaiementForm] = useState({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const paiementsRef = ref(database, 'paiements');
    const unsubPaiements = onValue(paiementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paiementsChantier = Object.entries(data).filter(([id, p]: [string, any]) => p.chantierId === chantierId && p.actif).map(([id, p]: [string, any]) => ({ id, ...p })).sort((a: any, b: any) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime());
        setPaiements(paiementsChantier);
      } else { setPaiements([]); }
    });
    return () => unsubPaiements();
  }, [chantierId, database]);

  const totalPaye = paiements.filter(p => p.statut === "valide").reduce((sum, p) => sum + p.montant, 0);
  const budgetTotal = chantier?.budget || 0;
  const resteAPayer = budgetTotal - totalPaye;
  const pourcentagePaye = budgetTotal > 0 ? Math.round((totalPaye / budgetTotal) * 100) : 0;

  const handleUploadPreuve = async (file: File): Promise<string> => { setUploading(true); try { return await uploadToCloudinary(file); } catch (error) { console.error("Erreur upload preuve:", error); throw error; } finally { setUploading(false); } };

  const handleEnvoyerPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paiementForm.montant <= 0) { alert("Veuillez entrer un montant valide"); return; }
    try {
      await push(ref(database, 'paiements'), { chantierId, clientId: user?.uid, montant: paiementForm.montant, datePaiement: new Date().toISOString().split('T')[0], mode: paiementForm.mode, statut: "en_attente", reference: paiementForm.reference, preuveUrl: paiementForm.preuveUrl, description: paiementForm.description, creePar: user?.uid, creeParRole: "client", dateCreation: Date.now(), actif: true });
      alert("✅ Paiement envoyé ! L'administration va le valider.");
      setShowPaiementForm(false);
      setPaiementForm({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
    } catch (error) { console.error("Erreur envoi paiement:", error); alert("Erreur lors de l'envoi du paiement"); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-5 bg-green-500/20 backdrop-blur-xl rounded-[28px] border border-green-400/30 shadow-xl"><p className="text-xs text-green-700 mb-1">Total payé</p><p className="text-2xl font-black text-green-700">{totalPaye.toLocaleString('fr-FR')} F</p><p className="text-xs text-green-600">{pourcentagePaye}% du budget</p></div>
        <div className="p-5 bg-orange-500/20 backdrop-blur-xl rounded-[28px] border border-orange-400/30 shadow-xl"><p className="text-xs text-orange-700 mb-1">Reste à payer</p><p className="text-2xl font-black text-orange-700">{resteAPayer.toLocaleString('fr-FR')} F</p><p className="text-xs text-orange-600">sur {budgetTotal.toLocaleString('fr-FR')} F</p></div>
        <div className="p-5 bg-blue-500/20 backdrop-blur-xl rounded-[28px] border border-blue-400/30 shadow-xl"><p className="text-xs text-blue-700 mb-1">Paiements</p><p className="text-2xl font-black text-blue-700">{paiements.length}</p><p className="text-xs text-blue-600">{paiements.filter(p => p.statut === "valide").length} validés</p></div>
      </div>
      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200"><h4 className="font-bold text-[var(--navy)] mb-2">💳 Comment payer ?</h4><div className="space-y-2 text-sm text-gray-700"><p><strong>📱 Wave :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p><p><strong>📱 Orange Money :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p><p><strong>📱 MTN MoMo :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p><p className="text-xs text-gray-600 mt-2">Après l'envoi, cliquez sur "Déclarer un paiement" ci-dessous et joignez la capture d'écran.</p></div></div>
      <button onClick={() => setShowPaiementForm(!showPaiementForm)} className="w-full mb-4 px-4 py-3 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition">{showPaiementForm ? "✖️ Annuler" : "💳 Déclarer un paiement"}</button>
      {showPaiementForm && (
        <form onSubmit={handleEnvoyerPaiement} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div><label className="text-sm text-gray-700 mb-1 block">Montant (FCFA) *</label><input type="number" value={paiementForm.montant} onChange={(e) => setPaiementForm({...paiementForm, montant: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ex: 500000" required /></div>
          <div><label className="text-sm text-gray-700 mb-1 block">Mode de paiement</label><select value={paiementForm.mode} onChange={(e) => setPaiementForm({...paiementForm, mode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="wave">📱 Wave</option><option value="orange">📱 Orange Money</option><option value="mtn">📱 MTN MoMo</option><option value="autre">📌 Autre</option></select></div>
          <div><label className="text-sm text-gray-700 mb-1 block">Numéro de transaction *</label><input type="text" value={paiementForm.reference} onChange={(e) => setPaiementForm({...paiementForm, reference: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ex: WAVE123456" required /></div>
          <div><label className="text-sm text-gray-700 mb-1 block">Capture d'écran (preuve)</label><input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { const url = await handleUploadPreuve(file); setPaiementForm({...paiementForm, preuveUrl: url}); } catch (error) { alert("Erreur lors de l'upload de la capture"); } } }} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" />{paiementForm.preuveUrl && <p className="text-xs text-green-600 mt-1">✅ Capture uploadée</p>}</div>
          <div><label className="text-sm text-gray-700 mb-1 block">Description (optionnel)</label><textarea value={paiementForm.description} onChange={(e) => setPaiementForm({...paiementForm, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Acompte, solde, etc." /></div>
          <button type="submit" disabled={uploading} className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50">{uploading ? "⏳ Upload en cours..." : "✅ Envoyer le paiement"}</button>
        </form>
      )}
      {paiements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-[var(--navy)]">Historique des paiements</h4>
          {paiements.map((paiement) => (
            <div key={paiement.id} className={`p-4 rounded-xl border ${paiement.statut === "valide" ? "bg-green-50 border-green-200" : paiement.statut === "rejete" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-2xl">{paiement.mode === "wave" ? "📱" : paiement.mode === "orange" ? "📱" : paiement.mode === "mtn" ? "📱" : "📌"}</span><p className="text-2xl font-black text-[var(--navy)]">{paiement.montant?.toLocaleString('fr-FR') || 0} FCFA</p></div><p className="text-sm text-gray-700">📅 {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</p><p className="text-sm text-gray-700">Mode : {paiement.mode?.toUpperCase()}</p>{paiement.reference && <p className="text-sm text-gray-700">Réf : {paiement.reference}</p>}{paiement.description && <p className="text-sm text-gray-600 mt-1 italic">{paiement.description}</p>}</div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${paiement.statut === "valide" ? "bg-green-100 text-green-700" : paiement.statut === "rejete" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{paiement.statut === "valide" ? "✅ Validé" : paiement.statut === "rejete" ? "❌ Rejeté" : "⏳ En attente"}</span>
              </div>
              {paiement.preuveUrl && <div className="mt-2 pt-2 border-t border-gray-200"><p className="text-xs text-gray-600 mb-1">📸 Preuve de paiement :</p><img src={paiement.preuveUrl} alt="Preuve" className="max-w-full h-auto rounded-lg border border-gray-300" /></div>}
            </div>
          ))}
        </div>
      )}
      {paiements.length === 0 && !showPaiementForm && <p className="text-center text-gray-500 py-4">Aucun paiement enregistré pour ce chantier.</p>}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, href, color }: { icon: typeof Phone; label: string; href: string; color: string }) {
  return (
    <Link href={href} target={href.startsWith("http") || href.startsWith("tel") ? "_blank" : undefined} rel="noreferrer" className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2.5 text-white transition active:scale-95" style={{ backgroundColor: color }}>
      <Icon size={18} aria-hidden /><span className="text-[10px] font-black leading-none">{label}</span>
    </Link>
  );
}