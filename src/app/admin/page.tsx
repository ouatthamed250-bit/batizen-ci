"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Pencil,
  Ban,
  Check,
  Plus,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subscribeToAdminNotifications, markAsRead, type Notification } from "@/lib/notifications";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDatabase, ref as dbRef, onValue, update, push, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

type Client = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  statut?: string;
  lastLogin?: string | number;
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
  dateMiseAJour?: number;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  date_soumission?: string;
  localisation?: Localisation;
  client_nom?: string;
  client_email?: string;
  client_telephone?: string;
};

type Partenaire = {
  id: string;
  nom: string;
  description: string;
  photo_url: string;
  actif: boolean;
};

type Promotion = {
  id: string;
  titre: string;
  description: string;
  image_url: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
};

type Ouvrier = {
  id: string;
  nom: string;
  specialite: string;
  telephone: string;
  chantierId: string;
  fonction: "ouvrier" | "chef_de_chantier";
  actif: boolean;
};

type Materiau = {
  id: string;
  nom: string;
  categorie: string;
  prix_unitaire: number;
  unite: string;
  disponible: boolean;
};

function formatLocalisation(loc?: Localisation): string {
  if (!loc) return "—";
  return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
}

function formatDateActivite(timestamp?: string | number): string {
  if (!timestamp) return "";
  const d = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const jour = d.getDate().toString().padStart(2, '0');
  const mois = (d.getMonth() + 1).toString().padStart(2, '0');
  const annee = d.getFullYear();
  return isToday ? "Aujourd'hui" : `${jour}/${mois}/${annee}`;
}

function statutActivite(lastLogin?: string | number): { couleur: string; texte: string } {
  if (!lastLogin) return { couleur: "bg-gray-500", texte: "Jamais connecté" };
  const ts = typeof lastLogin === 'number' ? lastLogin : new Date(lastLogin).getTime();
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const derniere = new Date(ts);
  derniere.setHours(0, 0, 0, 0);
  
  const diffJours = (aujourdhui.getTime() - derniere.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffJours < 1) {
    return { couleur: "bg-green-500", texte: "🟢 En ligne / Actif aujourd'hui" };
  }
  return { couleur: "bg-gray-500", texte: `⚪ Inactif (Dernière activité : ${formatDateActivite(lastLogin)})` };
}

async function updateChantier(chantierId: string, updates: Partial<Chantier>) {
  const db = getDatabase();
  try {
    await update(dbRef(db, `chantiers/${chantierId}`), updates);
    console.log(`✅ Chantier ${chantierId} mis à jour:`, updates);
  } catch (error) {
    console.error(`❌ Erreur mise à jour chantier ${chantierId}:`, error);
    throw error;
  }
}

function AdminContent() {
  const params = useSearchParams();
  const section = params.get("section") || "clients";
  const { user, loading: authLoading } = useAuthContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (authLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center"><p className="text-white">Chargement...</p></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4"><div className="text-center"><h1 className="text-2xl font-bold text-red-600">Accès refusé</h1><p className="mt-4 text-white/60">Vous devez être administrateur.</p></div></div>;

  useEffect(() => {
    const db = getDatabase();

    const clientsRef = dbRef(db, 'users');
    const unsubClients = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientsData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setClients(clientsData);
      } else {
        setClients([]);
      }
    });

    console.log("🔓 ADMIN MODE - Chargement de TOUS les chantiers sans filtre");
    const chantiersRef = dbRef(db, 'chantiers');
    const unsubChantiers = onValue(chantiersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chantiersData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setChantiers(chantiersData);
      } else {
        setChantiers([]);
      }
      setLoading(false);
    });

    const partenairesRef = dbRef(db, 'partenaires');
    const unsubPartenaires = onValue(partenairesRef, (snapshot) => {
      const data = snapshot.val();
      setPartenaires(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const promotionsRef = dbRef(db, 'promotions');
    const unsubPromotions = onValue(promotionsRef, (snapshot) => {
      const data = snapshot.val();
      setPromotions(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const ouvriersRef = dbRef(db, 'ouvriers');
    const unsubOuvriers = onValue(ouvriersRef, (snapshot) => {
      const data = snapshot.val();
      setOuvriers(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const materiauxRef = dbRef(db, 'materiaux');
    const unsubMateriaux = onValue(materiauxRef, (snapshot) => {
      const data = snapshot.val();
      setMateriaux(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    return () => {
      unsubClients();
      unsubChantiers();
      unsubPartenaires();
      unsubPromotions();
      unsubOuvriers();
      unsubMateriaux();
    };
  }, []);

  const filteredClients = clients.filter((c) => 
    c.nom?.toLowerCase().includes(query.toLowerCase()) || 
    c.email?.toLowerCase().includes(query.toLowerCase())
  );

  const handleValider = async (id: string) => {
    if (!confirm("Valider et activer ce chantier ?")) return;
    setActionLoading(id);
    setMessage(null);
    try {
      await updateChantier(id, { statut: "en_cours", dateMiseAJour: Date.now() });
      setMessage({ type: "success", text: "✅ Chantier activé avec succès !" });
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'activation" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModifierChantier = async (id: string) => {
    const chantier = chantiers.find(c => c.id === id);
    if (!chantier) return;
    const nouveauNom = prompt("Nouveau nom de projet:", chantier.nom_projet || chantier.nom);
    if (nouveauNom && nouveauNom.trim()) {
      await updateChantier(id, { nom_projet: nouveauNom.trim() });
      setMessage({ type: "success", text: "Nom du projet modifié !" });
    }
  };

  const handleImageUpload = async (file: File, path: string): Promise<string> => {
    setUploading(true);
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `${path}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return url;
    } finally {
      setUploading(false);
    }
  };

  const [partenaireForm, setPartenaireForm] = useState({ nom: "", description: "", photo: null as File | null, actif: true });
  const [promoForm, setPromoForm] = useState({ titre: "", description: "", image: null as File | null, date_debut: "", date_fin: "", active: true });
  const [ouvrierForm, setOuvrierForm] = useState({ nom: "", specialite: "", telephone: "", chantierId: "", fonction: "ouvrier" as "ouvrier" | "chef_de_chantier" });
  const [materiauForm, setMateriauForm] = useState({ nom: "", categorie: "", prix_unitaire: "", unite: "kg", disponible: true });

  const handleAddPartenaire = async (e: FormEvent) => {
    e.preventDefault();
    if (!partenaireForm.nom) return;
    let photo_url = "";
    if (partenaireForm.photo) {
      photo_url = await handleImageUpload(partenaireForm.photo, "partenaires");
    }
    const db = getDatabase();
    const newRef = push(dbRef(db, 'partenaires'));
    await set(newRef, {
      nom: partenaireForm.nom,
      description: partenaireForm.description,
      photo_url,
      actif: partenaireForm.actif
    });
    setPartenaireForm({ nom: "", description: "", photo: null, actif: true });
    setMessage({ type: "success", text: "Partenaire ajouté !" });
  };

  const handleAddPromotion = async (e: FormEvent) => {
    e.preventDefault();
    if (!promoForm.titre) return;
    let image_url = "";
    if (promoForm.image) {
      image_url = await handleImageUpload(promoForm.image, "promotions");
    }
    const db = getDatabase();
    const newRef = push(dbRef(db, 'promotions'));
    await set(newRef, {
      titre: promoForm.titre,
      description: promoForm.description,
      image_url,
      date_debut: promoForm.date_debut,
      date_fin: promoForm.date_fin,
      active: promoForm.active
    });
    setPromoForm({ titre: "", description: "", image: null, date_debut: "", date_fin: "", active: true });
    setMessage({ type: "success", text: "Promotion ajoutée !" });
  };

  const handleAddOuvrier = async (e: FormEvent) => {
    e.preventDefault();
    if (!ouvrierForm.nom || !ouvrierForm.specialite) return;
    const db = getDatabase();
    const newRef = push(dbRef(db, 'ouvriers'));
    await set(newRef, {
      nom: ouvrierForm.nom,
      specialite: ouvrierForm.specialite,
      telephone: ouvrierForm.telephone,
      chantierId: ouvrierForm.chantierId,
      fonction: ouvrierForm.fonction,
      actif: true
    });
    setOuvrierForm({ nom: "", specialite: "", telephone: "", chantierId: "", fonction: "ouvrier" });
    setMessage({ type: "success", text: "Ouvrier ajouté !" });
  };

  const handleAddMateriau = async (e: FormEvent) => {
    e.preventDefault();
    if (!materiauForm.nom || !materiauForm.categorie) return;
    const db = getDatabase();
    const newRef = push(dbRef(db, 'materiaux'));
    await set(newRef, {
      nom: materiauForm.nom,
      categorie: materiauForm.categorie,
      prix_unitaire: Number(materiauForm.prix_unitaire),
      unite: materiauForm.unite,
      disponible: materiauForm.disponible
    });
    setMateriauForm({ nom: "", categorie: "", prix_unitaire: "", unite: "kg", disponible: true });
    setMessage({ type: "success", text: "Matériau ajouté !" });
  };

  return (
    <main className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-xl font-black capitalize text-[#FF7A00]">{section}</h1>
        
        {message && (
          <div className={`rounded-[12px] p-4 mb-4 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {message.text}
          </div>
        )}
        
        {loading ? <div className="animate-pulse space-y-3"><div className="h-12 rounded bg-white/5" /><div className="h-64 rounded bg-white/5" /></div> : (
          <>
            {section === "clients" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/5 px-4">
                  <Search size={18} className="text-white/40" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" />
                </div>
                <div className="overflow-x-auto rounded-[16px] border border-white/10">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-white/50">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nom</th>
                        <th className="px-4 py-3 font-bold">Email</th>
                        <th className="px-4 py-3 font-bold">Téléphone</th>
                        <th className="px-4 py-3 font-bold">Inscription</th>
                        <th className="px-4 py-3 font-bold">Activité</th>
                        <th className="px-4 py-3 font-bold">Statut</th>
                        <th className="px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => {
                        const act = statutActivite(c.lastLogin);
                        return (
                          <tr key={c.id} className="border-t border-white/10">
                            <td className="px-4 py-3 font-bold">{c.nom || "—"}</td>
                            <td className="px-4 py-3">{c.email || "—"}</td>
                            <td className="px-4 py-3">{c.telephone || "—"}</td>
                            <td className="px-4 py-3">{c.date_inscription || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${act.couleur} text-white`}>{act.texte}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.statut === "inactif" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>{c.statut || "actif"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => {}} className="flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-bold bg-white/10 text-white/70">
                                  <Eye size={14} /> Voir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {section === "chantiers" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chantiers.map((c) => (
                    <div key={c.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col h-full">
                      <h3 className="font-bold mb-2">{c.nom_projet || c.nom}</h3>
                      <p className="text-xs text-white/60 mb-1">{formatLocalisation(c.localisation)}</p>
                      <p className="text-xs mb-3">Statut: {c.statut || "—"}</p>
                      
                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => handleValider(c.id)}
                          disabled={actionLoading === c.id}
                          className="flex-1 rounded-[10px] bg-green-500/20 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                        >
                          ✅ {actionLoading === c.id ? "Activation..." : "Valider"}
                        </button>
                        <button
                          onClick={() => handleModifierChantier(c.id)}
                          className="flex-1 rounded-[10px] bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition"
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {section === "statistiques" && (
              <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 font-black text-[#FF7A00]">📊 Statistiques</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chantiers.map(c => ({ name: c.nom_projet || c.nom || "—", value: c.progression || 0 }))}>
                    <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
                    <YAxis stroke="#ffffff60" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {section === "partenaires" && (
              <div className="space-y-4">
                <form onSubmit={handleAddPartenaire} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 font-black text-[#FF7A00]">➕ Ajouter un partenaire</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Nom" value={partenaireForm.nom} onChange={e => setPartenaireForm({ ...partenaireForm, nom: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="text" placeholder="Description" value={partenaireForm.description} onChange={e => setPartenaireForm({ ...partenaireForm, description: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="file" accept="image/*" onChange={e => setPartenaireForm({ ...partenaireForm, photo: e.target.files?.[0] || null })} className="text-xs text-white/70" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={partenaireForm.actif} onChange={e => setPartenaireForm({ ...partenaireForm, actif: e.target.checked })} /> Actif</label>
                    <button type="submit" disabled={uploading} className="h-10 rounded-[10px] bg-[#FF7A00] font-bold disabled:opacity-50 sm:col-span-2">Ajouter</button>
                  </div>
                </form>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {partenaires.map((p) => (
                    <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                      {p.photo_url && <img src={p.photo_url} alt={p.nom} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                      <h4 className="font-bold">{p.nom}</h4>
                      <p className="text-xs text-white/60">{p.description}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${p.actif ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.actif ? "Actif" : "Inactif"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {section === "promotions" && (
              <div className="space-y-4">
                <form onSubmit={handleAddPromotion} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 font-black text-[#FF7A00]">➕ Ajouter une promotion</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Titre" value={promoForm.titre} onChange={e => setPromoForm({ ...promoForm, titre: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="text" placeholder="Description" value={promoForm.description} onChange={e => setPromoForm({ ...promoForm, description: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="date" value={promoForm.date_debut} onChange={e => setPromoForm({ ...promoForm, date_debut: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="date" value={promoForm.date_fin} onChange={e => setPromoForm({ ...promoForm, date_fin: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="file" accept="image/*" onChange={e => setPromoForm({ ...promoForm, image: e.target.files?.[0] || null })} className="text-xs text-white/70" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={promoForm.active} onChange={e => setPromoForm({ ...promoForm, active: e.target.checked })} /> Active</label>
                    <button type="submit" disabled={uploading} className="h-10 rounded-[10px] bg-[#FF7A00] font-bold disabled:opacity-50 sm:col-span-2">Ajouter</button>
                  </div>
                </form>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                      {promo.image_url && <img src={promo.image_url} alt={promo.titre} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                      <h4 className="font-bold">{promo.titre}</h4>
                      <p className="text-xs text-white/60">{promo.description}</p>
                      <p className="text-xs mt-1">Du {promo.date_debut} au {promo.date_fin}</p>
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${promo.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{promo.active ? "Active" : "Inactive"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {section === "ouvriers" && (
              <div className="space-y-4">
                <form onSubmit={handleAddOuvrier} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 font-black text-[#FF7A00]">➕ Ajouter un ouvrier</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="text" placeholder="Nom" value={ouvrierForm.nom} onChange={e => setOuvrierForm({ ...ouvrierForm, nom: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="text" placeholder="Spécialité" value={ouvrierForm.specialite} onChange={e => setOuvrierForm({ ...ouvrierForm, specialite: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="tel" placeholder="Téléphone" value={ouvrierForm.telephone} onChange={e => setOuvrierForm({ ...ouvrierForm, telephone: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <select value={ouvrierForm.chantierId} onChange={e => setOuvrierForm({ ...ouvrierForm, chantierId: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="">Affecter à un chantier</option>
                      {chantiers.map(c => (
                        <option key={c.id} value={c.id}>{c.nom_projet || c.nom}</option>
                      ))}
                    </select>
                    <select value={ouvrierForm.fonction} onChange={e => setOuvrierForm({ ...ouvrierForm, fonction: e.target.value as "ouvrier" | "chef_de_chantier" })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="ouvrier">Ouvrier</option>
                      <option value="chef_de_chantier">Chef de chantier</option>
                    </select>
                    <button type="submit" className="h-10 rounded-[10px] bg-[#FF7A00] font-bold sm:col-span-2">Ajouter</button>
                  </div>
                </form>
                <div className="space-y-3">
                  {ouvriers.map((o) => {
                    const chantier = chantiers.find(c => c.id === o.chantierId);
                    return (
                      <div key={o.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold">{o.nom}</h4>
                          <p className="text-xs text-white/60">Spécialité: {o.specialite}</p>
                          {o.chantierId && <p className="text-xs text-white/60">📍 Affecté à: {chantier?.nom_projet || chantier?.nom || "—"}</p>}
                          {o.fonction === "chef_de_chantier" && <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400">👑 Chef de chantier</span>}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${o.actif ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{o.actif ? "Actif" : "Inactif"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {section === "materiaux" && (
              <div className="space-y-4">
                <form onSubmit={handleAddMateriau} className="rounded-[16px] border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 font-black text-[#FF7A00]">➕ Ajouter un matériau</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input type="text" placeholder="Nom" value={materiauForm.nom} onChange={e => setMateriauForm({ ...materiauForm, nom: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <select value={materiauForm.categorie} onChange={e => setMateriauForm({ ...materiauForm, categorie: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="">Catégorie</option>
                      <option value="Gros œuvre">Gros œuvre</option>
                      <option value="Finition">Finition</option>
                      <option value="Électricité">Électricité</option>
                      <option value="Plomberie">Plomberie</option>
                    </select>
                    <input type="number" placeholder="Prix unitaire" value={materiauForm.prix_unitaire} onChange={e => setMateriauForm({ ...materiauForm, prix_unitaire: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <select value={materiauForm.unite} onChange={e => setMateriauForm({ ...materiauForm, unite: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="kg">kg</option>
                      <option value="m²">m²</option>
                      <option value="m3">m³</option>
                      <option value="piece">pièce</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={materiauForm.disponible} onChange={e => setMateriauForm({ ...materiauForm, disponible: e.target.checked })} /> Disponible</label>
                  </div>
                  <button type="submit" className="mt-3 h-10 rounded-[10px] bg-[#FF7A00] font-bold">Ajouter</button>
                </form>
                <div className="overflow-x-auto rounded-[16px] border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-white/50">
                      <tr>
                        <th className="px-4 py-2 font-bold">Nom</th>
                        <th className="px-4 py-2 font-bold">Catégorie</th>
                        <th className="px-4 py-2 font-bold">Prix</th>
                        <th className="px-4 py-2 font-bold">Unité</th>
                        <th className="px-4 py-2 font-bold">Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiaux.map((m) => (
                        <tr key={m.id} className="border-t border-white/10">
                          <td className="px-4 py-2">{m.nom}</td>
                          <td className="px-4 py-2">{m.categorie}</td>
                          <td className="px-4 py-2">{m.prix_unitaire} F</td>
                          <td className="px-4 py-2">{m.unite}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${m.disponible ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{m.disponible ? "Oui" : "Non"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#111827] p-4 text-white"><div className="h-12 rounded bg-white/5" /><div className="h-64 rounded bg-white/5" /></div>}><AdminContent /></Suspense>;
}