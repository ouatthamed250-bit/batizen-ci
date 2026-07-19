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
import { getDatabase, ref as dbRef, onValue, update, push, set, get, remove } from "firebase/database";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

type Client = {
  id: string;
  nom?: string;
  displayName?: string;
  email?: string;
  telephone?: string;
  date_inscription?: string;
  statut?: string;
  lastLogin?: string | number;
  isOnline?: boolean;
  lastSeen?: number;
  chantierIds?: string[];
  chantiers?: Chantier[];
  rapports?: any[];
  paiements?: any[];
  prochainRDV?: string;
  rdvProche?: boolean;
  dernierMessage?: any;
  rdvConfirmes?: any[];
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
  dateCreation?: number;
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
  telephone?: string;
  email?: string;
  description?: string;
  tarif?: number;
  photoUrl?: string;
  chantierId?: string;
  fonction: "ouvrier" | "chef_equipe" | "chef_de_chantier";
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

// ✅ Fonction de calcul de santé d'un chantier
function getSanteChantier(
  chantier: any,
  rapports: any[],
  paiements: any[]
): { couleur: "green" | "orange" | "red"; label: string; priorite: number } {
  const rapportsEnRetard = rapports.filter(r => r.statut === "retard");
  if (rapportsEnRetard.length > 0) {
    return { couleur: "red", label: "⚠️ Retard signalé", priorite: 3 };
  }

  const paiementsEnAttente = paiements.filter(p => p.statut === "en_attente");
  if (paiementsEnAttente.length > 0) {
    return { couleur: "orange", label: "💰 Paiement en attente", priorite: 2 };
  }

  const rapportsTries = [...rapports].sort((a, b) => (b.dateCreation || 0) - (a.dateCreation || 0));
  const dernierRapport = rapportsTries[0];
  if (rapports.length > 0 && dernierRapport && (Date.now() - (dernierRapport.dateCreation || 0)) > 7 * 24 * 60 * 60 * 1000) {
    return { couleur: "orange", label: "📋 Aucun rapport récent", priorite: 2 };
  }

  return { couleur: "green", label: "✅ Dans les délais", priorite: 1 };
}

// ✅ Fonction de calcul du score de priorité d'un client
const getPrioriteClient = (client: any): number => {
  let score = 0;
  
  const aujourdhui = new Date().toISOString().split('T')[0];
  const demain = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  if (client.rdvProche === true || client.prochainRDV === aujourdhui || client.prochainRDV === demain) {
    score += 100;
  }
  
  const paiementsEnAttente = client.paiements?.filter((p: any) => p.statut === "en_attente");
  if (paiementsEnAttente && paiementsEnAttente.length > 0) {
    score += 80;
  }
  
  const rapportsEnRetard = client.rapports?.filter((r: any) => r.statut === "retard");
  if (rapportsEnRetard && rapportsEnRetard.length > 0) {
    score += 70;
  }
  
  const rapportsTries = [...(client.rapports || [])].sort((a: any, b: any) => (b.dateCreation || 0) - (a.dateCreation || 0));
  const dernierRapport = rapportsTries[0];
  if (dernierRapport && (Date.now() - (dernierRapport.dateCreation || 0)) > 14 * 24 * 60 * 60 * 1000) {
    score += 50;
  }
  
  if (client.chantiers && client.chantiers.length > 0) {
    const chantiersRecents = client.chantiers.filter((c: any) => 
      c.dateCreation && (Date.now() - c.dateCreation) < 30 * 24 * 60 * 60 * 1000
    );
    if (chantiersRecents.length > 0) score += 20;
  }
  
  return score;
};

// ✅ Fonction de formatage du temps relatif
const getTempsRelatif = (timestamp: number): string => {
  const secondes = Math.floor((Date.now() - timestamp) / 1000);
  
  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)} j`;
  
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ✅ Fonction pour trouver la dernière interaction
const getLastInteraction = (client: any): { type: string; date: number; label: string } | null => {
  const interactions: { type: string; date: number; label: string }[] = [];
  
  if (client.dernierMessage?.dateEnvoi) {
    interactions.push({ 
      type: "message", 
      date: client.dernierMessage.dateEnvoi, 
      label: "💬 Message" 
    });
  }
  
  const dernierPaiement = client.paiements
    ?.filter((p: any) => p.statut === "valide")
    .sort((a: any, b: any) => (b.dateValidation || 0) - (a.dateValidation || 0))[0];
  if (dernierPaiement?.dateValidation) {
    interactions.push({ 
      type: "paiement", 
      date: dernierPaiement.dateValidation, 
      label: "💰 Paiement" 
    });
  }
  
  const rapportsTries = [...(client.rapports || [])].sort((a: any, b: any) => (b.dateCreation || 0) - (a.dateCreation || 0));
  const dernierRapport = rapportsTries[0];
  if (dernierRapport?.dateCreation) {
    interactions.push({ 
      type: "rapport", 
      date: dernierRapport.dateCreation, 
      label: "📋 Rapport" 
    });
  }
  
  const rdvTries = [...(client.rdvConfirmes || [])].sort((a: any, b: any) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
  const dernierRDV = rdvTries[0];
  if (dernierRDV?.date) {
    interactions.push({ 
      type: "rdv", 
      date: new Date(dernierRDV.date).getTime(), 
      label: "📅 RDV" 
    });
  }
  
  if (interactions.length === 0) return null;
  
  return interactions.sort((a, b) => b.date - a.date)[0];
};

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
  const [allRapports, setAllRapports] = useState<any[]>([]);
  const [allPaiements, setAllPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredClients = clients.filter((client: any) => {
    if (!searchTerm.trim()) return true;
    
    const term = normalizeText(searchTerm);
    const nom = normalizeText(client.displayName || client.nom || "");
    const email = normalizeText(client.email || "");
    const telephone = normalizeText(client.telephone || client.phone || "");
    
    return nom.includes(term) || email.includes(term) || telephone.includes(term);
  });

  const filteredAndSortedClients = [...filteredClients].sort((a: any, b: any) => {
    const scoreA = getPrioriteClient(a);
    const scoreB = getPrioriteClient(b);
    
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    return (a.displayName || "").localeCompare(b.displayName || "");
  });

  if (authLoading) return <div className="min-h-screen bg-[#111827] flex items-center justify-center"><p className="text-white">Chargement...</p></div>;
  if (!user || user.role !== "admin") return <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4"><div className="text-center"><h1 className="text-2xl font-bold text-red-600">Accès refusé</h1><p className="mt-4 text-white/60">Vous devez être administrateur.</p></div></div>;

useEffect(() => {
    if (!user?.uid) {
      console.log("⏳ Attente authentification admin...");
      return;
    }

    const db = getDatabase();

    console.log("🔍 [DIAG] User connecté:", {
      uid: user?.uid,
      role: user?.role,
      email: user?.email,
      displayName: user?.displayName
    });

    const usersRef = dbRef(db, 'users');
    const chantiersRef = dbRef(db, 'chantiers');
    const rapportsRef = dbRef(db, 'rapports');
    const paiementsRef = dbRef(db, 'paiements');
    const messagesRef = dbRef(db, 'messages');
    const rdvRef = dbRef(db, 'rendezvous');
    
    const unsubRapports = onValue(rapportsRef, (snapshot) => {
      const data = snapshot.val();
      setAllRapports(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });

    const unsubPaiements = onValue(paiementsRef, (snapshot) => {
      const data = snapshot.val();
      setAllPaiements(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });
    
    onValue(usersRef, (snapshot) => {
      const userData = snapshot.val();
      console.log("🔐 [AUTH] Données user Firebase:", userData);
      
      if (userData?.role !== "admin" && userData?.userRole !== "admin") {
        console.warn("⚠️ [AUTH] ALERTE: Rôle admin non détecté ! Role trouvé:", userData?.role || userData?.userRole);
      } else {
        console.log("✅ [AUTH] Rôle admin confirmé");
      }
    }, { onlyOnce: true });

    const unsubClients = onValue(usersRef, (snapshot) => {
      console.log("📦 [DIAG] Snapshot reçu. Existe ?", snapshot.exists());
      
      const data = snapshot.val();
      if (!data) {
        console.log("❌ [DIAG] Aucune donnée dans /users");
        setClients([]);
        return;
      }

      const allUsers = Object.entries(data);
      console.log(`👥 [DIAG] Total users trouvés: ${allUsers.length}`);

      allUsers.forEach(([id, u]: [string, any]) => {
        console.log(`   User ${id}:`, {
          role: u.role,
          userRole: u.userRole,
          displayName: u.displayName || u.nom,
          email: u.email
        });
      });

      const clientsList = allUsers
        .filter(([id, u]: [string, any]) => {
          const roleValue = u.role || u.userRole || "";
          const isClient = roleValue === "client";
          
          if (isClient) {
            console.log(`  ✅ [DIAG] Client détecté: ${id} (${u.displayName || u.nom})`);
          }
          
          return isClient;
        })
        .map(([id, u]: [string, any]) => ({ 
          id, 
          ...u,
          displayName: u.displayName || u.nom || "Sans nom",
          role: u.role || u.userRole || "unknown"
        }));

      console.log(`✅ [DIAG] Clients filtrés: ${clientsList.length}`);

      if (clientsList.length > 0) {
        Promise.all(clientsList.map(async (client) => {
          const chantiersSnap = await get(chantiersRef);
          const allChantiers = chantiersSnap.val() || {};
          
          const clientChantiers = Object.entries(allChantiers)
            .filter(([_, c]: [string, any]) => c.userId === client.id || c.client_id === client.id)
            .map(([id, c]: [string, any]) => ({ id, ...c }));

          const rapportsSnap = await get(rapportsRef);
          const allRapportsData = rapportsSnap.val() || {};
          const clientRapports = Object.entries(allRapportsData)
            .filter(([_, r]: [string, any]) => clientChantiers.some(ch => ch.id === r.chantierId))
            .map(([id, r]: [string, any]) => ({ id, ...r }));

          const paiementsSnap = await get(paiementsRef);
          const allPaiementsData = paiementsSnap.val() || {};
          const clientPaiements = Object.entries(allPaiementsData)
            .filter(([_, p]: [string, any]) => clientChantiers.some(ch => ch.id === p.chantierId))
            .map(([id, p]: [string, any]) => ({ id, ...p }));

          const messagesSnap = await get(messagesRef);
          const allMessagesData = messagesSnap.val() || {};
          const clientMessages = Object.entries(allMessagesData)
            .filter(([_, m]: [string, any]) => m.clientId === client.id || m.senderId === client.id)
            .map(([id, m]: [string, any]) => ({ id, ...m }));
          const dernierMessage = clientMessages.sort((a: any, b: any) => (b.dateEnvoi || 0) - (a.dateEnvoi || 0))[0];

          const rdvSnap = await get(rdvRef);
          const allRdvData = rdvSnap.val() || {};
          const clientRdvConfirmes = Object.entries(allRdvData)
            .filter(([_, r]: [string, any]) => 
              clientChantiers.some(ch => ch.id === r.chantierId) && 
              (r.statut === "confirme_admin" || r.statut === "confirme_client")
            )
            .map(([id, r]: [string, any]) => ({ id, ...r }));
          
          return { ...client, chantiers: clientChantiers, rapports: clientRapports, paiements: clientPaiements, dernierMessage, rdvConfirmes: clientRdvConfirmes };
        })).then(clientsWithChantiers => {
          console.log("✅ Clients avec chantiers:", clientsWithChantiers.length);
          setClients(clientsWithChantiers);
        });
      } else {
        setClients([]);
      }
    }, (error) => {
      console.error("❌ [DIAG] Erreur Firebase:", error);
    });

    console.log("🔓 ADMIN MODE - Chargement de TOUS les chantiers sans filtre");
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
      if (data) {
        const partenairesData = Object.entries(data)
          .filter(([id, p]: [string, any]) => p.actif === true)
          .map(([id, p]: [string, any]) => ({ id, ...p }));
        setPartenaires(partenairesData);
      } else {
        setPartenaires([]);
      }
    });

const promotionsRef = dbRef(db, 'promotions');
    const unsubPromotions = onValue(promotionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const promotionsData = Object.entries(data)
          .filter(([id, p]: [string, any]) => p.active === true)
          .map(([id, p]: [string, any]) => ({ id, ...p }));
        setPromotions(promotionsData);
      } else {
        setPromotions([]);
      }
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
      unsubRapports();
      unsubPaiements();
    };
  }, []);

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

  const handleImageUpload = async (file: File): Promise<string> => {
    return await uploadToCloudinary(file);
  };

  const [partenaireForm, setPartenaireForm] = useState({ nom: "", description: "", photo: null as File | null, actif: true });
  const [promoForm, setPromoForm] = useState({ titre: "", description: "", image: null as File | null, date_debut: "", date_fin: "", active: true });
  const [ouvrierForm, setOuvrierForm] = useState({ 
    nom: "", 
    specialite: "", 
    telephone: "", 
    email: "",
    description: "",
    tarif: "",
    photo: null as File | null,
    chantierId: "", 
    fonction: "ouvrier" as "ouvrier" | "chef_equipe" | "chef_de_chantier" 
  });
  const [materiauForm, setMateriauForm] = useState({ nom: "", categorie: "", prix_unitaire: "", unite: "kg", disponible: true });

  const handleAddPartenaire = async (e: FormEvent) => {
    e.preventDefault();
    if (!partenaireForm.nom) return;
    let photo_url = "";
    if (partenaireForm.photo) {
      photo_url = await handleImageUpload(partenaireForm.photo);
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
      image_url = await handleImageUpload(promoForm.image);
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

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Supprimer cette promotion ?")) return;
    const db = getDatabase();
    await update(dbRef(db, `promotions/${id}`), { active: false, supprime: true });
    setMessage({ type: "success", text: "Promotion supprimée !" });
  };

  const handleEditPromo = async (promo: Promotion) => {
    const nouveauTitre = prompt("Nouveau titre :", promo.titre);
    if (nouveauTitre && nouveauTitre.trim()) {
      const db = getDatabase();
      await update(dbRef(db, `promotions/${promo.id}`), { titre: nouveauTitre.trim() });
      setMessage({ type: "success", text: "Titre de la promotion modifié !" });
    }
  };

  const handleEditPartenaire = async (partenaire: Partenaire) => {
    const nouveauNom = prompt("Nouveau nom :", partenaire.nom);
    if (nouveauNom && nouveauNom.trim()) {
      const db = getDatabase();
      await update(dbRef(db, `partenaires/${partenaire.id}`), { nom: nouveauNom.trim() });
      setMessage({ type: "success", text: "Nom du partenaire modifié !" });
    }
  };

  const handleDeletePartenaire = async (id: string) => {
    if (!confirm("Supprimer ce partenaire ?")) return;
    const db = getDatabase();
    await update(dbRef(db, `partenaires/${id}`), { actif: false, dateSuppression: Date.now() });
    setMessage({ type: "success", text: "Partenaire supprimé !" });
  };

  const handleEditOuvrier = async (ouvrier: Ouvrier) => {
    const nouveauNom = prompt("Nouveau nom :", ouvrier.nom);
    if (nouveauNom && nouveauNom.trim()) {
      const db = getDatabase();
      await update(dbRef(db, `ouvriers/${ouvrier.id}`), { nom: nouveauNom.trim() });
      setMessage({ type: "success", text: "Nom de l'ouvrier modifié !" });
    }
  };

  const handleDeleteOuvrier = async (id: string) => {
    if (!confirm("Supprimer cet ouvrier ?")) return;
    const db = getDatabase();
    await update(dbRef(db, `ouvriers/${id}`), { actif: false, dateSuppression: Date.now() });
    setMessage({ type: "success", text: "Ouvrier supprimé !" });
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
      email: ouvrierForm.email,
      description: ouvrierForm.description,
      tarif: Number(ouvrierForm.tarif) || 0,
      photoUrl: ouvrierForm.photo ? await uploadToCloudinary(ouvrierForm.photo) : "",
      chantierId: ouvrierForm.chantierId,
      fonction: ouvrierForm.fonction,
      actif: true
    });
    setOuvrierForm({ nom: "", specialite: "", telephone: "", email: "", description: "", tarif: "", photo: null, chantierId: "", fonction: "ouvrier" });
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
                {/* Barre de recherche intelligente */}
                <div className="mb-6 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom, email ou téléphone..."
                    className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Indicateur de résultats */}
                {searchTerm && (
                  <p className="text-sm text-gray-500 mb-4">
                    {filteredAndSortedClients.length} résultat{filteredAndSortedClients.length > 1 ? "s" : ""} pour "{searchTerm}"
                  </p>
                )}

                {filteredAndSortedClients.length === 0 && searchTerm && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-500 text-lg">Aucun client trouvé</p>
                    <p className="text-sm text-gray-400 mt-2">Essayez avec un autre nom, email ou numéro de téléphone</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {filteredAndSortedClients.map((client) => {
                    const getInitials = (name: string) => {
                      if (!name || name === "Sans nom") return "CL";
                      const parts = name.split(' ');
                      return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '').toUpperCase();
                    };
                    
                    const prioriteScore = getPrioriteClient(client);
                    const lastInteraction = getLastInteraction(client);
                    
                    return (
                      <div key={client.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition relative">
                        {/* Badge de priorité visuel */}
                        {prioriteScore >= 80 && (
                          <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse" title="Urgence élevée" />
                        )}
                        {prioriteScore >= 50 && prioriteScore < 80 && (
                          <div className="absolute top-3 right-3 w-3 h-3 bg-orange-400 rounded-full" title="Attention requise" />
                        )}
                        
                        {/* Infos client existantes */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] font-black text-lg">
                            {getInitials(client.displayName || client.nom || "Sans nom")}
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--navy)]">{client.displayName || client.nom || "Sans nom"}</h4>
                            <p className="text-xs text-gray-500">{client.email || "—"}</p>
                          </div>
                        </div>

                        {/* Historique d'interaction rapide */}
                        {lastInteraction && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Dernière activité :</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              lastInteraction.type === "message" ? "bg-blue-50 text-blue-700" :
                              lastInteraction.type === "paiement" ? "bg-green-50 text-green-700" :
                              lastInteraction.type === "rapport" ? "bg-purple-50 text-purple-700" :
                              "bg-orange-50 text-orange-700"
                            }`}>
                              {lastInteraction.label} • {getTempsRelatif(lastInteraction.date)}
                            </span>
                          </div>
                        )}

                        {/* Section : Liste des chantiers du client */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                            🏗️ Ses chantiers ({client.chantiers?.length || 0})
                          </p>
                          
                          {(!client.chantiers || client.chantiers.length === 0) ? (
                            <p className="text-xs text-gray-400 italic">Aucun chantier assigné</p>
                          ) : (
                            <div className="space-y-2">
                              {client.chantiers.slice(0, 3).map((chantier: any) => {
                                const chantierRapports = client.rapports?.filter((r: any) => r.chantierId === chantier.id) || [];
                                const chantierPaiements = client.paiements?.filter((p: any) => p.chantierId === chantier.id) || [];
                                const sante = getSanteChantier(chantier, chantierRapports, chantierPaiements);
                                
                                return (
                                  <Link 
                                    key={chantier.id} 
                                    href={`/admin/chantier/${chantier.id}`}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-[#FF7A00]/5 hover:border-[#FF7A00]/30 border border-transparent transition group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[var(--navy)] truncate group-hover:text-[#FF7A00]">
                                        {chantier.nom_projet || chantier.nom || "Sans nom"}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {chantier.localisation?.ville || "Localisation inconnue"}
                                      </p>
                                    </div>
                                    
                                    {/* Badge de santé visuel */}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                      sante.couleur === "green" ? "bg-green-100 text-green-700" :
                                      sante.couleur === "orange" ? "bg-orange-100 text-orange-700" :
                                      "bg-red-100 text-red-700"
                                    }`}>
                                      {sante.label}
                                    </span>
                                  </Link>
                                );
                              })}
                              
                              {client.chantiers && client.chantiers.length > 3 && (
                                <Link 
                                  href={`/admin/clients/${client.id}/chantiers`}
                                  className="text-xs text-[#FF7A00] font-medium hover:underline mt-1 block"
                                >
                                  Voir les {client.chantiers.length - 3} autres chantiers...
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
{section === "chantiers" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chantiers.map((c) => (
                    <div key={c.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col h-full">
                      <Link href={`/admin/chantier/${c.id}`} className="font-bold mb-2 hover:text-[#FF7A00] transition">{c.nom_projet || c.nom}</Link>
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
                    <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col h-full">
                      {p.photo_url && <img src={p.photo_url} alt={p.nom} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                      <h4 className="font-bold">{p.nom}</h4>
                      <p className="text-xs text-white/60">{p.description}</p>
                      <div className="mt-auto flex flex-col gap-2 pt-3">
                        <button
                          onClick={async () => {
                            const db = getDatabase();
                            await update(dbRef(db, `partenaires/${p.id}`), { actif: !p.actif, dateModification: Date.now() });
                          }}
                          className={`w-full rounded-full px-3 py-1 text-xs font-bold border transition ${
                            p.actif 
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {p.actif ? "✅ Actif" : "⏸️ Inactif"}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditPartenaire(p)} className="flex-1 rounded-[10px] bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition">✏️ Modifier</button>
                          <button onClick={() => handleDeletePartenaire(p.id)} className="flex-1 rounded-[10px] bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition">🗑️ Supprimer</button>
                        </div>
                      </div>
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
{promotions.map((p) => (
                    <div key={p.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col h-full">
                      {p.image_url && <img src={p.image_url} alt={p.titre} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                      <h4 className="font-bold">{p.titre}</h4>
                      <p className="text-xs text-white/60">{p.description}</p>
                      <p className="text-xs mt-1">Du {p.date_debut} au {p.date_fin}</p>
                      <div className="mt-auto flex flex-col gap-2 pt-3">
                        <button
                          onClick={async () => {
                            const db = getDatabase();
                            await update(dbRef(db, `promotions/${p.id}`), { active: !p.active, dateModification: Date.now() });
                          }}
                          className={`w-full rounded-full px-3 py-1 text-xs font-bold border transition ${
                            p.active 
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {p.active ? "✅ Active" : "⏸️ Inactive"}
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditPromo(p)} className="flex-1 rounded-[10px] bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition">
                            ✏️ Modifier
                          </button>
                          <button onClick={() => handleDeletePromo(p.id)} className="flex-1 rounded-[10px] bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition">
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
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
                    <input type="text" placeholder="Nom complet" value={ouvrierForm.nom} onChange={e => setOuvrierForm({ ...ouvrierForm, nom: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="tel" placeholder="Téléphone" value={ouvrierForm.telephone} onChange={e => setOuvrierForm({ ...ouvrierForm, telephone: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="email" placeholder="Email (optionnel)" value={ouvrierForm.email} onChange={e => setOuvrierForm({ ...ouvrierForm, email: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="text" placeholder="Spécialité" value={ouvrierForm.specialite} onChange={e => setOuvrierForm({ ...ouvrierForm, specialite: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" required />
                    <input type="number" placeholder="Tarif journalier (FCFA)" value={ouvrierForm.tarif} onChange={e => setOuvrierForm({ ...ouvrierForm, tarif: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none" />
                    <input type="file" accept="image/*" onChange={e => setOuvrierForm({ ...ouvrierForm, photo: e.target.files?.[0] || null })} className="text-xs text-white/70" />
                    <select value={ouvrierForm.chantierId} onChange={e => setOuvrierForm({ ...ouvrierForm, chantierId: e.target.value })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="">Affecter à un chantier (optionnel)</option>
                      {chantiers.map(c => (
                        <option key={c.id} value={c.id}>{c.nom_projet || c.nom}</option>
                      ))}
                    </select>
                    <select value={ouvrierForm.fonction} onChange={e => setOuvrierForm({ ...ouvrierForm, fonction: e.target.value as "ouvrier" | "chef_equipe" | "chef_de_chantier" })} className="h-10 rounded-[10px] bg-white/5 px-3 text-sm outline-none">
                      <option value="ouvrier">Ouvrier</option>
                      <option value="chef_equipe">Chef d'équipe</option>
                      <option value="chef_de_chantier">Chef de chantier</option>
                    </select>
                    <textarea placeholder="Description / Expérience" value={ouvrierForm.description} onChange={e => setOuvrierForm({ ...ouvrierForm, description: e.target.value })} className="col-span-2 h-20 rounded-[10px] bg-white/5 px-3 py-2 text-sm outline-none resize-none" />
                    <button type="submit" className="h-10 rounded-[10px] bg-[#FF7A00] font-bold sm:col-span-2">Enregistrer l'ouvrier</button>
                  </div>
                </form>
                <div className="space-y-3">
                  {ouvriers.filter(o => o.actif !== false).map((o) => {
                    const chantier = chantiers.find(c => c.id === o.chantierId);
                    const fonctionLabel = {
                      ouvrier: "👷 Ouvrier",
                      chef_equipe: "👥 Chef d'équipe",
                      chef_de_chantier: "👑 Chef de chantier"
                    }[o.fonction] || "Ouvrier";
                    return (
                      <div key={o.id} className="rounded-[16px] border border-white/10 bg-white/5 p-4 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-bold">{o.nom}</h4>
                          <p className="text-xs text-white/60">Spécialité: {o.specialite}</p>
                          {o.telephone && <p className="text-xs text-white/60">📞 {o.telephone}</p>}
                          {o.email && <p className="text-xs text-white/60">✉️ {o.email}</p>}
                          {o.tarif && <p className="text-xs text-white/60">💰 {o.tarif} FCFA/j</p>}
                          {o.chantierId && <p className="text-xs text-white/60">📍 {chantier?.nom_projet || chantier?.nom}</p>}
                          <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs bg-white/10">{fonctionLabel}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => handleEditOuvrier(o)} className="flex-1 rounded-[10px] bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition">✏️ Modifier</button>
                          <button onClick={() => handleDeleteOuvrier(o.id)} className="flex-1 rounded-[10px] bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition">🗑️ Supprimer</button>
                        </div>
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