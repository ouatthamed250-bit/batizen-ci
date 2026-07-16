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
import { rtdbGetList } from "@/lib/rtdb";
import { subscribeToAdminNotifications, markAsRead, getNotificationIcon, getNotificationColor, formatNotificationDate, type Notification } from "@/lib/notifications";
import { useAuthContext } from "@/contexts/AuthContext";

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
type Ouvrier = {
  id: string;
  nom?: string;
  role?: string;
  telephone?: string;
  chantier_affecte?: string;
};
type RDV = {
  id: string;
  client?: string;
  type?: string;
  date?: string;
  lieu?: string;
  statut?: string;
};
type Materiau = {
  id: string;
  nom?: string;
  categorie?: string;
  prix?: number;
  stock?: number;
};
type Promo = {
  id: string;
  titre?: string;
  description?: string;
  reduction?: number;
  date_debut?: string;
  date_fin?: string;
  active?: boolean;
};

type Partenaire = {
  id: string;
  nom?: string;
  logo?: string;
  description?: string;
  statut?: "actif" | "bientot_disponible";
};

const PARTNER_STATUTS: Array<"actif" | "bientot_disponible"> = ["actif", "bientot_disponible"];

const COLORS = ["#FF7A00", "#0B5FFF", "#22C55E", "#8B5CF6", "#EC4899", "#F59E0B"];

 function AdminContent() {
   const params = useSearchParams();
   const section = params.get("section") || "clients";
   const { user, loading: authLoading } = useAuthContext();
   
   // Hooks DOIVENT être déclarés AVANT tout return
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
   
   // Protection: vérifier que l'utilisateur est admin
   if (authLoading) {
     return (
       <div className="min-h-screen bg-[#111827] flex items-center justify-center">
         <p className="text-white">Chargement...</p>
       </div>
     );
   }
   
   if (!user || user.role !== "admin") {
     return (
       <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
         <div className="text-center">
           <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
           <p className="mt-4 text-white/60">Vous devez être administrateur pour accéder à cette page.</p>
         </div>
       </div>
     );
   }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [c, ch, o, r, m, p] = await Promise.all([
        rtdbGetList<Client>("clients"),
        rtdbGetList<Chantier>("chantiers"),
        rtdbGetList<Ouvrier>("ouvriers"),
        rtdbGetList<RDV>("rendez_vous"),
        rtdbGetList<Materiau>("materiaux"),
        rtdbGetList<Promo>("promotions"),
      ]);
      if (cancelled) return;
      setClients(c.length ? c : DEMO_CLIENTS);
      setChantiers(ch.length ? ch : DEMO_CHANTIERS);
      setOuvriers(o.length ? o : DEMO_OUVRIERS);
      setRdvs(r.length ? r : DEMO_RDVS);
      setMateriaux(m.length ? m : DEMO_MATERIAUX);
      setPromos(p.length ? p : DEMO_PROMOS);
      setLoading(false);
    }
    load();

    // Charger les notifications admin en temps réel
    const unsubNotifs = subscribeToAdminNotifications((notifs) => {
      setNotifications(notifs);
    });

    return () => {
      cancelled = true;
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.nom?.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase())
  );

  const clientChantiers = vueClient
    ? chantiers.filter((c) => c.client_id === vueClient)
    : [];

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-black capitalize text-[#FF7A00]">
          {section.replace("-", " ")}
        </h1>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-[12px] bg-white/5" />
            <div className="h-64 rounded-[16px] bg-white/5" />
          </div>
        ) : (
          <>
            {section === "clients" && (
              <ClientsSection
                data={filteredClients}
                query={query}
                setQuery={setQuery}
                onVoir={setVueClient}
                vueClient={vueClient}
                clientChantiers={clientChantiers}
                allClients={clients}
              />
            )}
            {section === "chantiers" && <ChantiersSection data={chantiers} onAdd={setChantiers} />}
            {section === "ouvriers" && <OuvriersSection data={ouvriers} onAdd={setOuvriers} />}
            {section === "rendez-vous" && <RdvSection data={rdvs} onChange={setRdvs} />}
            {section === "materiaux" && <MateriauxSection data={materiaux} onAdd={setMateriaux} onDelete={setMateriaux} />}
            {section === "promotions" && <PromosSection data={promos} onAdd={setPromos} />}
{section === "partenaires" && <PartenairesSection data={partenaires} onAdd={setPartenaires} />}
            {section === "statistiques" && <StatsSection chantiers={chantiers} clients={clients} materiaux={materiaux} />}
            {section === "parametres" && <SettingsSection />}
            {section === "notifications" && <AdminNotificationsSection data={notifications} onMarkRead={async (id) => { await markAsRead("admin", id); }} />}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111827] p-4 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="h-12 rounded-[12px] bg-white/5" />
          <div className="h-64 rounded-[16px] bg-white/5" />
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

/* ---------- Clients ---------- */
function ClientsSection({
  data,
  query,
  setQuery,
  onVoir,
  vueClient,
  clientChantiers,
  allClients,
}: {
  data: Client[];
  query: string;
  setQuery: (v: string) => void;
  onVoir: (id: string) => void;
  vueClient: string | null;
  clientChantiers: Chantier[];
  allClients: Client[];
}) {
  const find = (id?: string) => allClients.find((c) => c.id === id);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-[14px] bg-white/5 px-4">
        <Search size={18} className="text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-white/10">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <Th>Nom</Th><Th>Email</Th><Th>Téléphone</Th><Th>Inscription</Th><Th>Statut</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <Td className="font-bold">{c.nom || "—"}</Td>
                <Td>{c.email || "—"}</Td>
                <Td>{c.telephone || "—"}</Td>
                <Td>{c.date_inscription || "—"}</Td>
                <Td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.statut === "inactif" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {c.statut || "actif"}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Btn icon={Eye} label="Voir" onClick={() => onVoir(c.id)} />
                    <Btn icon={Pencil} label="Modifier" />
                    <Btn icon={Ban} label="Désactiver" danger />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vueClient && (
        <div className="rounded-[16px] border border-[#FF7A00]/30 bg-[#FF7A00]/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black">Chantiers de {find(vueClient)?.nom}</h3>
            <button onClick={() => onVoir("")} className="text-white/50"><X size={18} /></button>
          </div>
          {clientChantiers.length === 0 ? (
            <p className="text-sm text-white/50">Aucun chantier pour ce client.</p>
          ) : (
            <div className="space-y-2">
              {clientChantiers.map((ch) => (
                <div key={ch.id} className="rounded-[12px] bg-white/5 p-3 text-sm">
                  <span className="font-bold">{ch.nom_projet || ch.nom}</span> · {ch.adresse || "—"} · {ch.statut}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Chantiers ---------- */
function ChantiersSection({ data, onAdd }: { data: Chantier[]; onAdd: (updater: (prev: Chantier[]) => Chantier[]) => void }) {
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [filterPlan, setFilterPlan] = useState<string>("tous");
  const [filterDate, setFilterDate] = useState<string>("tous");

  const filteredChantiers = data.filter((c) => {
    if (filterStatut !== "tous" && c.statut !== filterStatut) return false;
    if (filterPlan !== "tous" && c.plan_choisi !== filterPlan) return false;
    if (filterDate === "recent" && c.date_soumission) {
      const date = new Date(c.date_soumission);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (date < thirtyDaysAgo) return false;
    }
    if (filterDate === "ancien" && c.date_soumission) {
      const date = new Date(c.date_soumission);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (date >= thirtyDaysAgo) return false;
    }
    return true;
  });

  const getStatutBadge = (statut?: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400">⏳ En attente</span>;
      case "en_cours":
        return <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-green-500/20 text-green-400">✅ En cours</span>;
      case "termine":
        return <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400">🏁 Terminé</span>;
      default:
        return <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-white/10 text-white/50">{statut || "—"}</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return "—";
    return new Intl.NumberFormat("fr-FR").format(budget) + " F";
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 rounded-[14px] bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Statut:</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="h-9 rounded-[10px] bg-white/10 px-3 text-xs font-bold outline-none ring-1 ring-white/10 focus:ring-[#FF7A00]"
          >
            <option value="tous">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Plan:</span>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="h-9 rounded-[10px] bg-white/10 px-3 text-xs font-bold outline-none ring-1 ring-white/10 focus:ring-[#FF7A00]"
          >
            <option value="tous">Tous</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Date:</span>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 rounded-[10px] bg-white/10 px-3 text-xs font-bold outline-none ring-1 ring-white/10 focus:ring-[#FF7A00]"
          >
            <option value="tous">Toutes</option>
            <option value="recent">Récent (30j)</option>
            <option value="ancien">Ancien (+30j)</option>
          </select>
        </div>
      </div>

      {/* Liste des chantiers en cartes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredChantiers.map((c) => (
          <div key={c.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-black text-[#FF7A00]">{c.nom_projet || c.nom || "Sans nom"}</h3>
                <p className="text-sm text-white/60">{c.client_nom || "Client inconnu"}</p>
              </div>
              {getStatutBadge(c.statut)}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Type:</span>
                <span className="font-bold">{c.type || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Budget:</span>
                <span className="font-bold">{formatBudget(c.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Plan:</span>
                <span className="font-bold">{c.plan_choisi || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Soumission:</span>
                <span className="font-bold">{formatDate(c.date_soumission)}</span>
              </div>
              {c.rdv_date && (
                <div className="flex justify-between">
                  <span className="text-white/50">RDV:</span>
                  <span className="font-bold">{formatDate(c.rdv_date)} {c.rdv_heure || ""}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = `/admin/chantier/${c.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#0B5FFF] px-4 py-2.5 text-sm font-black transition hover:bg-[#0B5FFF]/80"
            >
              <Eye size={16} /> Voir détails
            </button>
          </div>
        ))}
      </div>

      {filteredChantiers.length === 0 && (
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/50">Aucun chantier ne correspond aux filtres sélectionnés.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Ouvriers ---------- */
function OuvriersSection({ data, onAdd }: { data: Ouvrier[]; onAdd: (updater: (prev: Ouvrier[]) => Ouvrier[]) => void }) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("");
  const [tel, setTel] = useState("");
  const [chantier, setChantier] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd((prev) => [...prev, { id: `o${Date.now()}`, nom, role, telephone: tel, chantier_affecte: chantier }]);
    setNom(""); setRole(""); setTel(""); setChantier(""); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5 text-sm font-black">
        <Plus size={18} /> Ajouter un ouvrier
      </button>
      {open && (
        <form onSubmit={submit} className="grid gap-3 rounded-[16px] border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
          <Input label="Nom complet" value={nom} set={setNom} />
          <Input label="Rôle" value={role} set={setRole} />
          <Input label="Téléphone" value={tel} set={setTel} />
          <Input label="Chantier affecté" value={chantier} set={setChantier} />
          <button className="h-11 rounded-[12px] bg-[#0B5FFF] font-black sm:col-span-2">Ajouter</button>
        </form>
      )}
      <div className="overflow-x-auto rounded-[16px] border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr><Th>Nom</Th><Th>Rôle</Th><Th>Téléphone</Th><Th>Chantier</Th></tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id} className="border-t border-white/10">
                <Td className="font-bold">{o.nom || "—"}</Td>
                <Td>{o.role || "—"}</Td>
                <Td>{o.telephone || "—"}</Td>
                <Td>{o.chantier_affecte || "—"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Rendez-vous ---------- */
function RdvSection({ data, onChange }: { data: RDV[]; onChange: (updater: (prev: RDV[]) => RDV[]) => void }) {
  function setStatut(id: string, statut: string) {
    onChange((prev) => prev.map((r) => (r.id === id ? { ...r, statut } : r)));
  }
  return (
    <div className="overflow-x-auto rounded-[16px] border border-white/10">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase text-white/50">
          <tr><Th>Client</Th><Th>Type</Th><Th>Date</Th><Th>Lieu</Th><Th>Statut</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-t border-white/10">
              <Td className="font-bold">{r.client || "—"}</Td>
              <Td>{r.type || "—"}</Td>
              <Td>{r.date || "—"}</Td>
              <Td>{r.lieu || "—"}</Td>
              <Td>{r.statut || "—"}</Td>
              <Td>
                <div className="flex gap-1">
                  <Btn icon={Check} label="Valider" onClick={() => setStatut(r.id, "validé")} />
                  <Btn icon={X} label="Annuler" danger onClick={() => setStatut(r.id, "annulé")} />
                  <Btn icon={CalendarClock} label="Reporter" onClick={() => setStatut(r.id, "reporte")} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Materiaux ---------- */
function MateriauxSection({
  data,
  onAdd,
  onDelete,
}: {
  data: Materiau[];
  onAdd: (updater: (prev: Materiau[]) => Materiau[]) => void;
  onDelete: (updater: (prev: Materiau[]) => Materiau[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [cat, setCat] = useState("");
  const [prix, setPrix] = useState(0);
  const [stock, setStock] = useState(0);

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd((prev) => [...prev, { id: `m${Date.now()}`, nom, categorie: cat, prix, stock }]);
    setNom(""); setCat(""); setPrix(0); setStock(0); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5 text-sm font-black">
        <Plus size={18} /> Ajouter un matériau
      </button>
      {open && (
        <form onSubmit={submit} className="grid gap-3 rounded-[16px] border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
          <Input label="Nom" value={nom} set={setNom} />
          <Input label="Catégorie" value={cat} set={setCat} />
          <Input label="Prix" value={String(prix)} set={(v) => setPrix(Number(v))} type="number" />
          <Input label="Stock" value={String(stock)} set={(v) => setStock(Number(v))} type="number" />
          <button className="h-11 rounded-[12px] bg-[#0B5FFF] font-black sm:col-span-2">Ajouter</button>
        </form>
      )}
      <div className="overflow-x-auto rounded-[16px] border border-white/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/50">
            <tr><Th>Nom</Th><Th>Catégorie</Th><Th>Prix</Th><Th>Stock</Th><Th></Th></tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-t border-white/10">
                <Td className="font-bold">{m.nom || "—"}</Td>
                <Td>{m.categorie || "—"}</Td>
                <Td>{m.prix ?? 0} F</Td>
                <Td>{m.stock ?? 0}</Td>
                <Td>
                  <button onClick={() => onDelete((prev) => prev.filter((x) => x.id !== m.id))} className="text-red-400">
                    <Trash2 size={16} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Promotions ---------- */
function PromosSection({ data, onAdd }: { data: Promo[]; onAdd: (updater: (prev: Promo[]) => Promo[]) => void }) {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [desc, setDesc] = useState("");
  const [reduction, setReduction] = useState(0);
  const [deb, setDeb] = useState("");
  const [fin, setFin] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd((prev) => [...prev, { id: `p${Date.now()}`, titre, description: desc, reduction, date_debut: deb, date_fin: fin, active: true }]);
    setTitre(""); setDesc(""); setReduction(0); setDeb(""); setFin(""); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5 text-sm font-black">
        <Plus size={18} /> Créer une promo
      </button>
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-[16px] border border-white/10 bg-white/5 p-4">
          <Input label="Titre" value={titre} set={setTitre} />
          <label className="block">
            <span className="mb-1 block text-xs text-white/60">Description</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="h-20 w-full rounded-[12px] bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Réduction %" value={String(reduction)} set={(v) => setReduction(Number(v))} type="number" />
            <Input label="Début" value={deb} set={setDeb} />
            <Input label="Fin" value={fin} set={setFin} />
          </div>
          <button className="h-11 w-full rounded-[12px] bg-[#0B5FFF] font-black">Publier</button>
        </form>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black">{p.titre}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>
                {p.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/60">{p.description}</p>
            <p className="mt-2 text-[#FF7A00] font-black">-{p.reduction}%</p>
            <p className="text-xs text-white/40">{p.date_debut} → {p.date_fin}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Statistiques ---------- */
function StatsSection({ chantiers, clients, materiaux }: { chantiers: Chantier[]; clients: Client[]; materiaux: Materiau[] }) {
  const [filtre, setFiltre] = useState<"jour" | "mois" | "annee">("mois");

  const ca = [
    { name: "Jan", v: 12 }, { name: "Fév", v: 18 }, { name: "Mar", v: 25 },
    { name: "Avr", v: 22 }, { name: "Mai", v: 30 }, { name: "Juin", v: 28 },
  ];
  const clientsCurve = [
    { name: "Jan", v: 5 }, { name: "Fév", v: 8 }, { name: "Mar", v: 12 },
    { name: "Avr", v: 15 }, { name: "Mai", v: 20 }, { name: "Juin", v: 24 },
  ];
  const byStatus = (() => {
    const map: Record<string, number> = {};
    chantiers.forEach((c) => {
      const s = c.statut || "autre";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();
  const topProduits = [...materiaux]
    .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
    .slice(0, 5)
    .map((m) => ({ name: m.nom?.slice(0, 10) || "—", v: m.stock ?? 0 }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["jour", "mois", "annee"] as const).map((f) => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${filtre === f ? "bg-[#FF7A00] text-white" : "bg-white/10 text-white/60"}`}>
            {f === "jour" ? "Jour" : f === "mois" ? "Mois" : "Année"}
          </button>
        ))}
      </div>

      <ChartCard title="Chiffre d'affaires" icon={<TrendingUp size={18} className="text-[#FF7A00]" />}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ca}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
            <YAxis stroke="#ffffff60" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1F2937", border: "none", color: "#fff" }} />
            <Line type="monotone" dataKey="v" stroke="#FF7A00" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Nombre de clients" icon={<UsersIcon size={18} className="text-[#0B5FFF]" />}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={clientsCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
            <YAxis stroke="#ffffff60" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1F2937", border: "none", color: "#fff" }} />
            <Line type="monotone" dataKey="v" stroke="#0B5FFF" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Chantiers par statut">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label>
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1F2937", border: "none", color: "#fff" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produits les plus vendus (stock)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProduits}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1F2937", border: "none", color: "#fff" }} />
              <Bar dataKey="v" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ---------- Notifications Admin ---------- */
function AdminNotificationsSection({ data, onMarkRead }: { data: Notification[]; onMarkRead: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((n) => (
          <div key={n.id} className={`rounded-[16px] border border-white/10 bg-white/5 p-4 ${!n.lu ? "border-l-4 border-l-[#FF7A00]" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getNotificationIcon(n.type)}</span>
                <div>
                  <h3 className="font-black text-sm">{n.message}</h3>
                  <p className="text-xs text-white/40">{formatNotificationDate(n.dateCreation)}</p>
                </div>
              </div>
              {!n.lu && <span className="size-2 rounded-full bg-[#FF7A00]" />}
            </div>
            {n.userName && <p className="mt-2 text-xs text-white/60">Client: {n.userName}</p>}
            {n.planChoisi && <p className="text-xs text-white/60">Plan: {n.planChoisi}</p>}
            <div className="mt-3 flex gap-2">
              {n.chantierId && (
                <button onClick={() => window.location.href = `/admin/chantier/${n.chantierId}`} className="rounded-[10px] bg-[#0B5FFF] px-3 py-1.5 text-xs font-black">Voir chantier</button>
              )}
              {!n.lu && (
                <button onClick={() => onMarkRead(n.id)} className="rounded-[10px] bg-white/10 px-3 py-1.5 text-xs font-bold">Marquer lu</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/50">Aucune notification pour le moment.</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Partenaires ---------- */
function PartenairesSection({ data, onAdd }: { data: Partenaire[]; onAdd: (updater: (prev: Partenaire[]) => Partenaire[]) => void }) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState<"actif" | "bientot_disponible">("bientot_disponible");

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd((prev) => [...prev, { id: `pt${Date.now()}`, nom, logo, description, statut }]);
    setNom(""); setLogo(""); setDescription(""); setStatut("bientot_disponible"); setOpen(false);
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-[12px] bg-[#FF7A00] px-4 py-2.5 text-sm font-black">
        <Plus size={18} /> Ajouter un partenaire
      </button>
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-[16px] border border-white/10 bg-white/5 p-4">
          <Input label="Nom du partenaire" value={nom} set={setNom} />
          <Input label="URL du logo" value={logo} set={setLogo} />
          <label className="block">
            <span className="mb-1 block text-xs text-white/60">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-20 w-full rounded-[12px] bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/60">Statut</span>
            <select value={statut} onChange={(e) => setStatut(e.target.value as "actif" | "bientot_disponible")} className="h-11 w-full rounded-[12px] bg-white/5 px-3 outline-none ring-1 ring-white/10">
              <option value="bientot_disponible">Bientôt disponible</option>
              <option value="actif">Actif</option>
            </select>
          </label>
          <button className="h-11 w-full rounded-[12px] bg-[#0B5FFF] font-black">Ajouter</button>
        </form>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => (
          <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              {p.logo ? (
                <img src={p.logo} alt={p.nom} className="h-12 w-12 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">🏢</div>
              )}
              <div>
                <h3 className="font-black">{p.nom || "—"}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.statut === "actif" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {p.statut === "actif" ? "Actif" : "Bientôt disponible"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/60">{p.description || "—"}</p>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-white/50">Aucun partenaire enregistré.</p>
        </div>
      )}
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-4 rounded-[16px] border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-white/60">Paramètres généraux de la plateforme BATIZEN.</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 text-sm">
          <span>Code secret admin</span><span className="font-black text-[#FF7A00]">••••••••</span>
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 text-sm">
          <span>Notifications push</span><span className="text-green-400">Activées</span>
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 text-sm">
          <span>Mode maintenance</span><span className="text-white/50">Désactivé</span>
        </div>
        <div className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 text-sm">
          <span>Sécurité tentatives</span><span className="text-green-400">Activée (max 5)</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers UI ---------- */
function Th({ children }: { children?: ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}
function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Btn({ icon: Icon, label, danger, onClick }: { icon: typeof Eye; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition ${
        danger ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "bg-white/10 text-white/70 hover:bg-white/20"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
function Input({ label, value, set, type = "text" }: { label: string; value: string; set: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="h-11 w-full rounded-[12px] bg-white/5 px-3 outline-none ring-1 ring-white/10 focus:ring-[#FF7A00]"
      />
    </label>
  );
}
function ChartCard({ title, icon, children }: { title: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-black">{icon}{title}</h3>
      {children}
    </div>
  );
}

/* ---------- Demo data (fallback si RTDB vide) ---------- */
const DEMO_CLIENTS: Client[] = [
  { id: "cl1", nom: "Awa Koné", email: "awa@exemple.ci", telephone: "+225 07 00 00 00", date_inscription: "2026-01-12", statut: "actif" },
  { id: "cl2", nom: "Marc Traoré", email: "marc@exemple.ci", telephone: "+225 05 00 00 00", date_inscription: "2026-03-05", statut: "actif" },
];
const DEMO_CHANTIERS: Chantier[] = [
  { id: "ch1", client_id: "cl1", nom_projet: "Villa Riviera", adresse: "Abidjan", progression: 64, statut: "en_cours", date_fin: "2026-09-30" },
  { id: "ch2", client_id: "cl2", nom_projet: "Duplex Prestige", adresse: "Yamoussoukro", progression: 28, statut: "en_cours", date_fin: "2026-12-15" },
];
const DEMO_OUVRIERS: Ouvrier[] = [
  { id: "o1", nom: "Kouamé B.", role: "Maçon", telephone: "+225 01 00 00 00", chantier_affecte: "ch1" },
  { id: "o2", nom: "Fatou D.", role: "Électricien", telephone: "+225 02 00 00 00", chantier_affecte: "ch2" },
];
const DEMO_RDVS: RDV[] = [
  { id: "r1", client: "Awa Koné", type: "Visite chantier", date: "2026-07-20", lieu: "Abidjan", statut: "en attente" },
];
const DEMO_MATERIAUX: Materiau[] = [
  { id: "m1", nom: "Ciment CPJ 42.5", categorie: "Gros œuvre", prix: 5200, stock: 340 },
  { id: "m2", nom: "Fer HA12", categorie: "Structure", prix: 4200, stock: 180 },
  { id: "m3", nom: "Carrelage premium", categorie: "Finition", prix: 12500, stock: 95 },
];
const DEMO_PROMOS: Promo[] = [
  { id: "p1", titre: "Solde été", description: "10% sur les matériaux", reduction: 10, date_debut: "2026-07-01", date_fin: "2026-08-31", active: true },
];