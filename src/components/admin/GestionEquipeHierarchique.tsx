"use client";
import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Hammer, Plus, X } from "lucide-react";
import { ref, onValue, update, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

type Ouvrier = {
  id: string;
  nom: string;
  specialite: string;
  telephone?: string;
  email?: string;
  description?: string;
  tarif?: number;
  photoUrl?: string;
  chantierId?: string;
  chefId?: string | null;
  fonction: "chef_de_chantier" | "chef_equipe" | "ouvrier";
  actif?: boolean;
};

interface GestionEquipeHierarchiqueProps {
  chantierId: string;
}

const SPECIALITES = [
  "maçon", "peintre", "électricien", "plombier", "charpentier",
  "menuisier", "couvreur", "serrurier", "tuilier", "carreleur", "autre"
];

const AVATAR_COLORS = [
  ["bg-red-500", "bg-red-600"], ["bg-orange-500", "bg-orange-600"], ["bg-amber-500", "bg-amber-600"],
  ["bg-lime-500", "bg-lime-600"], ["bg-green-500", "bg-green-600"], ["bg-emerald-500", "bg-emerald-600"],
  ["bg-teal-500", "bg-teal-600"], ["bg-cyan-500", "bg-cyan-600"], ["bg-blue-500", "bg-blue-600"],
  ["bg-indigo-500", "bg-indigo-600"], ["bg-violet-500", "bg-violet-600"], ["bg-purple-500", "bg-purple-600"],
  ["bg-fuchsia-500", "bg-fuchsia-600"], ["bg-pink-500", "bg-pink-600"], ["bg-rose-500", "bg-rose-600"],
];

function getInitials(nom: string): string {
  if (!nom) return "?";
  return nom.split(" ").map(w => w.charAt(0).toUpperCase()).slice(0, 2).join("");
}

function Avatar({ nom, photo, size = 12 }: { nom: string; photo?: string; size?: number }) {
  const colorIndex = nom.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[colorIndex];
  const sizeClass = `w-${size} h-${size}`;
  if (photo) {
    return <img src={photo} alt={nom} className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-lg`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-black shadow-lg`}>
      {getInitials(nom)}
    </div>
  );
}

export default function GestionEquipeHierarchique({ chantierId }: GestionEquipeHierarchiqueProps) {
  const { database } = getFirebaseServices();
  const [equipe, setEquipe] = useState<Ouvrier[]>([]);
  const [ouvriersLibres, setOuvriersLibres] = useState<Ouvrier[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState<string>("tous");

  useEffect(() => {
    const unsub: Unsubscribe = onValue(ref(database, 'ouvriers'), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setEquipe([]); setOuvriersLibres([]); return; }
      const all = Object.entries(data)
        .map(([id, o]: [string, any]) => ({ id, ...o }))
        .filter((o: Ouvrier) => o.actif !== false);

      const surCeChantier = all
        .filter(o => String(o.chantierId || "") === String(chantierId))
        .sort((a, b) => {
          const order = (f: string) => f === "chef_de_chantier" ? 0 : f === "chef_equipe" ? 1 : 2;
          const diff = order(a.fonction) - order(b.fonction);
          return diff !== 0 ? diff : (a.nom || "").localeCompare(b.nom || "");
        });
      setEquipe(surCeChantier);

      const libres = all.filter(o => !o.chantierId);
      setOuvriersLibres(libres);
    });
    return () => unsub();
  }, [chantierId, database]);

  const handleTransferer = async (ouvrierId: string, chefId?: string | null) => {
    try {
      await update(ref(database, `ouvriers/${ouvrierId}`), {
        chantierId: String(chantierId),
        chefId: chefId || null,
      });
    } catch (error) {
      console.error("Erreur transfert:", error);
      alert("Erreur lors du transfert");
    }
  };

  const handleRetirer = async (ouvrierId: string, nom: string) => {
    if (!confirm(`Retirer ${nom} de ce chantier ? Il redeviendra disponible dans la liste générale.`)) return;
    try {
      await update(ref(database, `ouvriers/${ouvrierId}`), { chantierId: null, chefId: null });
    } catch (error) {
      console.error("Erreur retrait:", error);
      alert("Erreur lors du retrait");
    }
  };

  const ouvriersLibresFiltres = ouvriersLibres.filter(o => {
    const matchSearch = (o?.nom || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpecialite = filterSpecialite === "tous" || o.specialite === filterSpecialite;
    return matchSearch && matchSpecialite;
  });

  const chefsDeChantier = equipe.filter(m => m.fonction === "chef_de_chantier");
  const chefsEquipe = equipe.filter(m => m.fonction === "chef_equipe");
  const getOuvriersDeChef = (chefId: string) => equipe.filter(m => m.fonction === "ouvrier" && m.chefId === chefId);
  const ouvriersIndependants = equipe.filter(m => m.fonction === "ouvrier" && !m.chefId);

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-black text-[#FF7A00]">
          <Hammer size={20} /> 👷 Équipe du chantier
        </h3>
        <button
          onClick={() => setShowTransfer(!showTransfer)}
          className="flex items-center gap-1 rounded-[8px] bg-[#FF7A00] px-3 py-1 text-xs font-bold text-white"
        >
          <Plus size={14} /> {showTransfer ? "Fermer" : "Transférer un ouvrier"}
        </button>
      </div>

      {showTransfer && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un ouvrier disponible..."
              className="flex-1 h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
            />
            <select
              value={filterSpecialite}
              onChange={(e) => setFilterSpecialite(e.target.value)}
              className="h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
            >
              <option value="tous">Toutes spécialités</option>
              {SPECIALITES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          {ouvriersLibresFiltres.length === 0 ? (
            <p className="text-xs text-white/50">Aucun ouvrier disponible. Ajoutez-en depuis la page "Ouvriers" de l'admin général.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {ouvriersLibresFiltres.map(o => (
                <div key={o.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Avatar nom={o.nom} photo={o.photoUrl} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{o.nom}</p>
                    <p className="text-xs text-white/60">{o.specialite} {o.telephone ? `• ${o.telephone}` : ""}</p>
                  </div>
                  <select
                    id={`chef-${o.id}`}
                    className="h-7 rounded-[6px] bg-white/10 px-2 text-[10px] text-white outline-none ring-1 ring-white/10"
                    defaultValue=""
                    disabled={o.fonction !== "ouvrier" || chefsDeChantier.length === 0}
                  >
                    <option value="">Sans chef</option>
                    {chefsDeChantier.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const sel = document.getElementById(`chef-${o.id}`) as HTMLSelectElement | null;
                      handleTransferer(o.id, sel?.value || null);
                    }}
                    className="shrink-0 rounded-[8px] bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition"
                  >
                    Transférer ici
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {equipe.length === 0 ? (
        <p className="text-sm text-white/50">Aucun membre affecté à ce chantier pour l'instant.</p>
      ) : (
        <div className="space-y-4">
          {chefsDeChantier.map((chef) => (
            <div key={chef.id} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Avatar nom={chef.nom} photo={chef.photoUrl} size={12} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{chef.nom}</p>
                  <p className="text-yellow-400 text-xs font-semibold">{chef.specialite} {chef.telephone ? `• ${chef.telephone}` : ""}</p>
                </div>
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black">👑 Chef de Chantier</span>
                <button onClick={() => handleRetirer(chef.id, chef.nom)} className="shrink-0 rounded-full p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition" title="Retirer du chantier">
                  <X size={14} />
                </button>
              </div>
              {getOuvriersDeChef(chef.id).length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-yellow-500/30">
                  <p className="text-xs text-white/60 mb-2">Équipe ({getOuvriersDeChef(chef.id).length}) :</p>
                  <div className="flex flex-wrap gap-2">
                    {getOuvriersDeChef(chef.id).map(ouvrier => (
                      <div key={ouvrier.id} className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                        <Avatar nom={ouvrier.nom} photo={ouvrier.photoUrl} size={6} />
                        <span className="text-xs text-white">{ouvrier.nom}</span>
                        <button onClick={() => handleRetirer(ouvrier.id, ouvrier.nom)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {chefsEquipe.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Chefs d'équipe
              </h4>
              {chefsEquipe.map((chef) => (
                <div key={chef.id} className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-2">
                  <Avatar nom={chef.nom} photo={chef.photoUrl} size={8} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-white">{chef.nom}</span>
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{chef.specialite}</span>
                  </div>
                  <button onClick={() => handleRetirer(chef.id, chef.nom)} className="shrink-0 rounded-full p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition" title="Retirer du chantier">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {ouvriersIndependants.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-white/70 text-xs">Ouvriers indépendants</h4>
              <div className="flex flex-wrap gap-2">
                {ouvriersIndependants.map((ouvrier) => (
                  <div key={ouvrier.id} className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                    <Avatar nom={ouvrier.nom} photo={ouvrier.photoUrl} size={6} />
                    <span className="text-xs text-white">{ouvrier.nom}</span>
                    <button onClick={() => handleRetirer(ouvrier.id, ouvrier.nom)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}