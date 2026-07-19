"use client";

import { useEffect, useState, useMemo } from "react";
import { Hammer, Phone, Mail, Users } from "lucide-react";
import { ref, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

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
interface EquipeHierarchiqueClientProps {
  chantierId: string;
}

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
function AvatarMembre({ nom, photo, size = "lg" }: { nom: string; photo?: string; size?: "sm" | "md" | "lg" }) {
  const colorIndex = nom.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[colorIndex];
  
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-14 h-14 text-base"
  };

  if (photo) {
    return (
      <img 
        src={photo} 
        alt={nom} 
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`} 
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-black shadow-md`}>
      {getInitials(nom)}
    </div>
  );
}

/**
 * Composant EquipeHierarchiqueClient
 * - Affiche l'équipe de manière hiérarchique et professionnelle
 * - Chefs de chantier avec leurs ouvriers
 * - Chefs d'équipe par spécialité
 * - Avatars avec initiales si pas de photo
 */
export default function EquipeHierarchiqueClient({ chantierId }: EquipeHierarchiqueClientProps) {
  const { database } = getFirebaseServices();
  const [equipe, setEquipe] = useState<MembreEquipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger l'équipe depuis Firebase
  useEffect(() => {
    if (!chantierId) return;

    const unsub: Unsubscribe = onValue(ref(database, 'equipes'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allEquipe = Object.entries(data)
          .map(([id, e]: [string, any]) => ({ id, ...e }))
          .filter((e: MembreEquipe) => String(e.chantierId) === String(chantierId) && e.actif)
          .sort((a: MembreEquipe, b: MembreEquipe) => {
            const orderA = a.fonction === "chef_de_chantier" ? 0 : a.fonction === "chef_equipe" ? 1 : 2;
            const orderB = b.fonction === "chef_de_chantier" ? 0 : b.fonction === "chef_equipe" ? 1 : 2;
            if (orderA !== orderB) return orderA - orderB;
            return (a.ouvrierNom || "").localeCompare(b.ouvrierNom || "");
          });
        setEquipe(allEquipe);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erreur chargement équipe:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [chantierId, database]);

  // Calculs mémorisés
  const chefsDeChantier = useMemo(() => 
    equipe.filter(m => m.fonction === "chef_de_chantier"), 
    [equipe]
  );

  const chefsEquipeParSpecialite = useMemo(() => {
    const grouped: Record<string, MembreEquipe[]> = {};
    equipe
      .filter(m => m.fonction === "chef_equipe")
      .forEach(chef => {
        const specialite = chef.specialite;
        if (!grouped[specialite]) grouped[specialite] = [];
        grouped[specialite].push(chef);
      });
    return grouped;
  }, [equipe]);

  const ouvriersIndependants = useMemo(() => 
    equipe.filter(m => m.fonction === "ouvrier" && !m.chefId), 
    [equipe]
  );

  const getOuvriersDeChef = (chefId: string) => {
    return equipe.filter(m => m.fonction === "ouvrier" && m.chefId === chefId);
  };

  const formatTelephone = (tel?: string) => {
    if (!tel) return null;
    return tel.replace(/[^0-9]/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  };

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded-[16px] bg-[#E7EBF5] w-1/3"></div>
          <div className="h-24 rounded-[16px] bg-[#E7EBF5]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-2xl text-[var(--navy)] flex items-center gap-3">
          👷 Votre Équipe sur ce Chantier
        </h3>
        <span className="bg-[#FF7A00] text-white px-4 py-2 rounded-full font-black text-sm">
          {equipe.length} membres
        </span>
      </div>

      {equipe.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 rounded-2xl">
          <p className="text-gray-500 text-lg">L'équipe sera assignée prochainement</p>
          <p className="text-gray-400 text-sm mt-2">
            Notre administration sélectionne les meilleurs professionnels pour votre projet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. CHEFS DE CHANTIER AVEC LEURS ÉQUIPES */}
          {chefsDeChantier.map((chef) => (
            <div key={chef.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <AvatarMembre nom={chef.ouvrierNom} photo={chef.ouvrierPhoto} size="lg" />

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-xl text-[var(--navy)]">{chef.ouvrierNom}</h4>
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                      👑 Chef de Chantier
                    </span>
                  </div>

                  <p className="text-gray-600 font-medium mb-1">🔧 {chef.specialite}</p>

                  {chef.description && (
                    <p className="text-sm text-gray-500 italic mb-3">{chef.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {chef.telephone && (
                      <a href={`tel:${chef.telephone}`} className="flex items-center gap-1 text-[#FF7A00] hover:underline font-medium">
                        📞 {formatTelephone(chef.telephone)}
                      </a>
                    )}
                    {chef.email && (
                      <a href={`mailto:${chef.email}`} className="flex items-center gap-1 text-[#0B5FFF] hover:underline font-medium">
                        📧 {chef.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* ÉQUIPE SOUS CE CHEF */}
              {getOuvriersDeChef(chef.id).length > 0 && (
                <div className="mt-6 pt-4 border-t-2 border-yellow-200">
                  <h5 className="font-bold text-[var(--navy)] mb-3 flex items-center gap-2">
                    👷‍♂️ Équipe sous sa responsabilité ({getOuvriersDeChef(chef.id).length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getOuvriersDeChef(chef.id).map((ouvrier) => (
                      <div key={ouvrier.id} className="bg-white rounded-xl p-3 border-2 border-gray-200 hover:border-[#FF7A00] transition shadow-sm">
                        <div className="flex items-center gap-3">
                          <AvatarMembre nom={ouvrier.ouvrierNom} photo={ouvrier.ouvrierPhoto} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--navy)] text-sm truncate">{ouvrier.ouvrierNom}</p>
                            <p className="text-xs text-gray-500 truncate">{ouvrier.specialite}</p>
                            {ouvrier.telephone && (
                              <p className="text-xs text-gray-400 mt-1">📞 {formatTelephone(ouvrier.telephone)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 2. CHEFS D'ÉQUIPE PAR SPÉCIALITÉ */}
          {Object.entries(chefsEquipeParSpecialite).map(([specialite, chefs]) => (
            <div key={specialite} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-5">
              <h4 className="font-bold text-lg text-[var(--navy)] mb-3 flex items-center gap-2">
                🔨 {specialite.charAt(0).toUpperCase() + specialite.slice(1)}
              </h4>

              <div className="space-y-3">
                {chefs.map((chef) => (
                  <div key={chef.id} className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <AvatarMembre nom={chef.ouvrierNom} photo={chef.ouvrierPhoto} size="sm" />
                      <div className="flex-1">
                        <p className="font-bold text-[var(--navy)] text-sm">{chef.ouvrierNom}</p>
                        {chef.telephone && (
                          <p className="text-xs text-gray-500">📞 {formatTelephone(chef.telephone)}</p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        Chef
                      </span>
                    </div>

                    {chef.description && (
                      <p className="text-xs text-gray-500 mt-1 pl-11">{chef.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 3. OUVRIERS INDÉPENDANTS */}
          {ouvriersIndependants.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-5 border-2 border-gray-200">
              <h4 className="font-bold text-[var(--navy)] mb-3 flex items-center gap-2">
                👷 Ouvriers indépendants
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ouvriersIndependants.map((ouvrier) => (
                  <div key={ouvrier.id} className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <AvatarMembre nom={ouvrier.ouvrierNom} photo={ouvrier.ouvrierPhoto} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[var(--navy)] text-sm truncate">{ouvrier.ouvrierNom}</p>
                        <p className="text-xs text-gray-500 truncate">{ouvrier.specialite}</p>
                      </div>
                    </div>
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