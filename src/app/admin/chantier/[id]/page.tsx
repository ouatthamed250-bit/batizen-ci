"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  MessageCircle,
  Phone,
  Calendar,
  MapPin,
  Home,
  Layers,
  DollarSign,
  FileText,
  Clock,
  User,
  Mail,
  Building2,
  Hammer,
  Palette,
  Pencil,
} from "lucide-react";
import { rtdbGet, rtdbGetList, rtdbSet } from "@/lib/rtdb";
import { useAuthContext } from "@/contexts/AuthContext";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { GestionEquipe } from "@/components/admin/ChantierMessaging";
import PaiementsSection from "./PaiementsSection";
import { ref, push, update, onValue, type Unsubscribe, getDatabase } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

type Localisation = {
  adresse?: string;
  commune?: string;
  quartier?: string;
  ville?: string;
};

type Chantier = {
  id: string;
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  description?: string;
  adresse?: string;
  progression?: number;
  statut?: string;
  type?: string;
  budget?: number;
  plan_choisi?: string;
  date_soumission?: string;
  surface_terrain?: number;
  surface_construite?: number;
  niveaux?: number;
  chambres?: number;
  salles_de_bain?: number;
  localisation?: Localisation;
  type_terrain?: string;
  apport_personnel?: number;
  mode_financement?: string;
  dateActivation?: number;
  activePar?: string;
  delai?: string;
  rdv_lieu?: string;
  rdv_date?: string;
  rdv_heure?: string;
  rdv_commentaire?: string;
  client_nom?: string;
  client_email?: string;
  client_telephone?: string;
  materiaux_gros_oeuvre?: Record<string, { nom: string; prix: number; quantite: number }>;
  materiaux_finitions?: Record<string, { nom: string; prix: number; quantite: number }>;
  plan_prix?: number;
  plan_details?: string;
  date_fin?: string;
};

type ClientInfo = {
  id: string;
  nom?: string;
  displayName?: string;
  email?: string;
};

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chantierId = params.id as string;
  const { database } = getFirebaseServices();

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  
  // États pour l'édition rapide
  const [editNom, setEditNom] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProgression, setEditProgression] = useState(0);
  const [editStatut, setEditStatut] = useState<"en_attente_rdv" | "en_cours" | "termine">("en_attente_rdv");

  const [medias, setMedias] = useState<{ id: string; type: string; url: string; nom: string; dateAjout: number }[]>([]);
  const [mediaType, setMediaType] = useState<"photo" | "video" | "pdf">("photo");
  const [mediaLoading, setMediaLoading] = useState(false);

  // États pour le formulaire de rapport hebdomadaire
  const [showRapportForm, setShowRapportForm] = useState(false);
  const [rapportForm, setRapportForm] = useState({
    semaine: "",
    dateDebut: "",
    dateFin: "",
    etape: "fondations",
    avancement: 0,
    statut: "dans_delais",
    commentaires: "",
    problemes: "",
    prochaine_etape: ""
  });
  const [mediasRapport, setMediasRapport] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadChantier() {
      try {
        const data = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
        setChantier(data);
        // Charger les infos du client si userId présent
        if (data?.userId) {
          const userInfo = await rtdbGet<ClientInfo>(`users/${data.userId}`);
          setClientInfo(userInfo || { id: data.userId });
        }
        // Initialiser les champs d'édition
        if (data) {
          setEditNom(data.nom_projet || data.nom || "");
          setEditDescription(data.description || "");
          setEditProgression(data.progression || 0);
          // Mapper les statuts
          if (data.statut === "en_cours") setEditStatut("en_cours");
          else if (data.statut === "termine") setEditStatut("termine");
          else setEditStatut("en_attente_rdv");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du chantier:", error);
        setMessage({ type: "error", text: "Erreur lors du chargement du chantier" });
      } finally {
        setLoading(false);
      }
    }
    loadChantier();
  }, [chantierId]);

  useEffect(() => {
    async function loadMedias() {
      const list = await rtdbGetList<{ type: string; url: string; nom: string; dateAjout: number }>(`chantiers/${chantierId}/medias`);
      setMedias(list.map(m => ({ ...m, id: m.url })));
    }
    loadMedias();
  }, [chantierId]);

  // Helper pour formater la localisation
  function formatLocalisation(loc?: Localisation): string {
    if (!loc) return "—";
    return loc.ville || loc.commune || loc.quartier || loc.adresse || "—";
  }

  const getStatutBadge = (statut?: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-orange-500/20 text-orange-400">⏳ En attente</span>;
      case "en_cours":
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-green-500/20 text-green-400">✅ En cours</span>;
      case "termine":
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-blue-500/20 text-blue-400">🏁 Terminé</span>;
      default:
        return <span className="rounded-full px-3 py-1 text-sm font-bold bg-white/10 text-white/50">{statut || "—"}</span>;
    }
  };

  const formatDate = (dateStr?: string | number) => {
    if (!dateStr) return "—";
    const date = typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return "—";
    return new Intl.NumberFormat("fr-FR").format(budget) + " F";
  };

  // Fonction pour obtenir le numéro de semaine
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Génération automatique du rapport hebdomadaire
  const genererRapportAuto = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
    
    const weekNumber = getWeekNumber(today);
    const semaine = `${today.getFullYear()}-S${weekNumber.toString().padStart(2, '0')}`;
    
    setRapportForm({
      ...rapportForm,
      semaine,
      dateDebut: weekStart.toISOString().split('T')[0],
      dateFin: weekEnd.toISOString().split('T')[0],
      commentaires: `Semaine du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}\n\nAvancement de la semaine :\n- \n\nProblèmes rencontrés :\n- Aucun\n\nProchaine étape :\n- `
    });
  };

  // Upload médias pour le rapport
  const handleUploadMediaRapport = async (file: File, type: "photo" | "video", legende: string, categorie: "avant" | "pendant" | "apres") => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const media = {
        id: `media_${Date.now()}`,
        url,
        type,
        legende,
        categorie,
        dateUpload: Date.now()
      };
      setMediasRapport([...mediasRapport, media]);
    } catch (error) {
      console.error("Erreur upload média:", error);
      alert("Erreur lors de l'upload du média");
    } finally {
      setUploading(false);
    }
  };

  // Sauvegarde du rapport hebdomadaire
  const handleCreerRapport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapportForm.commentaires.trim()) {
      alert("Veuillez ajouter un commentaire");
      return;
    }

    try {
      await push(ref(database, 'rapports'), {
        chantierId,
        ...rapportForm,
        medias: mediasRapport,
        creePar: "admin",
        dateCreation: Date.now(),
        actif: true
      });

      alert("✅ Rapport hebdomadaire créé avec succès !");
      setShowRapportForm(false);
      setRapportForm({
        semaine: "",
        dateDebut: "",
        dateFin: "",
        etape: "fondations",
        avancement: 0,
        statut: "dans_delais",
        commentaires: "",
        problemes: "",
        prochaine_etape: ""
      });
      setMediasRapport([]);
    } catch (error) {
      console.error("Erreur création rapport:", error);
      alert("Erreur lors de la création du rapport");
    }
  };

  // Sauvegarde de l'édition rapide
  const handleSaveEdit = async () => {
    if (!confirm("Sauvegarder les modifications ?")) return;
    setEditLoading(true);
    try {
      const { getDatabase, ref: dbRef, update } = await import("firebase/database");
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { database } = getFirebaseServices();
      
      await update(dbRef(database, `chantiers/${chantierId}`), {
        nom_projet: editNom,
        description: editDescription,
        progression: editProgression,
        statut: editStatut,
      });
      
      setMessage({ type: "success", text: "✅ Modifications sauvegardées avec succès !" });
      const updated = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
      setChantier(updated);
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm("Êtes-vous sûr de vouloir activer ce chantier ? Le client recevra une notification et pourra accéder au suivi complet.")) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const { getDatabase, ref, update, set } = await import("firebase/database");
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { database } = getFirebaseServices();
      await update(ref(database, `chantiers/${chantierId}`), {
        statut: "en_cours",
        dateActivation: Date.now(),
      });
      if (chantier?.userId) {
        await set(ref(database, `notifications/${chantier.userId}/activation_${chantierId}`), {
          type: "chantier_active",
          chantierId: chantierId,
          chantierNom: chantier?.nom_projet || chantier?.nom,
          message: `Votre chantier "${chantier?.nom_projet || chantier?.nom}" a été activé ! Vous pouvez maintenant accéder au suivi complet.`,
          dateCreation: Date.now(),
          lu: false,
        });
      }
      setMessage({ type: "success", text: "✅ Chantier activé avec succès ! Le client a été notifié." });
      setChantier({ ...chantier, statut: "en_cours" } as Chantier);
    } catch (error) {
      console.error("Erreur lors de l'activation:", error);
      setMessage({ type: "error", text: "Erreur lors de l'activation du chantier" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!confirm("Êtes-vous sûr de vouloir marquer ce chantier comme terminé ?")) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const { getDatabase, ref, update, set } = await import("firebase/database");
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { database } = getFirebaseServices();
      await update(ref(database, `chantiers/${chantierId}`), {
        statut: "termine",
        date_fin: new Date().toISOString(),
      });
      if (chantier?.userId) {
        await set(ref(database, `notifications/${chantier.userId}/termine_${chantierId}`), {
          type: "chantier_termine",
          chantierId: chantierId,
          chantierNom: chantier?.nom_projet || chantier?.nom,
          message: `🎉 Félicitations ! Votre chantier "${chantier?.nom_projet || chantier?.nom}" est terminé.`,
          dateCreation: Date.now(),
          lu: false,
        });
      }
      setMessage({ type: "success", text: "✅ Chantier marqué comme terminé avec succès !" });
      setChantier({ ...chantier, statut: "termine" } as Chantier);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setMessage({ type: "error", text: "Erreur lors de la mise à jour du chantier" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce chantier ? Cette action est irréversible.")) {
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const { getDatabase, ref, update } = await import("firebase/database");
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { database } = getFirebaseServices();
      await update(ref(database, `chantiers/${chantierId}`), { statut: "annule" });
      setMessage({ type: "success", text: "✅ Chantier annulé avec succès." });
      setChantier({ ...chantier, statut: "annule" } as Chantier);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      setMessage({ type: "error", text: "Erreur lors de l'annulation du chantier" });
    } finally {
      setActionLoading(false);
    }
  };

  // Upload vers Cloudinary via fonction globale
  const handleImageUpload = async (file: File): Promise<string> => {
    return await uploadToCloudinary(file);
  };

  const handleAddMedia = async (e: FormEvent) => {
    e.preventDefault();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = mediaType === "photo" ? "image/*" : mediaType === "video" ? "video/*" : ".pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setMediaLoading(true);
      try {
        const url = await handleImageUpload(file);
        const newMedia = { type: mediaType, url, nom: file.name, dateAjout: Date.now() };
        await rtdbSet(`chantiers/${chantierId}/medias`, [...medias, newMedia]);
        setMedias([...medias, { ...newMedia, id: url }]);
      } catch (err) {
        console.error("Upload erreur", err);
        setMessage({ type: "error", text: "Erreur lors de l'upload du média" });
      } finally {
        setMediaLoading(false);
      }
    };
    input.click();
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Supprimer ce média ?")) return;
    const newMedias = medias.filter(m => m.id !== mediaId);
    setMedias(newMedias);
    await rtdbSet(`chantiers/${chantierId}/medias`, newMedias.map(m => ({ type: m.type, url: m.url, nom: m.nom, dateAjout: m.dateAjout })));
  };

  const handleContactClient = () => {
    if (chantier?.client_telephone) {
      const phone = chantier.client_telephone.replace(/\s/g, "");
      window.open(`https://wa.me/${phone.replace("+225", "")}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-3">
            <div className="h-12 rounded-[12px] bg-white/5" />
            <div className="h-64 rounded-[16px] bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => router.push("/admin?section=chantiers")} className="mb-4 flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={18} /> Retour aux chantiers
          </button>
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/50">Chantier non trouvé.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/admin?section=chantiers")} className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={18} /> Retour aux chantiers
          </button>
          {getStatutBadge(chantier.statut)}
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-[12px] p-4 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {message.text}
          </div>
        )}

        {/* SECTION 1: Informations soumises par le client (PRÉ-ACTIVATION V2) */}
        <Section title="📋 Informations soumises par le client" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Nom du projet" value={chantier.nom_projet || chantier.nom} icon={Building2} />
            <InfoItem label="Type de projet" value={chantier.type} icon={Home} />
            <InfoItem 
              label="Client" 
              value={clientInfo?.displayName || clientInfo?.nom || chantier.client_nom || (chantier.userId ? `ID: ${chantier.userId}` : undefined)} 
              icon={User} 
            />
            {chantier.userId && (
              <InfoItem label="Email du client" value={clientInfo?.email || chantier.client_email} icon={Mail} />
            )}
            <InfoItem label="Localisation" value={formatLocalisation(chantier.localisation)} icon={MapPin} />
            <InfoItem label="Budget" value={formatBudget(chantier.budget)} icon={DollarSign} />
            <InfoItem label="Apport personnel" value={formatBudget(chantier.apport_personnel)} icon={DollarSign} />
            <InfoItem label="Délai estimé" value={chantier.delai} icon={Clock} />
            <InfoItem label="Plan choisi" value={chantier.plan_choisi || "—"} icon={FileText} />
            <InfoItem label="Statut actuel" value={chantier.statut} icon={Check} />
          </div>
          
          {/* BOUTON ACTIVER - Visible uniquement pour en_attente ou en_attente_rdv */}
          {(chantier.statut === "en_attente" || chantier.statut === "en_attente_rdv") && (
            <div className="mt-6">
              <button
                onClick={handleActivate}
                disabled={actionLoading}
                className="flex items-center gap-3 rounded-[16px] bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
              >
                <Check size={24} />
                ✅ Activer le chantier (Passer en V2 / Suivi & Médias)
              </button>
              <p className="mt-2 text-xs text-white/50">
                Cette action mettra le chantier en "En cours" et permettra au client d'accéder au suivi complet avec médias.
              </p>
            </div>
          )}
        </Section>

        {/* SECTION 2: Édition rapide */}
        <Section title="✏️ Édition rapide" icon={Pencil}>
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Nom du projet" value={editNom} set={setEditNom} />
            <InputField label="Description" value={editDescription} set={setEditDescription} />
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3">
                <span className="text-xs font-bold">Progression (%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgression}
                  onChange={(e) => setEditProgression(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-black text-[#FF7A00]">{editProgression}%</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold">Statut</span>
                <select
                  value={editStatut}
                  onChange={(e) => setEditStatut(e.target.value as "en_attente_rdv" | "en_cours" | "termine")}
                  className="h-10 w-full rounded-[10px] bg-white/5 px-3 text-xs font-bold outline-none ring-1 ring-white/10"
                >
                  <option value="en_attente_rdv">⏳ En attente RDV</option>
                  <option value="en_cours">✅ En cours</option>
                  <option value="termine">🏁 Terminé</option>
                </select>
              </label>
            </div>
            <button
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="h-10 rounded-[10px] bg-[#FF7A00] px-4 text-xs font-black disabled:opacity-50 sm:col-span-2"
            >
              {editLoading ? "Sauvegarde..." : "💾 Sauvegarder les modifications"}
            </button>
          </div>
        </Section>

        {/* SECTION 3: Détails techniques */}
        <Section title="Détails techniques" icon={Hammer}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Surface du terrain" value={chantier.surface_terrain ? `${chantier.surface_terrain} m²` : undefined} icon={Layers} />
            <InfoItem label="Surface construite" value={chantier.surface_construite ? `${chantier.surface_construite} m²` : undefined} icon={Building2} />
            <InfoItem label="Nombre de niveaux" value={chantier.niveaux?.toString()} icon={Layers} />
            <InfoItem label="Chambres" value={chantier.chambres?.toString()} icon={Home} />
            <InfoItem label="Salles de bain" value={chantier.salles_de_bain?.toString()} icon={Home} />
            <InfoItem label="Type de terrain" value={chantier.type_terrain} icon={MapPin} />
          </div>
        </Section>

        {/* SECTION 4: Matériaux sélectionnés */}
        <Section title="Matériaux sélectionnés" icon={Palette}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 font-bold text-[#FF7A00]">Gros œuvre</h4>
              {chantier.materiaux_gros_oeuvre && Object.keys(chantier.materiaux_gros_oeuvre).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(chantier.materiaux_gros_oeuvre).map(([key, mat]) => (
                    <div key={key} className="rounded-[10px] bg-white/5 p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">{mat.nom}</span>
                        <span className="text-[#FF7A00]">{formatBudget(mat.prix * mat.quantite)}</span>
                      </div>
                      <div className="text-white/50">Quantité: {mat.quantite} × {formatBudget(mat.prix)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucun matériau sélectionné</p>
              )}
            </div>
            <div>
              <h4 className="mb-3 font-bold text-[#FF7A00]">Finitions</h4>
              {chantier.materiaux_finitions && Object.keys(chantier.materiaux_finitions).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(chantier.materiaux_finitions).map(([key, mat]) => (
                    <div key={key} className="rounded-[10px] bg-white/5 p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">{mat.nom}</span>
                        <span className="text-[#FF7A00]">{formatBudget(mat.prix * mat.quantite)}</span>
                      </div>
                      <div className="text-white/50">Quantité: {mat.quantite} × {formatBudget(mat.prix)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucun matériau sélectionné</p>
              )}
            </div>
          </div>
        </Section>

        {/* SECTION 5: Budget et financement */}
        <Section title="Budget et financement" icon={DollarSign}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Budget total" value={formatBudget(chantier.budget)} icon={DollarSign} />
            <InfoItem label="Apport personnel" value={formatBudget(chantier.apport_personnel)} icon={DollarSign} />
            <InfoItem label="Mode de financement" value={chantier.mode_financement} icon={FileText} />
          </div>
        </Section>

        {/* SECTION 6: Plan choisi */}
        <Section title="Plan choisi" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Plan" value={chantier.plan_choisi} icon={FileText} />
            <InfoItem label="Prix du plan" value={formatBudget(chantier.plan_prix)} icon={DollarSign} />
          </div>
          {chantier.plan_details && (
            <div className="mt-3 rounded-[10px] bg-white/5 p-3 text-sm">
              <span className="text-white/50">Détails: </span>
              <span>{chantier.plan_details}</span>
            </div>
          )}
        </Section>

        {/* SECTION 7: Rendez-vous */}
        {chantier.rdv_date && (
          <Section title="Rendez-vous" icon={Calendar}>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Lieu" value={chantier.rdv_lieu} icon={MapPin} />
              <InfoItem label="Date et heure" value={`${formatDate(chantier.rdv_date)} ${chantier.rdv_heure || ""}`} icon={Clock} />
            </div>
            {chantier.rdv_commentaire && (
              <div className="mt-3 rounded-[10px] bg-white/5 p-3 text-sm">
                <span className="text-white/50">Commentaire: </span>
                <span>{chantier.rdv_commentaire}</span>
              </div>
            )}
          </Section>
        )}

        {/* SECTION 8: Médias & Avancement */}
        <Section title="📁 Médias & Avancement" icon={Building2}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as "photo" | "video" | "pdf")} className="h-10 rounded-[10px] bg-white/5 px-3 text-xs font-bold outline-none ring-1 ring-white/10">
                <option value="photo">Photo</option>
                <option value="video">Vidéo</option>
                <option value="pdf">PDF</option>
              </select>
              <button onClick={handleAddMedia} disabled={mediaLoading} className="h-10 rounded-[10px] bg-[#0B5FFF] px-4 text-xs font-black disabled:opacity-50">
                {mediaLoading ? "Upload..." : "Ajouter un média"}
              </button>
            </div>
            {medias.length === 0 ? (
              <p className="text-sm text-white/50">Aucun média pour ce chantier.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {medias.map((m) => (
                  <div key={m.id} className="rounded-[12px] border border-white/10 bg-white/5 p-3">
                    {m.type === "photo" && <img src={m.url} alt={m.nom} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                    {m.type === "video" && <video src={m.url} className="mb-2 h-32 w-full rounded-lg object-cover" controls />}
                    {m.type === "pdf" && <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-[#FF7A00] underline">📄 {m.nom}</a>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">{new Date(m.dateAjout).toLocaleDateString("fr-FR")}</span>
                      <button onClick={() => handleDeleteMedia(m.id)} className="text-xs text-red-400">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* SECTION 9: Gestion de l'équipe */}
        <GestionEquipe chantierId={chantierId} />

        {/* SECTION 10: Rapport Hebdomadaire */}
        <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              📝 Rapports Hebdomadaires
            </h3>
            <button 
              onClick={() => { setShowRapportForm(!showRapportForm); if (!showRapportForm) genererRapportAuto(); }}
              className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#e66e00] transition"
            >
              {showRapportForm ? "✖️ Annuler" : "+ Nouveau Rapport"}
            </button>
          </div>

          {showRapportForm && (
            <form onSubmit={handleCreerRapport} className="space-y-4">
              {/* Semaine (auto-générée) */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Semaine</label>
                <input 
                  type="text" 
                  value={rapportForm.semaine || ""} 
                  readOnly 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                />
              </div>

              {/* Étape de construction */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Étape de construction</label>
                <select 
                  value={rapportForm.etape}
                  onChange={(e) => setRapportForm({...rapportForm, etape: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                >
                  <option value="fondations">Fondations</option>
                  <option value="murs">Murs / Gros œuvre</option>
                  <option value="toiture">Toiture</option>
                  <option value="finitions">Finitions</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Avancement */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Avancement (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={rapportForm.avancement}
                  onChange={(e) => setRapportForm({...rapportForm, avancement: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                />
              </div>

              {/* Statut */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Statut</label>
                <select 
                  value={rapportForm.statut}
                  onChange={(e) => setRapportForm({...rapportForm, statut: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                >
                  <option value="dans_delais">🟢 Dans les délais</option>
                  <option value="retard">🟠 Retard</option>
                  <option value="avance">🔵 En avance</option>
                </select>
              </div>

              {/* Commentaires (pré-rempli) */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Commentaires</label>
                <textarea 
                  value={rapportForm.commentaires}
                  onChange={(e) => setRapportForm({...rapportForm, commentaires: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                  placeholder="Décrivez l'avancement de la semaine..."
                />
              </div>

              {/* Problèmes */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Problèmes rencontrés (optionnel)</label>
                <textarea 
                  value={rapportForm.problemes}
                  onChange={(e) => setRapportForm({...rapportForm, problemes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                  placeholder="Aucun problème majeur..."
                />
              </div>

              {/* Prochaine étape */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">Prochaine étape</label>
                <textarea 
                  value={rapportForm.prochaine_etape}
                  onChange={(e) => setRapportForm({...rapportForm, prochaine_etape: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                  placeholder="La semaine prochaine, nous allons..."
                />
              </div>

              {/* Upload Médias */}
              <div>
                <label className="text-sm text-white/70 mb-2 block">Photos & Vidéos</label>
                
                {/* Photos */}
                <div className="mb-3">
                  <label className="text-xs text-white/60 mb-1 block">📸 Ajouter une photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const legende = prompt("Légende de la photo :") || "";
                        const categorie = prompt("Catégorie : avant / pendant / apres ?") as "avant" | "pendant" | "apres" || "pendant";
                        await handleUploadMediaRapport(file, "photo", legende, categorie);
                      }
                    }}
                    className="hidden"
                    id="photo-upload-rapport"
                  />
                  <label htmlFor="photo-upload-rapport" className="inline-block px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer hover:bg-blue-500/30 transition text-sm">
                    + Ajouter Photo
                  </label>
                </div>

                {/* Vidéos */}
                <div className="mb-3">
                  <label className="text-xs text-white/60 mb-1 block">🎥 Ajouter une vidéo</label>
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const legende = prompt("Légende de la vidéo :") || "";
                        const categorie = prompt("Catégorie : avant / pendant / apres ?") as "avant" | "pendant" | "apres" || "pendant";
                        await handleUploadMediaRapport(file, "video", legende, categorie);
                      }
                    }}
                    className="hidden"
                    id="video-upload-rapport"
                  />
                  <label htmlFor="video-upload-rapport" className="inline-block px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg cursor-pointer hover:bg-purple-500/30 transition text-sm">
                    + Ajouter Vidéo
                  </label>
                </div>

                {/* Liste des médias ajoutés */}
                {mediasRapport.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {mediasRapport.map((media, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                        {media.type === "photo" ? (
                          <img src={media.url} alt={media.legende} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-purple-500/20 rounded flex items-center justify-center">
                            <span className="text-2xl">🎥</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-white font-bold">{media.legende || "Sans légende"}</p>
                          <p className="text-xs text-white/60">{media.type} - {media.categorie}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setMediasRapport(mediasRapport.filter((_, i) => i !== idx))}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          ✖️
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <p className="text-xs text-white/60 mt-2">⏳ Upload en cours...</p>
                )}
              </div>

              {/* Bouton Soumettre */}
              <button 
                type="submit"
                disabled={uploading}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50"
              >
                ✅ Créer le rapport
              </button>
            </form>
          )}
        </div>

        {/* SECTION 11: Notes & Checklists */}
        <NotesSection chantierId={chantierId} />

        {/* SECTION 12: Messagerie avec le client */}
        <MessagerieSection chantierId={chantierId} clientUserId={chantier?.userId} />

        {/* SECTION 13: Paiements & Finances */}
        <PaiementsSection chantierId={chantierId} chantier={chantier} />
      </div>
    </div>
  );
}

function NotesSection({ chantierId }: { chantierId: string }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState<"note" | "checklist">("note");
  const [noteForm, setNoteForm] = useState({
    titre: "",
    contenu: "",
    priorite: "importante",
    statut: "a_faire",
    assigneA: "",
    dateRappel: ""
  });
  const [checklistItems, setChecklistItems] = useState<{id: string; texte: string; coche: boolean}[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const notesRef = ref(database, 'notes');
    const unsub = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notesChantier = Object.entries(data)
          .filter(([id, n]: [string, any]) => n.chantierId === chantierId && n.actif)
          .map(([id, n]: [string, any]) => ({ id, ...n }))
          .sort((a: any, b: any) => b.dateCreation - a.dateCreation);
        setNotes(notesChantier);
      } else {
        setNotes([]);
      }
    });
    return () => unsub();
  }, [chantierId, database]);

  const handleAjouterItemChecklist = () => {
    if (!newItemText.trim()) return;
    setChecklistItems([...checklistItems, {
      id: `item_${Date.now()}`,
      texte: newItemText,
      coche: false
    }]);
    setNewItemText("");
  };

  const handleSupprimerItemChecklist = (itemId: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== itemId));
  };

  const handleCreerNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.titre.trim()) {
      alert("Veuillez ajouter un titre");
      return;
    }

    try {
      const noteData = {
        chantierId,
        type: noteType,
        titre: noteForm.titre,
        contenu: noteForm.contenu,
        priorite: noteForm.priorite,
        statut: noteForm.statut,
        creePar: "admin",
        creeParNom: user?.displayName || "Admin",
        creeParRole: "admin",
        assigneA: noteForm.assigneA || "",
        dateRappel: noteForm.dateRappel || "",
        dateCreation: Date.now(),
        dateModification: Date.now(),
        actif: true
      };

      if (noteType === "checklist") {
        (noteData as any).items = checklistItems;
      }

      await push(ref(database, 'notes'), noteData);

      alert("✅ Note créée avec succès !");
      setShowNoteForm(false);
      setNoteForm({
        titre: "",
        contenu: "",
        priorite: "importante",
        statut: "a_faire",
        assigneA: "",
        dateRappel: ""
      });
      setChecklistItems([]);
    } catch (error) {
      console.error("Erreur création note:", error);
      alert("Erreur lors de la création de la note");
    }
  };

  const handleChangerStatutNote = async (noteId: string, nouveauStatut: string) => {
    await update(ref(database, `notes/${noteId}`), {
      statut: nouveauStatut,
      dateModification: Date.now()
    });
  };

  const handleCocherItem = async (noteId: string, itemId: string, coche: boolean) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.items) return;

    const updatedItems = note.items.map((item: any) => {
      if (item.id === itemId) {
        return {
          ...item,
          coche,
          cochePar: coche ? "admin" : "",
          cocheLe: coche ? Date.now() : 0
        };
      }
      return item;
    });

    await update(ref(database, `notes/${noteId}`), {
      items: updatedItems,
      dateModification: Date.now()
    });
  };

  const handleSupprimerNote = async (noteId: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    await update(ref(database, `notes/${noteId}`), {
      actif: false,
      dateModification: Date.now()
    });
  };

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          📝 Notes & Checklists
        </h3>
        <button 
          onClick={() => setShowNoteForm(!showNoteForm)}
          className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#e66e00] transition"
        >
          {showNoteForm ? "✖️ Annuler" : "+ Nouvelle Note"}
        </button>
      </div>

      {showNoteForm && (
        <form onSubmit={handleCreerNote} className="space-y-4">
          {/* Type de note */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNoteType("note")}
                className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${
                  noteType === "note" ? "bg-blue-500 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                📝 Note simple
              </button>
              <button
                type="button"
                onClick={() => setNoteType("checklist")}
                className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${
                  noteType === "checklist" ? "bg-green-500 text-white" : "bg-white/10 text-white/70"
                }`}
              >
                ✅ Checklist
              </button>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Titre</label>
            <input 
              type="text"
              value={noteForm.titre}
              onChange={(e) => setNoteForm({...noteForm, titre: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
              placeholder="Ex: Choisir la couleur des murs"
            />
          </div>

          {/* Contenu (pour notes simples uniquement) */}
          {noteType === "note" && (
            <div>
              <label className="text-sm text-white/70 mb-1 block">Contenu</label>
              <textarea 
                value={noteForm.contenu}
                onChange={(e) => setNoteForm({...noteForm, contenu: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                placeholder="Détails de la note..."
              />
            </div>
          )}

          {/* Items checklist (pour checklists uniquement) */}
          {noteType === "checklist" && (
            <div>
              <label className="text-sm text-white/70 mb-1 block">Éléments de la checklist</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAjouterItemChecklist())}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
                  placeholder="Ajouter un élément..."
                />
                <button 
                  type="button"
                  onClick={handleAjouterItemChecklist}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold"
                >
                  +
                </button>
              </div>
              {checklistItems.length > 0 && (
                <div className="space-y-1">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <span className="text-sm text-white">{item.texte}</span>
                      <button 
                        type="button"
                        onClick={() => handleSupprimerItemChecklist(item.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ✖️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Priorité */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Priorité</label>
            <select 
              value={noteForm.priorite}
              onChange={(e) => setNoteForm({...noteForm, priorite: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            >
              <option value="urgente">🔴 Urgente</option>
              <option value="importante">🟡 Importante</option>
              <option value="info">🟢 Info</option>
            </select>
          </div>

          {/* Statut initial */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Statut</label>
            <select 
              value={noteForm.statut}
              onChange={(e) => setNoteForm({...noteForm, statut: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            >
              <option value="a_faire">⏳ À faire</option>
              <option value="en_cours">🔄 En cours</option>
              <option value="fait">✅ Fait</option>
            </select>
          </div>

          {/* Date de rappel (optionnel) */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Date de rappel (optionnel)</label>
            <input 
              type="date"
              value={noteForm.dateRappel}
              onChange={(e) => setNoteForm({...noteForm, dateRappel: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            />
          </div>

          {/* Bouton Soumettre */}
          <button 
            type="submit"
            className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
          >
            ✅ Créer la note
          </button>
        </form>
      )}

      {/* Liste des notes existantes */}
      {notes.length > 0 && (
        <div className="space-y-3 mt-4">
          {notes.map((note) => (
            <div key={note.id} className={`p-4 rounded-xl border ${
              note.priorite === "urgente" ? "bg-red-500/10 border-red-500/30" :
              note.priorite === "importante" ? "bg-yellow-500/10 border-yellow-500/30" :
              "bg-green-500/10 border-green-500/30"
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {note.type === "checklist" ? "✅" : "📝"}
                    </span>
                    <h4 className="font-bold text-white">{note.titre}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      note.statut === "fait" ? "bg-green-500/20 text-green-400" :
                      note.statut === "en_cours" ? "bg-blue-500/20 text-blue-400" :
                      note.statut === "annule" ? "bg-gray-500/20 text-gray-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      {note.statut === "a_faire" ? "⏳ À faire" :
                       note.statut === "en_cours" ? "🔄 En cours" :
                       note.statut === "fait" ? "✅ Fait" : "❌ Annulé"}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    Par {note.creeParNom} • {new Date(note.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <select 
                    value={note.statut}
                    onChange={(e) => handleChangerStatutNote(note.id, e.target.value)}
                    className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
                  >
                    <option value="a_faire">⏳ À faire</option>
                    <option value="en_cours">🔄 En cours</option>
                    <option value="fait">✅ Fait</option>
                    <option value="annule">❌ Annulé</option>
                  </select>
                  <button 
                    onClick={() => handleSupprimerNote(note.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Contenu pour notes simples */}
              {note.type === "note" && note.contenu && (
                <p className="text-sm text-white/80 mt-2 whitespace-pre-line">{note.contenu}</p>
              )}

              {/* Items pour checklists */}
              {note.type === "checklist" && note.items && note.items.length > 0 && (
                <div className="mt-3 space-y-1">
                  {note.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={item.coche}
                        onChange={(e) => handleCocherItem(note.id, item.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className={`text-sm ${item.coche ? "text-white/50 line-through" : "text-white"}`}>
                        {item.texte}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Date de rappel */}
              {note.dateRappel && (
                <p className="text-xs text-white/60 mt-2">
                  📅 Rappel : {new Date(note.dateRappel).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

  {notes.length === 0 && !showNoteForm && (
    <p className="text-sm text-white/60 text-center py-4">Aucune note pour ce chantier.</p>
  )}
    </div>
  );
}

function MessagerieSection({ chantierId, clientUserId }: { chantierId: string; clientUserId?: string }) {
  const { database } = getFirebaseServices();
  const { user } = useAuthContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // ⚠️ IMPORTANT : Ne pas lancer le listener si l'utilisateur n'est pas connecté
    if (!user || !chantierId) {
      console.log("⏳ Attente authentification ou chantierId pour la messagerie...");
      return;
    }

    console.log("🔌 Connexion messagerie établie pour le chantier:", chantierId);
    
    const db = getDatabase();
    const messagesRef = ref(database, 'messages');
    
    const unsub = onValue(messagesRef, (snapshot) => {
      console.log("📩 Snapshot messages admin reçu");
      
      const data = snapshot.val();
      if (data) {
        // ⚠️ CORRECTION : Lire TOUS les messages du chantier, pas de filtre sur destinataireId
        const msgsChantier = Object.entries(data)
          .filter(([id, m]: [string, any]) => {
            console.log("🔍 Vérification message:", m.contenu, "chantierId:", m.chantierId, "vs", chantierId);
            return m.chantierId === chantierId;
          })
          .map(([id, m]: [string, any]) => ({ id, ...m }))
          .sort((a: any, b: any) => a.dateEnvoi - b.dateEnvoi);
        
        console.log("✅ Messages admin filtrés:", msgsChantier.length, msgsChantier);
        setMessages(msgsChantier);
        
        // Marquer comme lus les messages du client
        msgsChantier.forEach(async (msg) => {
          if (msg.expediteurRole === "client" && !msg.lu) {
            await update(ref(db, `messages/${msg.id}`), {
              lu: true,
              dateLecture: Date.now()
            });
          }
        });
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error("❌ Erreur listener messages admin:", error);
    });

    return () => {
      console.log("🧹 Nettoyage listener messages admin");
      unsub();
    };
  }, [user, chantierId, database]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnvoyerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await push(ref(database, 'messages'), {
        chantierId,
        expediteurId: user?.uid || "admin",
        expediteurNom: user?.displayName || "Admin",
        expediteurRole: "admin",
        destinataireId: clientUserId,
        type: "texte",
        contenu: newMessage,
        dateEnvoi: Date.now(),
        lu: false
      });

      setNewMessage("");
    } catch (error) {
      console.error("Erreur envoi message:", error);
      alert("Erreur lors de l'envoi du message");
    }
  };

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
        chantierId,
        expediteurId: user?.uid || "admin",
        expediteurNom: user?.displayName || "Admin",
        expediteurRole: "admin",
        destinataireId: clientUserId,
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
        chantierId,
        expediteurId: user?.uid || "admin",
        expediteurNom: user?.displayName || "Admin",
        expediteurRole: "admin",
        destinataireId: clientUserId,
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

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        💬 Messagerie avec le client
      </h3>

      {/* Zone de messages */}
      <div className="h-96 overflow-y-auto space-y-3 mb-4 p-3 bg-white/5 rounded-xl">
        {messages.length === 0 ? (
          <p className="text-sm text-white/60 text-center py-8">Aucun message. Commencez la conversation !</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.expediteurRole === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl p-3 ${
                msg.expediteurRole === "admin" 
                  ? "bg-[#FF7A00] text-white" 
                  : "bg-white/10 text-white"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold opacity-70">{msg.expediteurNom}</span>
                  <span className="text-xs opacity-50">
                    {new Date(msg.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.expediteurRole === "admin" && msg.lu && (
                    <span className="text-xs">✓✓</span>
                  )}
                </div>

                {msg.type === "texte" && (
                  <p className="text-sm whitespace-pre-line">{msg.contenu}</p>
                )}

                {msg.type === "vocal" && (
                  <div className="flex items-center gap-2">
                    <audio controls src={msg.url} className="h-8" />
                    <span className="text-xs opacity-70">{msg.dureeVocal}s</span>
                  </div>
                )}

                {msg.type === "piece_jointe" && (
                  <a 
                    href={msg.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm underline"
                  >
                    📎 {msg.nomFichier} ({(msg.tailleFichier / 1024).toFixed(1)} KB)
                  </a>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="space-y-2">
        <form onSubmit={handleEnvoyerMessage} className="flex gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
          />
          <button 
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl font-bold hover:bg-[#e66e00] transition disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>

        <div className="flex gap-2">
          <button 
            onClick={recording ? handleArreterEnregistrement : handleDemarrerEnregistrement}
            disabled={uploading}
            className={`flex-1 px-3 py-2 rounded-xl font-bold transition ${
              recording 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
            }`}
          >
            {recording ? "⏹️ Arrêter" : "🎤 Vocal"}
          </button>

          <label className={`flex-1 px-3 py-2 rounded-xl font-bold text-center cursor-pointer transition ${
            uploading 
              ? "bg-gray-500/20 text-gray-400" 
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
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
          <p className="text-xs text-white/60 text-center">⏳ Upload en cours...</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-black text-[#FF7A00]">
        <Icon size={20} /> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | number; icon: typeof FileText }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] bg-white/5 p-3">
      <Icon size={18} className="mt-0.5 text-[#FF7A00]" />
      <div className="flex-1">
        <div className="text-xs text-white/50">{label}</div>
        <div className="font-bold">{value || "—"}</div>
      </div>
    </div>
  );
}

function InputField({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        className="h-10 w-full rounded-[10px] bg-white/5 px-3 text-xs font-bold outline-none ring-1 ring-white/10"
      />
    </label>
  );
}