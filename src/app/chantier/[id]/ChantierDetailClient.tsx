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
  id: string,
  date?: string,
  montant?: number,
  mode?: string,
  statut?: string, // "valide" | "en_attente" | "rejete"
  reference?: string,
  preuveUrl?: string,
  description?: string,
};

type PaiementV2 = {
  id: string,
  chantierId: string,
  clientId: string,
  montant: number,
  datePaiement: string,
  mode: "wave" | "orange" | "mtn" | "cash" | "autre",
  statut: "en_attente" | "valide" | "rejete",
  reference: string,
  preuveUrl: string,
  description: string,
  creePar: string,
  creeParRole: "admin" | "client",
  validePar?: string,
  dateValidation?: number,
  dateCreation: number,
  actif: boolean,
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
  expediteurNom?: string;
  expediteurRole?: "client" | "admin" | "equipe";
  contenu?: string;
  date?: string;
  heure?: string;
  dateEnvoi?: number;
  photoProfil?: string;
  role?: string; // client | admin | equipe
  type?: "texte" | "vocal" | "piece_jointe";
  url?: string;
  dureeVocal?: number;
  nomFichier?: string;
  tailleFichier?: number;
  lu?: boolean;
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
  // Nouvelles propriétés V2
  semaine?: string;
  dateDebut?: string;
  dateFin?: string;
  etape?: string;
  avancement?: number;
  problemes?: string;
  prochaine_etape?: string;
  commentaires?: string;
  medias?: Array<{
    id: string;
    url: string;
    type: "photo" | "video";
    legende: string;
    categorie: "avant" | "pendant" | "apres";
    dateUpload: number;
  }>;
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
  { key: "notes", label: "Notes", icon: FileDown },
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

  // Nouvelles données
const [planning, setPlanning] = useState<Etape[]>([]);
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [medias, setMedias] = useState<any[]>([]);
   const [album, setAlbum] = useState<Photo[]>([]);
   const [rapports, setRapports] = useState<Rapport[]>([]);
  const [ouvriersList, setOuvriersList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

       // Charger les nouvelles collections en parallèle (V2)
       // Documents et notes depuis chemins globaux, filtrés par chantierId
       if (!cancelled) {
         const [plan, rdv, med, rap, allDocs, allNotes] = await Promise.all([
           rtdbGetList<Etape>(`chantiers/${id}/planning`),
           rtdbGetList<RendezVous>(`chantiers/${id}/rendezvous`),
           rtdbGetList<any>(`chantiers/${id}/medias`),
           rtdbGetList<Rapport>(`chantiers/${id}/rapports`),
           rtdbGetList<any>(`documents/`),
           rtdbGetList<any>(`notes/`),
         ]);
         setPlanning(plan);
         setRendezvous(rdv);
         setMedias(med);
         setRapports(rap);
         // Filtrer documents et notes par chantierId pour V2
         const docsFiltered = allDocs.filter((doc: any) => doc?.chantierId === id);
         const notesFiltered = allNotes.filter((note: any) => note?.chantierId === id);
         // Prioriser les documents du chemin global V2, fallback sur chantier local
         if (docsFiltered.length > 0) {
           setDocuments(docsFiltered);
         }
         setNotes(notesFiltered);
       }
    }

    load();

    // Messages en temps réel - avec vérification auth
    if (!user || !id) {
      console.log("⏳ Attente authentification client pour la messagerie...");
    } else {
      console.log("🔌 Connexion messagerie client établie pour le chantier:", id);
      unsubMessages = onValue(ref(database, 'messages'), (snapshot) => {
        console.log("📩 Snapshot messages client reçu. Existe ?", snapshot.exists());
        
        const data = snapshot.val();
        if (data) {
          const msgsChantier = Object.entries(data)
            .filter(([idMsg, m]: [string, any]) => m.chantierId === id)
            .map(([idMsg, m]: [string, any]) => ({ id: idMsg, ...m }))
            .sort((a: any, b: any) => a.dateEnvoi - b.dateEnvoi);
          
          console.log("✅ Messages client filtrés:", msgsChantier.length);
          setMessages(msgsChantier);
          
          // Marquer comme lus les messages de l'admin
          msgsChantier.forEach(async (msg) => {
            if (msg.expediteurRole === "admin" && !msg.lu) {
              await update(ref(database, `messages/${msg.id}`), {
                lu: true,
                dateLecture: Date.now()
              });
            }
          });
        } else {
          setMessages([]);
        }
      }, (error) => {
        console.error("❌ Erreur listener messages client:", error);
      });
    }

    return () => {
      console.log("🧹 Nettoyage listener messages client");
      cancelled = true;
      if (unsubMessages) unsubMessages();
    };
  }, [user, id]);

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

  // Envoyer un message - VERSION CORRIGÉE
  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    // ⚠️ CRITIQUE : Empêcher le rechargement
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMessage.trim() || !id) return;
    
    console.log("📤 Envoi message client:", newMessage);

    try {
      const { database } = getFirebaseServices();
      // ⚠️ CORRECTION : Utiliser le nœud global 'messages' au lieu de 'chantiers/${id}/messages'
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, {
        chantierId: id,
        expediteurId: user?.uid,
        expediteurNom: user?.displayName || "Client",
        expediteurRole: "client",
        destinataireId: chantier?.userId || "admin", // ⚠️ Fallback si chantier.userId est undefined
        type: "texte",
        contenu: newMessage.trim(),
        dateEnvoi: Date.now(),
        lu: false
      });
      setNewMessage("");

      console.log("✅ Message envoyé avec succès");
      
      // ⚠️ Scroll automatique vers le bas après envoi
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

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
      console.error("❌ Erreur envoi message:", err);
      alert("Erreur lors de l'envoi du message");
    }
  }, [newMessage, id, user, chantier, nom]);

  // Fonctions pour la messagerie Pro
  const handleDemarrerEnregistrement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await handleUploadVocal(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  };

  const handleArreterEnregistrement = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleUploadVocal = async (blob: Blob) => {
    setUploading(true);
    try {
      const file = new File([blob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' });
      const url = await uploadToCloudinary(file);
      const dureeApprox = Math.round(blob.size / 16000);

      await push(ref(database, 'messages'), {
        chantierId: id,
        expediteurId: user?.uid || "client",
        expediteurNom: user?.displayName || "Client",
        expediteurRole: "client",
        destinataireId: chantier?.userId,
        type: "vocal",
        url,
        dureeVocal: dureeApprox,
        dateEnvoi: Date.now(),
        lu: false
      });
    } catch (error) {
      console.error("Erreur upload vocal:", error);
      alert("Erreur lors de l'upload du message vocal");
    } finally {
      setUploading(false);
    }
  };

  const handleEnvoyerPieceJointe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);

      await push(ref(database, 'messages'), {
        chantierId: id,
        expediteurId: user?.uid || "client",
        expediteurNom: user?.displayName || "Client",
        expediteurRole: "client",
        destinataireId: chantier?.userId,
        type: "piece_jointe",
        url,
        nomFichier: file.name,
        tailleFichier: file.size,
        dateEnvoi: Date.now(),
        lu: false
      });

      e.target.value = "";
    } catch (error) {
      console.error("Erreur upload pièce jointe:", error);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploading(false);
    }
  };

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

{/* SECTION "MON ÉQUIPE" - Ouvriers affectés à ce chantier (VERSION AMÉLIORÉE) */}
                    <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <h3 className="font-black text-[var(--navy)] text-lg mb-4 flex items-center gap-2">
                        👷 Mon Équipe sur ce chantier
                      </h3>
                      {ouvriers.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-500">L'équipe sera assignée prochainement par l'administration.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ouvriers.map((membre: any) => {
                            const isChef = membre.type === "chef_de_chantier" || membre.type === "chef" || (chef && membre.id === chef.id);
                            return (
                              <div key={membre.id} className={`p-4 rounded-xl border flex items-start gap-4 transition ${
                                isChef 
                                  ? "bg-yellow-50 border-yellow-300 shadow-md" 
                                  : "bg-gray-50 border-gray-200"
                              }`}>
                                {/* Avatar / Icône */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                  isChef ? "bg-yellow-200" : "bg-blue-200"
                                }`}>
                                  {isChef ? "👑" : "👷"}
                                </div>
                                
                                {/* Infos */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-black text-base ${isChef ? "text-yellow-800" : "text-[var(--navy)]"}`}>
                                      {membre.nom}
                                    </p>
                                    {isChef && (
                                      <span className="text-[10px] uppercase tracking-wider bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black">
                                        Chef de chantier
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 font-medium">🔧 {membre.role || "Membre"}</p>
                                  {membre.telephone && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      📞 <a href={`tel:${membre.telephone}`} className="hover:text-[var(--navy)] underline">{membre.telephone}</a>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
                  ) : medias.length === 0 ? (
                    <EmptyState text="Aucune photo dans l album" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {medias.map((m, idx) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setAlbumIndex(idx); setLightbox(m.url || null); }}
                          className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm"
                        >
                          {m.url ? (
                            <Image src={m.url} alt={m.description || m.nom || "Photo album"} fill className="object-cover transition group-hover:scale-105" />
                          ) : null}
<span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white line-clamp-1">
                            {m.description || m.nom || `Photo ${idx + 1}`}
                          </span>
                          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-[#0D2B6B]">
                            {m.type === "photo" ? "Photo" : m.type === "video" ? "Vidéo" : "PDF"}
                          </span>
                          {m.url && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleTelechargerFichier(m.url!, `media_${m.id}`); }}
                              className="absolute top-2 left-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
                              title="Télécharger"
                            >
                              <Download size={16} />
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

              {/* ONGLET 7 - PAIEMENTS - NOUVELLE VERSION */}
              {activeTab === "paiements" && (
                <section aria-label="Paiements">
                  {isTabLocked("paiements") ? (
                    <LockedTab />
                  ) : (
                    <PaiementsSection chantierId={id!} chantier={chantier!} />
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
                              <button
                                onClick={() => d.url && handleTelechargerFichier(d.url, `${d.nom || 'document'}.pdf`)}
                                className="px-3 py-2 bg-[#0B5FFF] text-white rounded-xl text-xs font-bold hover:bg-[#0D2B6B] transition"
                              >
                                📥 Télécharger
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 9 - NOTES & CHECKLISTS COLLABORATIVES */}
              {activeTab === "notes" && (
                <section aria-label="Notes & Checklists">
                  {isTabLocked("notes") ? (
                    <LockedTab />
                  ) : notes.length === 0 ? (
                    <EmptyState text="Aucune note disponible pour le moment." />
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div key={n.id} className={`p-4 rounded-xl border ${
                          n.priorite === "urgente" ? "bg-red-50 border-red-200" :
                          n.priorite === "importante" ? "bg-yellow-50 border-yellow-200" :
                          "bg-green-50 border-green-200"
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">
                                  {n.type === "checklist" ? "✅" : "📝"}
                                </span>
                                <h3 className="font-bold text-[var(--navy)]">{n.titre || "Note"}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                  n.statut === "fait" ? "bg-green-100 text-green-700" :
                                  n.statut === "en_cours" ? "bg-blue-100 text-blue-700" :
                                  n.statut === "annule" ? "bg-gray-100 text-gray-700" :
                                  "bg-orange-100 text-orange-700"
                                }`}>
                                  {n.statut === "a_faire" ? "⏳ À faire" :
                                   n.statut === "en_cours" ? "🔄 En cours" :
                                   n.statut === "fait" ? "✅ Fait" : "❌ Annulé"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Par {n.creeParNom} ({n.creeParRole === "admin" ? "Admin" : "Vous"}) • {formatDateFr(n.dateCreation ? new Date(n.dateCreation).toISOString() : n.date)}
                              </p>
                            </div>
                          </div>

                          {/* Contenu pour notes simples */}
                          {n.type === "note" && n.contenu && (
                            <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">{n.contenu}</p>
                          )}

                          {/* Items pour checklists */}
                          {n.type === "checklist" && n.items && n.items.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {n.items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-2">
                                  <input 
                                    type="checkbox"
                                    checked={item.coche}
                                    readOnly
                                    className="w-4 h-4"
                                  />
                                  <span className={`text-sm ${item.coche ? "text-gray-500 line-through" : "text-gray-800"}`}>
                                    {item.texte}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Date de rappel */}
                          {n.dateRappel && (
                            <p className="text-xs text-gray-600 mt-2">
                              📅 Rappel : {new Date(n.dateRappel).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 10 - MESSAGERIE PRO */}
              {activeTab === "messages" && (
                <section aria-label="Messagerie Pro">
                  {isTabLocked("messages") ? (
                    <LockedTab />
                  ) : (
                    <div className="flex h-[80vh] flex-col rounded-[20px] border border-[#E7EBF5] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                      {/* Zone de messages */}
                      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 500 }}>
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">Aucun message. Commencez la conversation !</p>
                        ) : (
                          messages.map((m) => (
                            <div key={m.id} className={`flex ${m.expediteurRole === "client" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[70%] rounded-2xl p-3 ${
                                m.expediteurRole === "client" 
                                  ? "bg-[#0B5FFF] text-white" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold opacity-70">{m.expediteurNom || m.expediteur}</span>
<span className="text-xs opacity-50">
                                    {m.dateEnvoi ? new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : (m.date || "").slice(11, 16)}
                                  </span>
                                  {m.expediteurRole === "client" && m.lu && (
                                    <span className="text-xs">✓✓</span>
                                  )}
                                </div>

                                {m.type === "texte" && (
                                  <p className="text-sm whitespace-pre-line">{m.contenu}</p>
                                )}

                                {m.type === "vocal" && (
                                  <div className="flex items-center gap-2">
                                    <audio controls src={m.url} className="h-8" />
                                    <span className="text-xs opacity-70">{m.dureeVocal}s</span>
                                  </div>
                                )}

                                {m.type === "piece_jointe" && (
                                  <a 
                                    href={m.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm underline"
                                  >
📎 {m.nomFichier} ({m.tailleFichier ? (m.tailleFichier / 1024).toFixed(1) + " KB" : "—"})
                                  </a>
                                )}

                                {/* Fallback pour les anciens messages */}
                                {(!m.type && m.contenu) && (
                                  <p className="text-sm">{m.contenu}</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Zone de saisie */}
                      <div className="flex flex-col gap-2 border-t border-[#E7EBF5] p-3">
                        <div className="flex gap-2">
                          <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Votre message..."
                            disabled={uploading}
                            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#0B5FFF] focus:outline-none disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendMessage()}
                            disabled={!newMessage.trim() || uploading}
                            className="px-4 py-2 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition disabled:opacity-50"
                          >
                            Envoyer
                          </button>
                        </div>

                        {/* Scroll automatique après chargement des messages */}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="hidden">
                          <button type="submit">Hidden submit</button>
                        </form>

                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={recording ? handleArreterEnregistrement : handleDemarrerEnregistrement}
                            disabled={uploading}
                            className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${
                              recording 
                                ? "bg-red-500 text-white animate-pulse" 
                                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            }`}
                          >
                            {recording ? "⏹️ Arrêter" : "🎤 Vocal"}
                          </button>

                          <label className={`flex-1 px-3 py-2 rounded-xl font-bold text-center cursor-pointer transition ${
                            uploading 
                              ? "bg-gray-100 text-gray-400" 
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}>
                            📎 Fichier
                            <input 
                              type="file"
                              onChange={handleEnvoyerPieceJointe}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        </div>

                        {uploading && (
                          <p className="text-xs text-gray-500 text-center">⏳ Upload en cours...</p>
                        )}
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

              {/* ONGLET 11 - RAPPORTS HEBDOMADAIRES */}
              {activeTab === "rapports" && (
                <section aria-label="Rapports Hebdomadaires">
                  {isTabLocked("rapports") ? (
                    <LockedTab />
                  ) : rapports.length === 0 ? (
                    <EmptyState text="Aucun rapport disponible pour le moment. L'administration en créera bientôt." />
                  ) : (
                    <div className="space-y-4">
                      {rapports.map((r) => (
                        <div key={r.id} className="rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          {/* En-tête du rapport */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-[#6B7280] font-bold">
                                {r.semaine} ({r.dateDebut} → {r.dateFin})
                              </p>
                              <p className="text-sm font-bold text-[#0D2B6B] mt-1">
                                Étape : {r.etape ? r.etape.charAt(0).toUpperCase() + r.etape.slice(1) : "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-[#0D2B6B]">{r.avancement || 0}%</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                r.statut === "dans_delais" ? "bg-green-100 text-green-700" :
                                r.statut === "retard" ? "bg-orange-100 text-orange-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {r.statut === "dans_delais" ? "🟢 Dans les délais" :
                                 r.statut === "retard" ? "🟠 Retard" : "🔵 En avance"}
                              </span>
                            </div>
                          </div>

                          {/* Commentaires */}
                          <div className="mb-3">
                            <p className="text-xs text-[#6B7280] font-bold mb-1">Commentaires :</p>
                            <p className="text-sm text-[#374151] whitespace-pre-line">{r.commentaires}</p>
                          </div>

                          {/* Problèmes */}
                          {r.problemes && (
                            <div className="mb-3">
                              <p className="text-xs text-[#6B7280] font-bold mb-1">Problèmes :</p>
                              <p className="text-sm text-[#374151]">{r.problemes}</p>
                            </div>
                          )}

                          {/* Prochaine étape */}
                          {r.prochaine_etape && (
                            <div className="mb-3">
                              <p className="text-xs text-[#6B7280] font-bold mb-1">Prochaine étape :</p>
                              <p className="text-sm text-[#374151]">{r.prochaine_etape}</p>
                            </div>
                          )}

                          {/* Galerie médias du rapport */}
                          {r.medias && r.medias.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-[#6B7280] font-bold mb-2">📸 Médias ({r.medias.length})</p>
                              <div className="grid grid-cols-3 gap-2">
                                {r.medias.map((media: any) => (
                                  <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#E7EBF5]">
                                    {media.type === "photo" ? (
                                      <Image src={media.url} alt={media.legende || "Photo"} fill className="object-cover" />
                                    ) : (
                                      <video src={media.url} controls className="w-full h-full object-cover" />
                                    )}
                                    {media.legende && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                                        {media.legende}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
            {albumIndex !== null && medias.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex - 1 + medias.length) % medias.length); setLightbox(medias[(albumIndex - 1 + medias.length) % medias.length].url || null); }}
                  className="grid size-10 place-items-center rounded-full bg-white/90 text-[#0D2B6B] shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAlbumIndex((albumIndex + 1) % medias.length); setLightbox(medias[(albumIndex + 1) % medias.length].url || null); }}
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

function PaiementsSection({ chantierId, chantier }: { chantierId: string; chantier: Chantier }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    montant: 0,
    mode: "wave",
    reference: "",
    description: "",
    preuveUrl: ""
  });
  const [uploading, setUploading] = useState(false);

  // Listener pour les paiements V2
  useEffect(() => {
    const paiementsRef = ref(database, 'paiements');
    const unsubPaiements = onValue(paiementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paiementsChantier = Object.entries(data)
          .filter(([id, p]: [string, any]) => p.chantierId === chantierId && p.actif)
          .map(([id, p]: [string, any]) => ({ id, ...p }))
          .sort((a: any, b: any) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime());
        setPaiements(paiementsChantier);
      } else {
        setPaiements([]);
      }
    });
    return () => unsubPaiements();
  }, [chantierId, database]);

  // Calculs financiers
  const totalPaye = paiements
    .filter(p => p.statut === "valide")
    .reduce((sum, p) => sum + p.montant, 0);
  
  const budgetTotal = chantier?.budget || 0;
  const resteAPayer = budgetTotal - totalPaye;
  const pourcentagePaye = budgetTotal > 0 ? Math.round((totalPaye / budgetTotal) * 100) : 0;

  // Upload preuve vers Cloudinary
  const handleUploadPreuve = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      return url;
    } catch (error) {
      console.error("Erreur upload preuve:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Envoyer un paiement (Client)
  const handleEnvoyerPaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paiementForm.montant <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    try {
      await push(ref(database, 'paiements'), {
        chantierId,
        clientId: user?.uid,
        montant: paiementForm.montant,
        datePaiement: new Date().toISOString().split('T')[0],
        mode: paiementForm.mode,
        statut: "en_attente",
        reference: paiementForm.reference,
        preuveUrl: paiementForm.preuveUrl,
        description: paiementForm.description,
        creePar: user?.uid,
        creeParRole: "client",
        dateCreation: Date.now(),
        actif: true
      });

      alert("✅ Paiement envoyé ! L'administration va le valider.");
      setShowPaiementForm(false);
      setPaiementForm({
        montant: 0,
        mode: "wave",
        reference: "",
        description: "",
        preuveUrl: ""
      });
    } catch (error) {
      console.error("Erreur envoi paiement:", error);
      alert("Erreur lors de l'envoi du paiement");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tableau de bord financier */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 mb-1">Total payé</p>
          <p className="text-2xl font-black text-green-700">{totalPaye.toLocaleString('fr-FR')} F</p>
          <p className="text-xs text-green-600">{pourcentagePaye}% du budget</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-xs text-orange-700 mb-1">Reste à payer</p>
          <p className="text-2xl font-black text-orange-700">{resteAPayer.toLocaleString('fr-FR')} F</p>
          <p className="text-xs text-orange-600">sur {budgetTotal.toLocaleString('fr-FR')} F</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Paiements</p>
          <p className="text-2xl font-black text-blue-700">{paiements.length}</p>
          <p className="text-xs text-blue-600">{paiements.filter(p => p.statut === "valide").length} validés</p>
        </div>
      </div>

      {/* Instructions de paiement */}
      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-bold text-[var(--navy)] mb-2">💳 Comment payer ?</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>📱 Wave :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p>
          <p><strong>📱 Orange Money :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p>
          <p><strong>📱 MTN MoMo :</strong> Envoyez au numéro <strong>+225 XX XX XX XX XX</strong></p>
          <p className="text-xs text-gray-600 mt-2">
            Après l'envoi, cliquez sur "Déclarer un paiement" ci-dessous et joignez la capture d'écran.
          </p>
        </div>
      </div>

      {/* Bouton déclarer paiement */}
      <button 
        onClick={() => setShowPaiementForm(!showPaiementForm)}
        className="w-full mb-4 px-4 py-3 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition"
      >
        {showPaiementForm ? "✖️ Annuler" : "💳 Déclarer un paiement"}
      </button>

      {/* Formulaire de déclaration */}
      {showPaiementForm && (
        <form onSubmit={handleEnvoyerPaiement} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Montant (FCFA) *</label>
            <input 
              type="number"
              value={paiementForm.montant}
              onChange={(e) => setPaiementForm({...paiementForm, montant: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              placeholder="Ex: 500000"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Mode de paiement</label>
            <select 
              value={paiementForm.mode}
              onChange={(e) => setPaiementForm({...paiementForm, mode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            >
              <option value="wave">📱 Wave</option>
              <option value="orange">📱 Orange Money</option>
              <option value="mtn">📱 MTN MoMo</option>
              <option value="autre">📌 Autre</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Numéro de transaction *</label>
            <input 
              type="text"
              value={paiementForm.reference}
              onChange={(e) => setPaiementForm({...paiementForm, reference: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              placeholder="Ex: WAVE123456"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Capture d'écran (preuve)</label>
            <input 
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const url = await handleUploadPreuve(file);
                    setPaiementForm({...paiementForm, preuveUrl: url});
                  } catch (error) {
                    alert("Erreur lors de l'upload de la capture");
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
            {paiementForm.preuveUrl && (
              <p className="text-xs text-green-600 mt-1">✅ Capture uploadée</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Description (optionnel)</label>
            <textarea 
              value={paiementForm.description}
              onChange={(e) => setPaiementForm({...paiementForm, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              placeholder="Acompte, solde, etc."
            />
          </div>

          <button 
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50"
          >
            {uploading ? "⏳ Upload en cours..." : "✅ Envoyer le paiement"}
          </button>
        </form>
      )}

      {/* Liste des paiements */}
      {paiements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-[var(--navy)]">Historique des paiements</h4>
          {paiements.map((paiement) => (
            <div 
              key={paiement.id}
              className={`p-4 rounded-xl border ${
                paiement.statut === "valide" ? "bg-green-50 border-green-200" :
                paiement.statut === "rejete" ? "bg-red-50 border-red-200" :
                "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {paiement.mode === "wave" ? "📱" :
                       paiement.mode === "orange" ? "📱" :
                       paiement.mode === "mtn" ? "📱" : "📌"}
                    </span>
                    <p className="text-2xl font-black text-[var(--navy)]">
                      {paiement.montant?.toLocaleString('fr-FR') || 0} FCFA
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    📅 {new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-700">Mode : {paiement.mode?.toUpperCase()}</p>
                  {paiement.reference && (
                    <p className="text-sm text-gray-700">Réf : {paiement.reference}</p>
                  )}
                  {paiement.description && (
                    <p className="text-sm text-gray-600 mt-1 italic">{paiement.description}</p>
                  )}
                </div>

                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  paiement.statut === "valide" ? "bg-green-100 text-green-700" :
                  paiement.statut === "rejete" ? "bg-red-100 text-red-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {paiement.statut === "valide" ? "✅ Validé" :
                   paiement.statut === "rejete" ? "❌ Rejeté" : "⏳ En attente"}
                </span>
              </div>

              {/* Afficher la preuve si disponible */}
              {paiement.preuveUrl && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">📸 Preuve de paiement :</p>
                  <img 
                    src={paiement.preuveUrl} 
                    alt="Preuve" 
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {paiements.length === 0 && !showPaiementForm && (
        <p className="text-center text-gray-500 py-4">Aucun paiement enregistré pour ce chantier.</p>
      )}
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
