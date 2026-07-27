"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { update } from "firebase/database";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageCircle, AlertTriangle, CalendarPlus, CheckCircle2,
  RefreshCw, Clock, Download, ImageOff, Image as ImageIcon, Users,
  CreditCard, FileText, ListChecks, ChevronRight, Calendar,
  CalendarClock, MessageSquare, BookOpen, BarChart3, Info,
  Send, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Eye, FileDown, CheckCircle, XCircle, Clock3,
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
import { ChantierResume } from "./sections/ChantierResume";
import { ChantierAvancement } from "./sections/ChantierAvancement";
import { ChantierPlanning } from "./sections/ChantierPlanning";
import { ChantierRendezVous } from "./sections/ChantierRendezVous";
import { ChantierPhotos } from "./sections/ChantierPhotos";
import { ChantierAlbum } from "./sections/ChantierAlbum";
import { ChantierPasseport } from "./sections/ChantierPasseport";
import { ChantierDocuments } from "./sections/ChantierDocuments";
import { ChantierNotes } from "./sections/ChantierNotes";
import { ChantierRapports } from "./sections/ChantierRapports";
import { ChantierLightbox } from "./sections/ChantierLightbox";
import { formatDateFr, formatDateTimeFr } from "@/utils/formatDate";
import { etapeIcon, etapeLabel, etapeColor, rdvStatutBadge, tabContentVariants } from "@/utils/chantier-helpers";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Chantier = {
  id?: string; nom?: string; nom_projet?: string; adresse?: string;
  date_debut?: string; date_fin?: string; progression?: number; progress?: number;
  photo?: string; image_url?: string; chef_id?: string; userId?: string;
  statut?: string; type?: string; budget?: number; plan_choisi?: string;
  delai?: string; date_creation?: string; dateActivation?: number; rdv_date?: string;
  localisation?: { ville?: string; commune?: string; quartier?: string; adresse?: string };
  materiaux?: Record<string, unknown>; superficie?: number; description?: string;
};

type Etape = { id: string; nom?: string; titre?: string; statut?: string; date?: string; description?: string; pourcentage?: number; };
type Photo = { id: string; url?: string; date?: string; titre?: string; categorie?: string };
type Membre = { id: string; nom?: string; role?: string; telephone?: string; photo?: string; type?: string };
type Paiement = { id: string; date?: string; montant?: number; mode?: string; statut?: string; reference?: string; preuveUrl?: string; description?: string };
type PaiementV2 = { id: string; chantierId: string; clientId: string; montant: number; datePaiement: string; mode: "wave"|"orange"|"mtn"|"cash"|"autre"; statut: "en_attente"|"valide"|"rejete"; reference: string; preuveUrl: string; description: string; creePar: string; creeParRole: "admin"|"client"; validePar?: string; dateValidation?: number; dateCreation: number; actif: boolean };
type DocumentItem = { id: string; nom?: string; date?: string; type?: string; url?: string; taille?: string };
type RendezVous = { id: string; date?: string; heure?: string; lieu?: string; type?: string; statut?: string; notes?: string };
type Message = { id: string; expediteur?: string; expediteurNom?: string; expediteurRole?: "client"|"admin"|"equipe"; contenu?: string; date?: string; heure?: string; dateEnvoi?: number; photoProfil?: string; role?: string; type?: "texte"|"vocal"|"piece_jointe"; url?: string; dureeVocal?: number; nomFichier?: string; tailleFichier?: number; lu?: boolean };
type Rapport = { id: string; date?: string; titre?: string; auteur?: string; resume?: string; contenu?: string; statut?: string; url?: string; semaine?: string; dateDebut?: string; dateFin?: string; etape?: string; avancement?: number; problemes?: string; prochaine_etape?: string; commentaires?: string; medias?: Array<{id: string; url: string; type: "photo"|"video"; legende: string; categorie: "avant"|"pendant"|"apres"; dateUpload: number}> };

/* ------------------------------------------------------------------ */
/* Constantes                                                         */
/* ------------------------------------------------------------------ */

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
/* Lazy wrappers                                                      */
/* ------------------------------------------------------------------ */

const LazyChatBot = () => <LazySection loader={() => import("@/components/ChatBot")} />;

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
      const r = await fetch(url); const b = await r.blob(); const du = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = du; a.download = nomFichier; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(du);
    } catch { alert("Impossible de télécharger le fichier."); }
  };

  useEffect(() => {
    if (!id) return;
    const docsRef = ref(database, `documents/${id}`);
    const unsubDocs = onValue(docsRef, (snap) => {
      const data = snap.val();
      if (data) { setClientDocuments(Object.entries(data).filter(([_, d]: [string,any]) => d.actif !== false).map(([docId, d]: [string,any]) => ({ id: docId, ...d })).sort((a:any,b:any) => b.dateUpload - a.dateUpload)); }
      else { setClientDocuments([]); }
    });
    return () => unsubDocs();
  }, [id, database]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false; let unsubMessages: Unsubscribe | null = null; let unsubEquipes: Unsubscribe | null = null;

    async function load() {
      const [c, e, p, pa, d] = await Promise.all([
        rtdbGet<Chantier>(`chantiers/${id}`), rtdbGetList<Etape>(`chantiers/${id}/etapes`),
        rtdbGetList<Photo>(`chantiers/${id}/photos`), rtdbGetList<Paiement>(`chantiers/${id}/paiements`),
        rtdbGetList<DocumentItem>(`chantiers/${id}/documents`),
      ]);
      if (cancelled) return;
      setChantier(c); setEtapes(e); setPhotos(p); setPaiements(pa); setDocuments(d); setLoading(false);
      if (!cancelled && id) {
        const { getDatabase, query, orderByChild, equalTo, ref: dbRef } = await import("firebase/database");
        const { db: db } = getFirebaseServices();
        const [plan, med, docsF, notesF, rapportsF] = await Promise.all([
          rtdbGetList<Etape>(`chantiers/${id}/planning`), rtdbGetList<any>(`chantiers/${id}/medias`),
          (async () => { const q = query(dbRef(db, 'documents'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]: [string,any]) => x?.actif !== false).map(([docId, x]: [string,any]) => ({ id: docId, ...x })) : []; })(),
          (async () => { const q = query(dbRef(db, 'notes'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]: [string,any]) => x?.actif !== false).map(([noteId, x]: [string,any]) => ({ id: noteId, ...x })) : []; })(),
          (async () => { const q = query(dbRef(db, 'rapports'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]: [string,any]) => x?.actif !== false).map(([rapportId, x]: [string,any]) => ({ id: rapportId, ...x })) : []; })(),
        ]);
        setPlanning(plan); setMedias(med); setRapports(rapportsF); setNotes(notesF);
        if (docsF.length > 0) setDocuments(docsF);
      }
    }
    load();

    unsubEquipes = onValue(ref(database, 'equipes'), (snap) => {
      const data = snap.val();
      if (data) {
        const eq = Object.entries(data).map(([idEq, e]: [string,any]) => ({ id: idEq, ...e }))
          .filter((e:any) => String(e.chantierId) === String(id) && e.actif === true);
        eq.sort((a:any,b:any) => { const aC = a.fonction === "chef_de_chantier"||a.type==="chef_de_chantier"||a.type==="chef"; const bC = b.fonction === "chef_de_chantier"||b.type==="chef_de_chantier"||b.type==="chef"; return aC && !bC ? -1 : !aC && bC ? 1 : 0; });
        setEquipe(eq);
      } else setEquipe([]);
    });

    if (user && id) {
      unsubMessages = onValue(ref(database, 'messages'), (snap) => {
        const data = snap.val();
        if (data) {
          const msgs = Object.entries(data).filter(([_, m]: [string,any]) => m.chantierId === id).map(([idMsg, m]: [string,any]) => ({ id: idMsg, ...m })).sort((a:any,b:any) => a.dateEnvoi - b.dateEnvoi);
          setMessages(msgs);
          msgs.forEach(async (m:any) => { if (m.expediteurRole === "admin" && !m.lu) await update(ref(database, `messages/${m.id}`), { lu: true, dateLecture: Date.now() }); });
        } else setMessages([]);
      });
    }

    return () => { cancelled = true; if (unsubMessages) unsubMessages(); if (unsubEquipes) unsubEquipes(); };
  }, [id]);

  const nom = chantier?.nom_projet || chantier?.nom || "Chantier";
  const pct = Number(chantier?.progression ?? chantier?.progress ?? 0);
  const totalPaye = paiements.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

  const isTabLocked = (key: TabKey): boolean => {
    const s = chantier?.statut;
    if (s === "en_cours" || s === "termine") return false;
    return !["resume", "documents"].includes(key);
  };

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!newMessage.trim() || !id) return;
    try {
      const { database } = getFirebaseServices();
      await push(ref(database, 'messages'), { chantierId: id, expediteurId: user?.uid, expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId || "admin", type: "texte", contenu: newMessage.trim(), dateEnvoi: Date.now(), lu: false });
      setNewMessage("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      const { sendNotification } = await import("@/lib/notifications");
      if (chantier?.userId && chantier.userId !== user?.uid) await sendNotification(chantier.userId, { type: "nouveau_message", chantierId: id, chantierNom: nom, message: `Nouveau message dans votre chantier "${nom}"` });
    } catch (err) { console.error("❌ Erreur envoi message:", err); alert("Erreur lors de l'envoi du message"); }
  }, [newMessage, id, user, chantier, nom]);

  const handleDemarrerEnregistrement = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(s); setMediaRecorder(r); const chunks: Blob[] = []; r.ondataavailable = (e) => chunks.push(e.data); r.onstop = async () => { const blob = new Blob(chunks, { type: 'audio/webm' }); await handleUploadVocal(blob); s.getTracks().forEach(t => t.stop()); }; r.start(); setRecording(true); } catch { alert("Impossible d'accéder au microphone."); } };
  const handleArreterEnregistrement = () => { if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); } };
  const handleUploadVocal = async (blob: Blob) => { setUploading(true); try { const file = new File([blob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' }); const url = await uploadToCloudinary(file); await push(ref(database, 'messages'), { chantierId: id, expediteurId: user?.uid || "client", expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId, type: "vocal", url, dureeVocal: Math.round(blob.size / 16000), dateEnvoi: Date.now(), lu: false }); } catch { alert("Erreur upload vocal"); } finally { setUploading(false); } };
  const handleEnvoyerPieceJointe = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const url = await uploadToCloudinary(file); await push(ref(database, 'messages'), { chantierId: id, expediteurId: user?.uid || "client", expediteurNom: user?.displayName || "Client", expediteurRole: "client", destinataireId: chantier?.userId, type: "piece_jointe", url, nomFichier: file.name, tailleFichier: file.size, dateEnvoi: Date.now(), lu: false }); e.target.value = ""; } catch { alert("Erreur upload fichier"); } finally { setUploading(false); } };

  const visibleTabs = (): TabKey[] => {
    const s = chantier?.statut;
    if (s === "en_cours" || s === "termine") return s === "termine" ? ["resume","album","passeport","documents","rapports","avancement","photos","equipe","paiements"] : TABS.map(t => t.key);
    return ["resume", "documents"];
  };

  const affichableTabs = visibleTabs();
  const renderStatusBanner = () => {
    const s = chantier?.statut;
    if (s === "en_attente") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#B45309]">⏳ En attente de validation.</p>{chantier?.rdv_date && <p className="text-xs mt-1 text-[#B45309]">RDV: {formatDateFr(chantier.rdv_date)}</p>}</div>;
    if (s === "en_cours") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#047857]">✅ En cours</p></div>;
    if (s === "termine") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#1E40AF]">🎉 Terminé</p></div>;
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
            <div className="h-24 rounded-[28px] bg-white/20" /><div className="h-24 rounded-[28px] bg-white/20" /><div className="h-24 rounded-[28px] bg-white/20" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="show" exit="exit">
              {activeTab === "resume" && <ChantierResume chantier={chantier} nom={nom} pct={pct} totalPaye={totalPaye} />}
              {activeTab === "avancement" && <ChantierAvancement etapes={etapes} />}
              {activeTab === "planning" && <ChantierPlanning planning={planning} isTabLocked={isTabLocked("planning")} />}
              {activeTab === "rendezvous" && <ChantierRendezVous id={id!} isTabLocked={isTabLocked("rendezvous")} />}
              {activeTab === "photos" && <ChantierPhotos photos={photos} setLightbox={setLightbox} />}
              {activeTab === "album" && <ChantierAlbum medias={medias} setAlbumIndex={setAlbumIndex} setLightbox={setLightbox} handleTelechargerFichier={handleTelechargerFichier} isTabLocked={isTabLocked("album")} />}
              {activeTab === "equipe" && <section aria-label="Équipe"><EquipeHierarchiqueClient chantierId={id!} /></section>}
              {activeTab === "paiements" && <section aria-label="Paiements">{isTabLocked("paiements") ? <LockedTab /> : <PaiementsSection chantierId={id!} chantier={chantier!} />}</section>}
              {activeTab === "documents" && <ChantierDocuments clientDocuments={clientDocuments} isTabLocked={isTabLocked("documents")} />}
              {activeTab === "notes" && <ChantierNotes notes={notes} isTabLocked={isTabLocked("notes")} formatDateFr={formatDateFr} />}
              {activeTab === "passeport" && <ChantierPasseport chantier={chantier} photos={photos} equipe={equipe} isTabLocked={isTabLocked("passeport")} formatLocalisation={(loc:any, fb?:string) => { if (!loc) return fb||"—"; if (typeof loc === "string") return loc; return [loc.quartier, loc.commune, loc.ville].filter(Boolean).join(", ")||fb||"—"; }} formatDateFr={formatDateFr} />}
              {activeTab === "rapports" && <ChantierRapports rapports={rapports} isTabLocked={isTabLocked("rapports")} />}

              {activeTab === "messages" && (
                <section aria-label="Messagerie Pro">
                  {isTabLocked("messages") ? <LockedTab /> : (
                    <div className="flex h-[80vh] flex-col w-full rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl shadow-xl">
                      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 500 }}>
                        {messages.length === 0 ? <p className="text-sm text-gray-500 text-center py-8">Aucun message.</p> : messages.map((m) => (
                          <div key={m.id} className={`flex ${m.expediteurRole === "client" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl p-3 ${m.expediteurRole === "client" ? "bg-[#0B5FFF] text-white" : "bg-gray-100 text-gray-800"}`}>
                              <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold opacity-70">{m.expediteurNom||m.expediteur}</span><span className="text-xs opacity-50">{m.dateEnvoi ? new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) : (m.date||"").slice(11,16)}</span>{m.expediteurRole === "client" && m.lu && <span className="text-xs">✓✓</span>}</div>
                              {m.type === "texte" && <p className="text-sm whitespace-pre-line">{m.contenu}</p>}
                              {m.type === "vocal" && <div className="flex items-center gap-2"><audio controls src={m.url} className="h-8" /><span className="text-xs opacity-70">{m.dureeVocal}s</span></div>}
                              {m.type === "piece_jointe" && <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline">📎 {m.nomFichier} ({m.tailleFichier ? (m.tailleFichier/1024).toFixed(1)+" KB" : "—"})</a>}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="flex flex-col gap-2 border-t border-[#E7EBF5] p-3">
                        <div className="flex gap-2">
                          <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Votre message..." disabled={uploading} className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-[#0B5FFF] focus:outline-none disabled:opacity-50" />
                          <button type="button" onClick={() => handleSendMessage()} disabled={!newMessage.trim()||uploading} className="px-4 py-2 bg-[#0B5FFF] text-white rounded-xl font-bold hover:bg-[#0a4fd9] transition disabled:opacity-50">Envoyer</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="hidden"><button type="submit">Hidden submit</button></form>
                        <div className="flex gap-2">
                          <button type="button" onClick={recording ? handleArreterEnregistrement : handleDemarrerEnregistrement} disabled={uploading} className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${recording ? "bg-red-500 text-white animate-pulse" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}>{recording ? "⏹️ Arrêter" : "🎤 Vocal"}</button>
                          <label className={`flex-1 px-3 py-2 rounded-xl font-bold text-center cursor-pointer transition ${uploading ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>📎 Fichier<input type="file" onChange={handleEnvoyerPieceJointe} className="hidden" disabled={uploading} /></label>
                        </div>
                        {uploading && <p className="text-xs text-gray-500 text-center">⏳ Upload...</p>}
                      </div>
                    </div>
                  )}
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
/* PaiementsSection (interne)                                         */
/* ------------------------------------------------------------------ */

function PaiementsSection({ chantierId, chantier }: { chantierId: string; chantier: any }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(database, 'paiements'), (snap) => {
      const data = snap.val();
      if (data) {
        setPaiements(Object.entries(data).filter(([_, p]: [string,any]) => p.chantierId === chantierId && p.actif).map(([id, p]: [string,any]) => ({ id, ...p })).sort((a:any,b:any) => new Date(b.datePaiement).getTime() - new Date(a.datePaiement).getTime()));
      } else setPaiements([]);
    });
    return () => unsub();
  }, [chantierId, database]);

  const totalPaye = paiements.filter((p:any) => p.statut === "valide").reduce((sum:number, p:any) => sum + p.montant, 0);
  const budgetTotal = chantier?.budget || 0;
  const resteAPayer = budgetTotal - totalPaye;
  const pctPaye = budgetTotal > 0 ? Math.round((totalPaye / budgetTotal) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.montant <= 0) { alert("Montant invalide"); return; }
    try {
      await push(ref(database, 'paiements'), { chantierId, clientId: user?.uid, montant: form.montant, datePaiement: new Date().toISOString().split('T')[0], mode: form.mode, statut: "en_attente", reference: form.reference, preuveUrl: form.preuveUrl, description: form.description, creePar: user?.uid, creeParRole: "client", dateCreation: Date.now(), actif: true });
      alert("✅ Paiement envoyé !"); setShowForm(false); setForm({ montant: 0, mode: "wave", reference: "", description: "", preuveUrl: "" });
    } catch { alert("Erreur"); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-5 bg-green-500/20 backdrop-blur-xl rounded-[28px] border border-green-400/30 shadow-xl"><p className="text-xs text-green-700 mb-1">Payé</p><p className="text-2xl font-black text-green-700">{totalPaye.toLocaleString('fr-FR')} F</p><p className="text-xs text-green-600">{pctPaye}%</p></div>
        <div className="p-5 bg-orange-500/20 backdrop-blur-xl rounded-[28px] border border-orange-400/30 shadow-xl"><p className="text-xs text-orange-700 mb-1">Reste</p><p className="text-2xl font-black text-orange-700">{resteAPayer.toLocaleString('fr-FR')} F</p></div>
        <div className="p-5 bg-blue-500/20 backdrop-blur-xl rounded-[28px] border border-blue-400/30 shadow-xl"><p className="text-xs text-blue-700 mb-1">Paiements</p><p className="text-2xl font-black text-blue-700">{paiements.length}</p></div>
      </div>
      <button onClick={() => setShowForm(!showForm)} className="w-full px-4 py-3 bg-[#0B5FFF] text-white rounded-xl font-bold">{showForm ? "✖️ Annuler" : "💳 Déclarer un paiement"}</button>
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <input type="number" value={form.montant} onChange={(e) => setForm({...form, montant: parseInt(e.target.value)||0})} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Montant FCFA" required />
          <select value={form.mode} onChange={(e) => setForm({...form, mode: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm"><option value="wave">Wave</option><option value="orange">Orange</option><option value="mtn">MTN</option><option value="autre">Autre</option></select>
          <input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Réf transaction" required />
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setUploading(true); const url = await uploadToCloudinary(f); setForm({...form, preuveUrl: url}); } catch { alert("Erreur upload"); } finally { setUploading(false); } } }} className="w-full px-3 py-2" />
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Description" />
          <button type="submit" disabled={uploading} className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold">{uploading ? "Upload..." : "✅ Envoyer"}</button>
        </form>
      )}
      {paiements.map((p:any) => (
        <div key={p.id} className={`p-4 rounded-xl border ${p.statut === "valide" ? "bg-green-50 border-green-200" : p.statut === "rejete" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
          <div className="flex justify-between"><span className="text-2xl font-black">{p.montant?.toLocaleString('fr-FR')} F</span><span className={`text-xs px-3 py-1 rounded-full font-bold ${p.statut === "valide" ? "bg-green-100 text-green-700" : p.statut === "rejete" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{p.statut === "valide" ? "✅ Validé" : p.statut === "rejete" ? "❌ Rejeté" : "⏳ En attente"}</span></div>
        </div>
      ))}
    </div>
  );
}