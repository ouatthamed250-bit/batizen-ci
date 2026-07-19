"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { Hammer, Upload, X, User, Phone, Mail, Briefcase, Users, Plus, Trash2, Edit } from "lucide-react";
import { ref, push, onValue, update, remove, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Types pour les membres d'équipe
type MembreEquipe = {
  id: string;
  chantierId: string;
  ouvrierId: string;
  ouvrierNom: string;
  ouvrierPhoto?: string;
  specialite: string;
  fonction: "chef_de_chantier" | "chef_equipe" | "ouvrier";
  chefId?: string | null;
  chefNom?: string;
  telephone?: string;
  email?: string;
  description?: string;
  dateAffectation: number;
  actif: boolean;
};

// Props du composant
interface GestionEquipeHierarchiqueProps {
  chantierId: string;
}

// Spécialités disponibles
const SPECIALITES = [
  "maçon", "peintre", "électricien", "plombier", "charpentier", 
  "menuisier", "couvreur", "serrurier", "tuilier", "carreleur", "autre"
];

// Couleurs pour les avatars
const AVATAR_COLORS = [
  ["bg-red-500", "bg-red-600"],
  ["bg-orange-500", "bg-orange-600"],
  ["bg-amber-500", "bg-amber-600"],
  ["bg-yellow-500", "bg-yellow-600"],
  ["bg-lime-500", "bg-lime-600"],
  ["bg-green-500", "bg-green-600"],
  ["bg-emerald-500", "bg-emerald-600"],
  ["bg-teal-500", "bg-teal-600"],
  ["bg-cyan-500", "bg-cyan-600"],
  ["bg-blue-500", "bg-blue-600"],
  ["bg-indigo-500", "bg-indigo-600"],
  ["bg-violet-500", "bg-violet-600"],
  ["bg-purple-500", "bg-purple-600"],
  ["bg-fuchsia-500", "bg-fuchsia-600"],
  ["bg-pink-500", "bg-pink-600"],
  ["bg-rose-500", "bg-rose-600"],
];

// Fonction pour obtenir les initiales
function getInitials(nom: string): string {
  if (!nom) return "?";
  return nom
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// Composant Avatar
function Avatar({ nom, photo, size = 12 }: { nom: string; photo?: string; size?: number }) {
  const colorIndex = nom.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[colorIndex];
  
  const sizeClass = `w-${size} h-${size}`;

  if (photo) {
    return (
      <img 
        src={photo} 
        alt={nom} 
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-lg`} 
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-black shadow-lg`}>
      {getInitials(nom)}
    </div>
  );
}

/**
 * Composant GestionEquipeHierarchique - Admin
 * - Gestion complète de l'équipe avec hiérarchie
 * - Upload photos avec Cloudinary
 * - Filtrage par spécialité
 * - Recherche par nom
 */
export default function GestionEquipeHierarchique({ chantierId }: GestionEquipeHierarchiqueProps) {
  const { database } = getFirebaseServices();
  const [equipe, setEquipe] = useState<MembreEquipe[]>([]);
  const [ouvriersLibres, setOuvriersLibres] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState<string>("tous");

  // Formulaire
  const [formData, setFormData] = useState({
    ouvrierNom: "",
    specialite: "maçon",
    fonction: "ouvrier" as "chef_de_chantier" | "chef_equipe" | "ouvrier",
    chefId: "",
    telephone: "",
    email: "",
    description: "",
    photo: ""
  });

  // Charger l'équipe
  useEffect(() => {
    if (!chantierId) return;

    const unsub: Unsubscribe = onValue(ref(database, 'equipes'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allEquipe = Object.entries(data)
          .map(([id, e]: [string, any]) => ({ id, ...e }))
          .filter((e: MembreEquipe) => String(e.chantierId) === String(chantierId) && e.actif)
          .sort((a: MembreEquipe, b: MembreEquipe) => {
            // Chefs de chantier en premier, puis chefs d'équipe, puis ouvriers
            const orderA = a.fonction === "chef_de_chantier" ? 0 : a.fonction === "chef_equipe" ? 1 : 2;
            const orderB = b.fonction === "chef_de_chantier" ? 0 : b.fonction === "chef_equipe" ? 1 : 2;
            if (orderA !== orderB) return orderA - orderB;
            return (a.ouvrierNom || "").localeCompare(b.ouvrierNom || "");
          });
        setEquipe(allEquipe);
      }
    });

    return () => unsub();
  }, [chantierId, database]);

  // Charger les ouvriers libres (pas encore affectés)
  useEffect(() => {
    const unsub: Unsubscribe = onValue(ref(database, 'ouvriers'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allOuvriers = Object.entries(data)
          .map(([id, o]: [string, any]) => ({ id, ...o }))
          .filter((o: any) => !o.chantierId || o.chantierId === chantierId);
        setOuvriersLibres(allOuvriers);
      }
    });
    return () => unsub();
  }, [chantierId, database]);

  // Upload photo
  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData({ ...formData, photo: url });
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
    }
  };

  // Ajouter un membre
  const handleAddMembre = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.ouvrierNom.trim()) {
      alert("Le nom est obligatoire");
      return;
    }

    try {
      const newMembre: any = {
        chantierId: String(chantierId),
        ouvrierNom: formData.ouvrierNom.trim(),
        specialite: formData.specialite,
        fonction: formData.fonction,
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        ouvrierPhoto: formData.photo.trim(),
        chefId: formData.fonction === "ouvrier" && formData.chefId ? formData.chefId : null,
        dateAffectation: Date.now(),
        actif: true
      };

      // Mettre à jour le nom du chef si ouvrier
      if (newMembre.chefId) {
        const chef = equipe.find(m => m.id === newMembre.chefId);
        if (chef) newMembre.chefNom = chef.ouvrierNom;
      }

      await push(ref(database, 'equipes'), newMembre);
      
      alert(`✅ ${formData.ouvrierNom} ajouté à l'équipe`);
      setShowForm(false);
      setFormData({
        ouvrierNom: "",
        specialite: "maçon",
        fonction: "ouvrier",
        chefId: "",
        telephone: "",
        email: "",
        description: "",
        photo: ""
      });
    } catch (error) {
      console.error("Erreur ajout:", error);
      alert("Erreur lors de l'ajout du membre");
    }
  };

  // Supprimer un membre
  const handleDelete = async (membreId: string) => {
    if (!confirm("Supprimer ce membre de l'équipe ?")) return;
    try {
      await update(ref(database, `equipes/${membreId}`), { actif: false });
      alert("✅ Membre retiré de l'équipe");
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Filtrer l'équipe
  const equipeFiltree = equipe.filter(m => {
    const matchSearch = m.ouvrierNom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSpecialite = filterSpecialite === "tous" || m.specialite === filterSpecialite;
    return matchSearch && matchSpecialite;
  });

  // Grouper par spécialité pour les chefs d'équipe
  const chefsEquipeParSpecialite = equipeFiltree
    .filter(m => m.fonction === "chef_equipe")
    .reduce((acc, chef) => {
      const specialite = chef.specialite;
      if (!acc[specialite]) acc[specialite] = [];
      acc[specialite].push(chef);
      return acc;
    }, {} as Record<string, MembreEquipe[]>);

  // Chefs de chantier
  const chefsDeChantier = equipeFiltree.filter(m => m.fonction === "chef_de_chantier");

  // Ouvriers par chef
  const getOuvriersDeChef = (chefId: string) => {
    return equipeFiltree.filter(m => m.fonction === "ouvrier" && m.chefId === chefId);
  };

  // Ouvriers sans chef (ouvriers indépendants)
  const ouvriersIndependants = equipeFiltree.filter(m => m.fonction === "ouvrier" && !m.chefId);

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-black text-[#FF7A00]">
          <Hammer size={20} /> 👷 Gestion de l'Équipe
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-[8px] bg-[#FF7A00] px-3 py-1 text-xs font-bold text-white"
        >
          <Plus size={14} /> {showForm ? "Annuler" : "Ajouter"}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un membre..."
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

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleAddMembre} className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/70 mb-1 block">Nom complet *</label>
              <input
                type="text"
                value={formData.ouvrierNom}
                onChange={(e) => setFormData({ ...formData, ouvrierNom: e.target.value })}
                className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
                required
              />
            </div>

            <div>
              <label className="text-xs text-white/70 mb-1 block">Spécialité</label>
              <select
                value={formData.specialite}
                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
              >
                {SPECIALITES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/70 mb-1 block">Fonction</label>
              <select
                value={formData.fonction}
                onChange={(e) => setFormData({ ...formData, fonction: e.target.value as any })}
                className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
              >
                <option value="chef_de_chantier">Chef de chantier</option>
                <option value="chef_equipe">Chef d'équipe</option>
                <option value="ouvrier">Ouvrier</option>
              </select>
            </div>

            {formData.fonction === "ouvrier" && chefsDeChantier.length > 0 && (
              <div>
                <label className="text-xs text-white/70 mb-1 block">Chef responsable</label>
                <select
                  value={formData.chefId}
                  onChange={(e) => setFormData({ ...formData, chefId: e.target.value })}
                  className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
                >
                  <option value="">Aucun chef (indépendant)</option>
                  {chefsDeChantier.map(chef => (
                    <option key={chef.id} value={chef.id}>{chef.ouvrierNom}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-white/70 mb-1 block">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
                placeholder="07 00 00 00 00"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 mb-1 block">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-8 rounded-[8px] bg-white/10 px-3 text-xs font-bold text-white outline-none ring-1 ring-white/10"
                placeholder="email@exemple.com"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/70 mb-1 block">Photo de profil</label>
              <div className="flex items-center gap-2">
                {formData.photo && (
                  <img src={formData.photo} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                )}
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition">
                    {uploading ? "Upload..." : formData.photo ? "Changer" : "Ajouter photo"}
                  </span>
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/70 mb-1 block">Description / Expérience</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-[8px] bg-white/10 px-3 py-2 text-xs font-bold text-white outline-none ring-1 ring-white/10"
                placeholder="Expérience, compétences..."
                rows={2}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full h-10 rounded-[8px] bg-green-500 text-sm font-bold text-white hover:bg-green-600 transition disabled:opacity-50"
          >
            ✅ Ajouter à l'équipe
          </button>
        </form>
      )}

      {/* Affichage de l'équipe */}
      {equipeFiltree.length === 0 ? (
        <p className="text-sm text-white/50">Aucun membre dans l'équipe.</p>
      ) : (
        <div className="space-y-4">
          {/* Chefs de chantier */}
          {chefsDeChantier.map((chef) => (
            <div key={chef.id} className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Avatar nom={chef.ouvrierNom} photo={chef.ouvrierPhoto} size={12} />
                <div>
                  <p className="font-bold text-white text-sm">{chef.ouvrierNom}</p>
                  <p className="text-yellow-400 text-xs font-semibold">{chef.specialite} • {chef.telephone}</p>
                </div>
                <span className="ml-auto text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-black">
                  👑 Chef de Chantier
                </span>
              </div>

              {/* Ouvriers sous ce chef */}
              {getOuvriersDeChef(chef.id).length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-yellow-500/30">
                  <p className="text-xs text-white/60 mb-2">Équipe ({getOuvriersDeChef(chef.id).length}) :</p>
                  <div className="flex flex-wrap gap-2">
                    {getOuvriersDeChef(chef.id).map(ouvrier => (
                      <div key={ouvrier.id} className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                        <Avatar nom={ouvrier.ouvrierNom} photo={ouvrier.ouvrierPhoto} size={6} />
                        <span className="text-xs text-white">{ouvrier.ouvrierNom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Chefs d'équipe et leurs ouvriers */}
          {Object.entries(chefsEquipeParSpecialite).map(([specialite, chefs]) => (
            <div key={specialite} className="space-y-2">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                {specialite.charAt(0).toUpperCase() + specialite.slice(1)}
              </h4>
              {chefs.map((chef) => (
                <div key={chef.id} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar nom={chef.ouvrierNom} photo={chef.ouvrierPhoto} size={8} />
                    <span className="text-sm font-bold text-white">{chef.ouvrierNom}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      Chef
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Ouvriers indépendants */}
          {ouvriersIndependants.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-white/70 text-xs">Ouvriers indépendants</h4>
              <div className="flex flex-wrap gap-2">
                {ouvriersIndependants.map((ouvrier) => (
                  <div key={ouvrier.id} className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                    <Avatar nom={ouvrier.ouvrierNom} photo={ouvrier.ouvrierPhoto} size={6} />
                    <span className="text-xs text-white">{ouvrier.ouvrierNom}</span>
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