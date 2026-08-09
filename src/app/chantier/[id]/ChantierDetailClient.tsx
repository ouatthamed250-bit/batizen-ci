"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ListChecks, Calendar, CalendarClock, ImageOff, Image as ImageIcon, Users, CreditCard, FileText, FileDown, MessageSquare, BookOpen, BarChart3 } from "lucide-react";
import { update } from "firebase/database";
import { ref, onValue, query, orderByChild, equalTo, type Unsubscribe } from "firebase/database";
import { useAuthContext } from "@/contexts/AuthContext";
import { rtdbGet, rtdbGetList } from "@/lib/rtdb";
import { getFirebaseServices } from "@/lib/firebase";
import { formatFcfa } from "@/utils/currency";
import { formatDateFr } from "@/utils/formatDate";
import { tabContentVariants } from "@/utils/chantier-helpers";
import { LazySection } from "@/components/LazySection";
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
import { ChantierPaiementsSection } from "./sections/ChantierPaiementsSection";
import { ChantierMessagerie } from "./sections/ChantierMessagerie";
import EquipeHierarchiqueClient from "@/components/chantier/EquipeHierarchiqueClient";
import { EstimateurChantier } from "@/components/chantier/EstimateurChantier";

const TABS = [
  { key: "resume", label: "Résumé", icon: Info }, { key: "avancement", label: "Avancement", icon: ListChecks },
  { key: "planning", label: "Planning", icon: Calendar }, { key: "rendezvous", label: "Rendez-vous", icon: CalendarClock },
  { key: "photos", label: "Photos", icon: ImageOff }, { key: "album", label: "Album", icon: ImageIcon },
  { key: "equipe", label: "Équipe", icon: Users }, { key: "paiements", label: "Paiements", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FileText }, { key: "notes", label: "Notes", icon: FileDown },
  { key: "messages", label: "Messages", icon: MessageSquare }, { key: "passeport", label: "Passeport", icon: BookOpen },
  { key: "rapports", label: "Rapports", icon: BarChart3 },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const LazyChatBot = () => <LazySection loader={() => import("@/components/ChatBot")} />;

export default function ChantierDetailClient() {
  const params = useParams<{ id: string }>(); const id = params?.id;
  const { user } = useAuthContext(); const { database } = getFirebaseServices();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<any>(null);
  const [etapes, setEtapes] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("resume");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [albumIndex, setAlbumIndex] = useState<number | null>(null);
  const [planning, setPlanning] = useState<any[]>([]);
  const [rendezvous, setRendezvous] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [medias, setMedias] = useState<any[]>([]);
  const [album, setAlbum] = useState<any[]>([]);
  const [rapports, setRapports] = useState<any[]>([]);
  const [ouvriersList, setOuvriersList] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleTelechargerFichier = async (url: string, nomFichier: string) => {
    try { const r = await fetch(url); const b = await r.blob(); const du = URL.createObjectURL(b); const a = document.createElement('a'); a.href = du; a.download = nomFichier; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(du); } catch { alert("Erreur téléchargement"); }
  };

  useEffect(() => {
    if (!id) return; let cancelled = false; let usMsg: Unsubscribe|null=null; let usEq: Unsubscribe|null=null; let usEtapes: Unsubscribe|null=null; let usDocs: Unsubscribe|null=null;
    async function load() {
      const [c,e,p,pa] = await Promise.all([rtdbGet<any>(`chantiers/${id}`), rtdbGetList<any>(`chantiers/${id}/etapes`), rtdbGetList<any>(`chantiers/${id}/photos`), rtdbGetList<any>(`chantiers/${id}/paiements`)]);
      if (cancelled) return; setChantier(c); setEtapes(e); setPhotos(p); setPaiements(pa); setLoading(false);
      if (!cancelled && id) {
        const { getDatabase, query, orderByChild, equalTo, ref: dbRef } = await import("firebase/database"); const { db: db } = getFirebaseServices();
        const [plan, med, notesF, rapportsF, paiementsF] = await Promise.all([
          rtdbGetList<any>(`chantiers/${id}/planning`), rtdbGetList<any>(`chantiers/${id}/medias`),
          (async () => { const q = query(dbRef(db, 'notes'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]:[string,any])=>x?.actif).map(([noteId, x]:[string,any])=>({id:noteId,...x})) : []; })(),
          (async () => { const q = query(dbRef(db, 'rapports'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]:[string,any])=>x?.actif).map(([rId, x]:[string,any])=>({id:rId,...x})) : []; })(),
          (async () => { const q = query(dbRef(db, 'paiements'), orderByChild("chantierId"), equalTo(String(id))); const snap = await (await import("firebase/database")).get(q); const d = snap.val(); return d ? Object.entries(d).filter(([_, x]:[string,any])=>x?.actif).map(([payId, x]:[string,any])=>({id:payId,...x})) : []; })(),
        ]);
        setPlanning(plan); setMedias(med); setRapports(rapportsF); setNotes(notesF); if (paiementsF.length > 0) setPaiements(paiementsF);
      }
    }
    load();
    usEq = onValue(ref(database, 'equipes'), (snap) => { const d = snap.val(); if (d) { const eq = Object.entries(d).map(([idEq, e]:[string,any])=>({id:idEq,...e})).filter((e:any)=>String(e.chantierId)===String(id)&&e.actif); eq.sort((a:any,b:any)=>(a.foncion==="chef"?-1:1)); setEquipe(eq); } else setEquipe([]); });
    usEtapes = onValue(ref(database, `chantiers/${id}/etapes`), (snap) => { const d = snap.val(); setEtapes(Array.isArray(d) ? d : (d ? Object.values(d) : [])); });
    usDocs = onValue(query(ref(database, 'documents'), orderByChild('chantierId'), equalTo(String(id))), (snap) => { const d = snap.val(); setDocuments(d ? Object.entries(d).filter(([_, x]:[string,any])=>x?.actif).map(([docId, x]:[string,any])=>({id:docId,...x})) : []); });
    if (user && id) {
      usMsg = onValue(query(ref(database, 'messages'), orderByChild('chantierId'), equalTo(String(id))), (snap) => { const d = snap.val(); if (d) { const msgs = Object.entries(d).map(([idMsg, m]:[string,any])=>({id:idMsg,...m})).sort((a:any,b:any)=>a.dateEnvoi-b.dateEnvoi); setMessages(msgs); msgs.forEach(async (m:any)=>{if (m.expediteurRole==="admin"&&!m.lu) await update(ref(database,`messages/${m.id}`),{lu:true,dateLecture:Date.now()});}); } else setMessages([]); });
    }
    return () => { cancelled = true; if (usMsg) usMsg(); if (usEq) usEq(); if (usEtapes) usEtapes(); if (usDocs) usDocs(); };
  }, [id, user?.uid]);

  const nom = chantier?.nom_projet || chantier?.nom || "Chantier";
  const pct = Number(chantier?.progression ?? chantier?.progress ?? 0);
  const totalPaye = paiements.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);
  const isTabLocked = (key: TabKey): boolean => { const s = chantier?.statut; if (s === "en_cours" || s === "termine") return false; return !["resume", "documents"].includes(key); };
  const affichableTabs = ((): TabKey[] => { const s = chantier?.statut; if (s === "en_cours" || s === "termine") return s === "termine" ? ["resume","album","passeport","documents","rapports","avancement","photos","equipe","paiements"] as TabKey[] : TABS.map(t=>t.key); return ["resume", "documents"] as TabKey[]; })();

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); } if (!newMessage.trim()||!id) return;
    try { const { database } = getFirebaseServices(); const { push } = await import("firebase/database"); await push(ref(database,'messages'),{chantierId:id,expediteurId:user?.uid,expediteurNom:user?.displayName||"Client",expediteurRole:"client",destinataireId:chantier?.userId||"admin",type:"texte",contenu:newMessage.trim(),dateEnvoi:Date.now(),lu:false}); setNewMessage(""); setTimeout(()=>messagesEndRef.current?.scrollIntoView({behavior:"smooth"}),100); const { sendNotification } = await import("@/lib/notifications"); if (chantier?.userId && chantier.userId!==user?.uid) await sendNotification(chantier.userId,{type:"nouveau_message",chantierId:id,chantierNom:nom,message:`Nouveau message dans votre chantier "${nom}"`}); } catch { alert("Erreur envoi message"); }
  }, [newMessage, id, user, chantier, nom]);
  const handleDemarrerEnregistrement = async () => { try { const s = await navigator.mediaDevices.getUserMedia({audio:true}); const r = new MediaRecorder(s); setMediaRecorder(r); const chunks: Blob[] = []; r.ondataavailable=(e)=>chunks.push(e.data); r.onstop=async()=>{const blob=new Blob(chunks,{type:'audio/webm'}); await handleUploadVocal(blob); s.getTracks().forEach(t=>t.stop());}; r.start(); setRecording(true); } catch { alert("Erreur micro"); } };
  const handleArreterEnregistrement = () => { if (mediaRecorder && recording) { mediaRecorder.stop(); setRecording(false); } };
  const handleUploadVocal = async (blob: Blob) => { setUploading(true); try { const { push } = await import("firebase/database"); const file = new File([blob],`vocal_${Date.now()}.webm`,{type:'audio/webm'}); const url = (await import("@/lib/cloudinary")).uploadToCloudinary(file); await push(ref(database,'messages'),{chantierId:id,expediteurId:user?.uid||"client",expediteurNom:user?.displayName||"Client",expediteurRole:"client",destinataireId:chantier?.userId,type:"vocal",url,dureeVocal:Math.round(blob.size/16000),dateEnvoi:Date.now(),lu:false}); } catch { alert("Erreur upload vocal"); } finally { setUploading(false); } };
  const handleEnvoyerPieceJointe = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const { push } = await import("firebase/database"); const url = (await import("@/lib/cloudinary")).uploadToCloudinary(file); await push(ref(database,'messages'),{chantierId:id,expediteurId:user?.uid||"client",expediteurNom:user?.displayName||"Client",expediteurRole:"client",destinataireId:chantier?.userId,type:"piece_jointe",url,nomFichier:file.name,tailleFichier:file.size,dateEnvoi:Date.now(),lu:false}); e.target.value=""; } catch { alert("Erreur upload"); } finally { setUploading(false); } };

  const renderStatusBanner = () => {
    const s = chantier?.statut;
    if (s === "en_attente") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#B45309]">⏳ En attente de validation.</p>{chantier?.rdv_date && <p className="text-xs mt-1 text-[#B45309]">RDV: {formatDateFr(chantier.rdv_date)}</p>}</div>;
    if (s === "en_cours") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#047857]">✅ En cours</p></div>;
    if (s === "termine") return <div className="mb-4 rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-xl"><p className="text-sm font-black text-[#1E40AF]">🎉 Terminé</p></div>;
    return null;
  };

  return (
    <>
      <div className="-mx-2">
        <ChantierHeader chantier={chantier} nom={nom} pct={pct} loading={loading} />
      </div>
      <main className="pt-4 pb-16 px-4 min-h-screen bg-transparent">
      <ChantierTabs tabs={TABS as any} affichableTabs={affichableTabs} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabKey)} />
      {chantier && renderStatusBanner()}
      <div className="w-full pt-5">
        {loading ? (
          <div className="animate-pulse space-y-3"><div className="h-24 rounded-[28px] bg-white/20" /><div className="h-24 rounded-[28px] bg-white/20" /><div className="h-24 rounded-[28px] bg-white/20" /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="show" exit="exit">
              {activeTab === "resume" && <ChantierResume chantier={chantier} nom={nom} pct={pct} totalPaye={totalPaye} />}
              {activeTab === "resume" && chantier && (
                <EstimateurChantier surface={chantier.surface || chantier.surface_terrain || chantier.surface_construite} type={chantier.type} />
              )}
              {activeTab === "avancement" && <ChantierAvancement etapes={etapes} />}
              {activeTab === "planning" && <ChantierPlanning planning={planning} isTabLocked={isTabLocked("planning")} />}
              {activeTab === "rendezvous" && <ChantierRendezVous id={id!} isTabLocked={isTabLocked("rendezvous")} />}
              {activeTab === "photos" && <ChantierPhotos photos={photos} setLightbox={setLightbox} />}
              {activeTab === "album" && <ChantierAlbum medias={medias} setAlbumIndex={setAlbumIndex} setLightbox={setLightbox} handleTelechargerFichier={handleTelechargerFichier} isTabLocked={isTabLocked("album")} />}
              {activeTab === "equipe" && <EquipeHierarchiqueClient chantierId={id!} />}
              {activeTab === "paiements" && <ChantierPaiementsSection chantierId={id!} chantier={chantier!} />}
              {activeTab === "documents" && <ChantierDocuments clientDocuments={documents} isTabLocked={isTabLocked("documents")} />}
              {activeTab === "notes" && <ChantierNotes notes={notes} isTabLocked={isTabLocked("notes")} formatDateFr={formatDateFr} />}
              {activeTab === "passeport" && <ChantierPasseport chantier={chantier} photos={photos} equipe={equipe} isTabLocked={isTabLocked("passeport")} formatLocalisation={(loc:any, fb?:string)=>{if(!loc)return fb||"—";if(typeof loc==="string")return loc;return[loc.quartier,loc.commune,loc.ville].filter(Boolean).join(", ")||fb||"—";}} formatDateFr={formatDateFr} />}
              {activeTab === "rapports" && <ChantierRapports rapports={rapports} isTabLocked={isTabLocked("rapports")} />}
              {activeTab === "messages" && <ChantierMessagerie messages={messages} newMessage={newMessage} setNewMessage={setNewMessage} uploading={uploading} recording={recording} isTabLocked={isTabLocked("messages")} onSendMessage={handleSendMessage} onStartRecording={handleDemarrerEnregistrement} onStopRecording={handleArreterEnregistrement} onFileUpload={handleEnvoyerPieceJointe} messagesEndRef={messagesEndRef} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <ChantierLightbox lightbox={lightbox} setLightbox={setLightbox} albumIndex={albumIndex} setAlbumIndex={setAlbumIndex} medias={medias} />
      <LazyChatBot />
      </main>
    </>
  );
}
