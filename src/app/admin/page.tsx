"use client";

import { Suspense, useEffect, useState, type ReactNode, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Pencil,
  Ban,
  Check,
  X,
  CalendarClock,
  Plus,
  Trash2,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { rtdbGetList, rtdbGet, rtdbSet } from "@/lib/rtdb";
import { subscribeToAdminNotifications, markAsRead, getNotificationIcon, formatNotificationDate, type Notification } from "@/lib/notifications";
import { useAuthContext } from "@/contexts/AuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, push, set, onValue } from "firebase/database";

type Client = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  statut?: string;
};
type Chantier = {
  id: string;
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  adresse?: string;
  progression?: number;
  progress?: number;
  statut?: string;
  date_fin?: string;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  date_soumission?: string;
  surface_terrain?: number;
  surface_construite?: number;
  niveaux?: number;
  chambres?: number;
  salles_de_bain?: number;
  localisation?: string;
  type_terrain?: string;
  apport_personnel?: number;
  mode_financement?: string;
  dateActivation?: number;
  activePar?: string;
  rdv_lieu?: string;
  rdv_date?: string;
  rdv_heure?: string;
  rdv_commentaire?: string;
  client_nom?: string;
  client_email?: string;
  client_telephone?: string;
};
type Ouvrier = { id: string; nom?: string; role?: string; telephone?: string; chantier_affecte?: string; };
type RDV = { id: string; client?: string; type?: string; date?: string; lieu?: string; statut?: string; };
type Materiau = { id: string; nom?: string; categorie?: string; prix?: number; stock?: number; };
type Promo = { id: string; titre?: string; description?: string; image_url?: string; reduction?: number; date_debut?: string; date_fin?: string; active?: boolean; };
type Partenaire = { id: string; nom?: string; logo?: string; description?: string; statut?: "actif" | "bientot_disponible"; };

const COLORS = ["#FF7A00", "#0B5FFF", "#22C55E", "#8B5CF6", "#EC4899", "#F59E0B"];

function AdminContent() {
  const params = useSearchParams();
  const section = params.get("section") || "clients";
  const { user, loading: authLoading } = useAuthContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [vueClient, setVueClient] = useState<string | null>(null);

  if (authLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center"><p className="text-white">Chargement...</p></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4"><div className="text-center"><h1 className="text-2xl font-bold text-red-600">Accès refusé</h1><p className="mt-4 text-white/60">Vous devez être administrateur.</p></div></div>;

  useEffect(() => {
    console.log("🟢 [ADMIN] Démarrage du listener chantiers...");
    const db = getDatabase();

    // Chantiers - Lecture simplifiée sans filtre pour débogage
    const chantiersRef = dbRef(db, 'chantiers');
    const unsubChantiers = onValue(chantiersRef, (snapshot) => {
      console.log("🟢 [ADMIN] Callback onValue déclenché !");
      const data = snapshot.val();
      console.log("📦 [ADMIN] Données brutes reçues de Firebase :", data);

      if (data) {
        // Conversion stricte de l'objet en tableau, SANS FILTRE
        const liste = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        console.log("✅ [ADMIN] Tableau converti, longueur :", liste.length);
        console.log("🔍 [ADMIN] EXEMPLE DU PREMIER CHANTIER (pour inspecter la structure) :", liste[0]);
        
        setChantiers(liste);
      } else {
        console.log("⚠️ [ADMIN] Aucune donnée dans 'chantiers'");
        setChantiers([]);
      }
      setLoading(false);
    });

    // Cleanup
    return () => {
      console.log("🧹 [ADMIN] Nettoyage du listener onValue");
      unsubChantiers();
      
      // Autres listeners...
    };
  }, []); // Dépendance vide

  const filteredClients = clients.filter((c) => c.nom?.toLowerCase().includes(query.toLowerCase()) || c.email?.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-black capitalize text-[#FF7A00]">{section.replace("-", " ")}</h1>
        {loading ? <div className="animate-pulse space-y-3"><div className="h-12 rounded-[12px] bg-white/5" /><div className="h-64 rounded-[16px] bg-white/5" /></div> : (
          <>
            {section === "clients" && <ClientsSection data={filteredClients} query={query} setQuery={setQuery} onVoir={setVueClient} vueClient={vueClient} clientChantiers={[]} allClients={clients} />}
            {section === "chantiers" && <ChantiersSection data={chantiers} onAdd={setChantiers} />}
            {section === "ouvriers" && <OuvriersSection data={ouvriers} onAdd={setOuvriers} />}
            {section === "rendez-vous" && <RdvSection data={rdvs} onChange={setRdvs} />}
            {section === "materiaux" && <MateriauxSection data={materiaux} onAdd={setMateriaux} onDelete={setMateriaux} />}
            {section === "promotions" && <PromosSection data={promos} onAdd={setPromos} />}
            {section === "partenaires" && <PartenairesSection data={partenaires} onAdd={setPartenaires} />}
            {section === "statistiques" && <StatsSection chantiers={chantiers} clients={clients} materiaux={materiaux} />}
            {section === "parametres" && <SettingsSection />}
            {section === "notifications" && <AdminNotificationsSection data={notifications} onMarkRead={async (id) => { await markAsRead("admin", id); }} />}
            {section === "contenu" && <ContenuSection tickerText="" setTickerText={() => {}} />}
            {section === "messagerie" && <MessagerieSection clients={clients} chantiers={chantiers} />}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#111827] p-4 text-white"><div className="mx-auto max-w-6xl"><div className="h-12 rounded-[12px] bg-white/5" /><div className="h-64 rounded-[16px] bg-white/5" /></div></div>}><AdminContent /></Suspense>;
}

function ClientsSection({ data, query, setQuery, onVoir, vueClient, clientChantiers, allClients }: { data: Client[]; query: string; setQuery: (v: string) => void; onVoir: (id: string) => void; vueClient: string | null; clientChantiers: Chantier[]; allClients: Client[]; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[14px] bg-white/5 px-4"><Search size={18} className="text-white/40" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" /></div>
      <div className="overflow-x-auto rounded-[16px] border border-white/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-white/5 text-xs uppercase text-white/50"><tr><Th>Nom</Th><Th>Email</Th><Th>Téléphone</Th><Th>Inscription</Th><Th>Statut</Th><Th>Actions</Th></tr></thead><tbody>{data.map((c) => <tr key={c.id} className="border-t border-white/10"><Td className="font-bold">{c.nom || "—"}</Td><Td>{c.email || "—"}</Td><Td>{c.telephone || "—"}</Td><Td>{c.date_inscription || "—"}</Td><Td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.statut === "inactif" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{c.statut || "actif"}</span></Td><Td><div className="flex gap-1"><Btn icon={Eye} label="Voir" onClick={() => onVoir(c.id)} /><Btn icon={Pencil} label="Modifier" /><Btn icon={Ban} label="Désactiver" danger /></div></Td></tr>)}</tbody></table></div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 font-bold">{children}</th>; }
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
function Btn({ icon: Icon, label, danger, onClick }: { icon: typeof Eye; label: string; danger?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} title={label} className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition ${danger ? "bg-red-500/15 text-red-400" : "bg-white/10 text-white/70"}`}>{Icon && <Icon size={14} />} {label}</button>;
}
function Input({ label, value, set, type = "text", placeholder = "" }: { label: string; value: string; set: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="block"><span className="mb-1 block text-xs text-white/60">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(e) => set(e.target.value)} className="h-11 w-full rounded-[12px] bg-white/5 px-3 outline-none ring-1 ring-white/10" /></label>;
}

function StatsSection({ chantiers, clients, materiaux }: { chantiers: Chantier[]; clients: Client[]; materiaux: Materiau[] }) {
  const totalClients = clients.length;
  const clientsActifs = clients.filter(c => c.statut !== "suspendu").length;
  const totalChantiers = chantiers.length;
  const chantiersParStatut = chantiers.reduce((acc, c) => { const s = c.statut || "autre"; acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
  
  const today = new Date().toISOString().slice(0, 10);
  const creationsAujourdhui = chantiers.filter(c => c.date_soumission?.slice(0, 10) === today).length;

  const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); }).reverse();
  const chantiers7jours = last7Days.map(date => ({ name: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), value: chantiers.filter(c => c.date_soumission?.slice(0, 10) === date).length }));
  const byStatus = Object.entries(chantiersParStatut).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 font-black text-[#FF7A00]">📊 Statistiques globales</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[12px] bg-white/5 p-4 text-center"><div className="text-2xl font-black">{totalClients}</div><div className="text-xs">Total clients</div><div className="text-xs">{clientsActifs} actifs</div></div>
          <div className="rounded-[12px] bg-white/5 p-4 text-center"><div className="text-2xl font-black">{totalChantiers}</div><div className="text-xs">Total chantiers</div><div className="text-xs">{chantiersParStatut.en_cours || 0} en cours</div></div>
          <div className="rounded-[12px] bg-white/5 p-4 text-center"><div className="text-2xl font-black">{creationsAujourdhui}</div><div className="text-xs">Créations aujourd'hui</div></div>
          <div className="rounded-[12px] bg-white/5 p-4 text-center"><div className="text-2xl font-black">{materiaux.length}</div><div className="text-xs">Matériaux</div></div>
        </div>
      </div>
      <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 font-black">Nouveaux chantiers (7j)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chantiers7jours}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" /><XAxis dataKey="name" stroke="#ffffff60" fontSize={12} /><YAxis stroke="#ffffff60" fontSize={12} /><Tooltip /><Bar dataKey="value" fill="#FF7A00" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
        <h3 className="mb-3 font-black">Chantiers par statut</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart><Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label><Cell key="en_attente" fill="#FF7A00" /><Cell key="en_cours" fill="#22C55E" /><Cell key="termine" fill="#0B5FFF" /></Pie><Tooltip /><Legend /></PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChantiersSection({ data, onAdd }: { data: Chantier[]; onAdd: (updater: (prev: Chantier[]) => Chantier[]) => void }) {
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((c) => <div key={c.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">{c.nom_projet || c.nom}</div>)}</div></div>;
}
function OuvriersSection({ data, onAdd }: { data: Ouvrier[]; onAdd: (updater: (prev: Ouvrier[]) => Ouvrier[]) => void }) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const submit = (e: FormEvent) => { e.preventDefault(); onAdd(p => [...p, { id: `o${Date.now()}`, nom }]); setNom(""); setOpen(false); };
  return <div className="space-y-4"><button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5"><Plus size={18} /> Ajouter</button>{open && <form onSubmit={submit} className="rounded-[16px] border border-white/10 bg-white/5 p-4"><Input label="Nom" value={nom} set={setNom} /><button className="h-11 rounded-[12px] bg-[#0B5FFF] font-black">Ajouter</button></form>}</div>;
}
function RdvSection({ data, onChange }: { data: RDV[]; onChange: (updater: (prev: RDV[]) => RDV[]) => void }) {
  return <div className="overflow-x-auto rounded-[16px] border border-white/10"><table className="w-full text-left text-sm"><thead><tr><Th>Client</Th><Th>Date</Th></tr></thead><tbody>{data.map(r => <tr key={r.id} className="border-t border-white/10"><Td>{r.client}</Td><Td>{r.date}</Td></tr>)}</tbody></table></div>;
}
function MateriauxSection({ data, onAdd, onDelete }: { data: Materiau[]; onAdd: (updater: (prev: Materiau[]) => Materiau[]) => void; onDelete: (updater: (prev: Materiau[]) => Materiau[]) => void }) {
  return <div className="space-y-4"><div className="overflow-x-auto rounded-[16px] border border-white/10"><table className="w-full text-left text-sm"><thead><tr><Th>Nom</Th><Th>Prix</Th></tr></thead><tbody>{data.map(m => <tr key={m.id} className="border-t border-white/10"><Td>{m.nom}</Td><Td>{m.prix} F</Td></tr>)}</tbody></table></div></div>;
}
function PromosSection({ data, onAdd }: { data: Promo[]; onAdd: (updater: (prev: Promo[]) => Promo[]) => void }) {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const submit = (e: FormEvent) => { e.preventDefault(); onAdd(p => [...p, { id: `p${Date.now()}`, titre }]); setTitre(""); setOpen(false); };
  return <div className="space-y-4"><button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5"><Plus size={18} /> Créer promo</button>{open && <form onSubmit={submit} className="rounded-[16px] border border-white/10 bg-white/5 p-4"><Input label="Titre" value={titre} set={setTitre} /><button className="h-11 rounded-[12px] bg-[#0B5FFF] font-black">Publier</button></form>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.map(p => <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">{p.titre}</div>)}</div></div>;
}
function PartenairesSection({ data, onAdd }: { data: Partenaire[]; onAdd: (updater: (prev: Partenaire[]) => Partenaire[]) => void }) {
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.map(p => <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">{p.nom}</div>)}</div></div>;
}
function AdminNotificationsSection({ data, onMarkRead }: { data: Notification[]; onMarkRead: (id: string) => void }) {
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(n => <div key={n.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">{n.message}</div>)}</div></div>;
}
function ContenuSection({ tickerText, setTickerText }: { tickerText: string; setTickerText: (v: string) => void }) {
  return <div className="space-y-5"><div className="rounded-[16px] border border-white/10 bg-white/5 p-6">Bandeau défilant</div></div>;
}
function MessagerieSection({ clients, chantiers }: { clients: Client[]; chantiers: Chantier[] }) {
  const [clientId, setClientId] = useState("");
  const [text, setText] = useState("");
  const send = async (e: FormEvent) => { e.preventDefault(); if (!clientId || !text.trim()) return; const { database } = await (await import("@/lib/firebase")).getFirebaseServices(); const messagesRef = dbRef(database, "messages"); const newRef = push(messagesRef); await set(newRef, { id: newRef.key, senderId: "admin", receiverId: clientId, text: text.trim(), timestamp: Date.now(), read: false }); setText(""); };
  return <div className="space-y-4"><div className="rounded-[16px] border border-white/10 bg-white/5 p-6"><select value={clientId} onChange={e => setClientId(e.target.value)} className="h-11 w-full rounded-[12px] bg-white/5 mb-3"><option value="">Client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}</select><textarea value={text} onChange={e => setText(e.target.value)} className="h-28 w-full rounded-[12px] bg-white/5 p-3 mb-3" /><button onClick={send} className="h-11 rounded-[12px] bg-[#0B5FFF]">Envoyer</button></div></div>;
}
function SettingsSection() {
  const [profile, setProfile] = useState<{ nom?: string; email?: string }>({});
  const save = async (e: FormEvent) => { e.preventDefault(); await rtdbSet("global_settings/admin_profile", profile); };
  return <div className="space-y-4 rounded-[16px] border border-white/10 bg-white/5 p-6"><h3 className="font-black text-[#FF7A00]">Paramètres</h3><form onSubmit={save} className="space-y-3"><Input label="Nom" value={profile.nom || ""} set={v => setProfile(p => ({ ...p, nom: v }))} /><button className="h-11 rounded-[12px] bg-[#0B5FFF]">Sauvegarder</button></form></div>;
}