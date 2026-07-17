"use client";

import { useEffect, useState, type FormEvent } from "react";
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
} from "lucide-react";
import { rtdbGet, rtdbGetList, rtdbSet } from "@/lib/rtdb";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Chantier = {
  id: string;
  client_id?: string;
  userId?: string;
  nom?: string;
  nom_projet?: string;
  adresse?: string;
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
  materiaux_gros_oeuvre?: Record<string, { nom: string; prix: number; quantite: number }>;
  materiaux_finitions?: Record<string, { nom: string; prix: number; quantite: number }>;
  plan_prix?: number;
  plan_details?: string;
  date_fin?: string;
};

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chantierId = params.id as string;

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [medias, setMedias] = useState<{ id: string; type: string; url: string; nom: string; dateAjout: number }[]>([]);
  const [mediaType, setMediaType] = useState<"photo" | "video" | "pdf">("photo");
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    async function loadChantier() {
      try {
        const data = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
        setChantier(data);
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

  const handleActivate = async () => {
    if (!confirm("Êtes-vous sûr de vouloir activer ce chantier ? Le client recevra une notification et pourra accéder au suivi complet.")) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      // Import Firebase dynamically
      const { getDatabase, ref, update, set } = await import("firebase/database");
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { database } = getFirebaseServices();

      // Mettre à jour le statut du chantier
      await update(ref(database, `chantiers/${chantierId}`), {
        statut: "en_cours",
        dateActivation: Date.now(),
      });

      // Créer une notification pour le client
      if (chantier?.userId) {
        await set(ref(database, `notifications/${chantier.userId}/activation_${chantierId}`), {
          type: "chantier_active",
          chantierId: chantierId,
          chantierNom: chantier.nom_projet || chantier.nom,
          message: `Votre chantier "${chantier.nom_projet || chantier.nom}" a été activé ! Vous pouvez maintenant accéder au suivi complet.`,
          dateCreation: Date.now(),
          lu: false,
        });
      }

      setMessage({ type: "success", text: "✅ Chantier activé avec succès ! Le client a été notifié." });
      
      // Recharger les données
      const updated = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
      setChantier(updated);

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push("/admin?section=chantiers");
      }, 2000);
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
          chantierNom: chantier.nom_projet || chantier.nom,
          message: `🎉 Félicitations ! Votre chantier "${chantier.nom_projet || chantier.nom}" est terminé.`,
          dateCreation: Date.now(),
          lu: false,
        });
      }

      setMessage({ type: "success", text: "✅ Chantier marqué comme terminé avec succès !" });
      
      const updated = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
      setChantier(updated);
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

      await update(ref(database, `chantiers/${chantierId}`), {
        statut: "annule",
      });

      setMessage({ type: "success", text: "✅ Chantier annulé avec succès." });
      
      const updated = await rtdbGet<Chantier>(`chantiers/${chantierId}`);
      setChantier(updated);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      setMessage({ type: "error", text: "Erreur lors de l'annulation du chantier" });
    } finally {
      setActionLoading(false);
    }
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
        const storage = getStorage();
        const storageRef = ref(storage, `chantiers/${chantierId}/medias/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
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
     setMedias(medias.filter(m => m.id !== mediaId));
     await rtdbSet(`chantiers/${chantierId}/medias`, medias.filter(m => m.id !== mediaId));
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

        {/* SECTION 1: Informations générales */}
        <Section title="Informations générales" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Nom du projet" value={chantier.nom_projet || chantier.nom} icon={Building2} />
            <InfoItem label="Type de projet" value={chantier.type} icon={Home} />
            <InfoItem label="Client" value={chantier.client_nom} icon={User} />
            <InfoItem label="Email client" value={chantier.client_email} icon={Mail} />
            <InfoItem label="Téléphone client" value={chantier.client_telephone} icon={Phone} />
            <InfoItem label="Date de soumission" value={formatDate(chantier.date_soumission)} icon={Calendar} />
          </div>
        </Section>

        {/* SECTION 2: Détails techniques */}
        <Section title="Détails techniques" icon={Hammer}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Surface du terrain" value={chantier.surface_terrain ? `${chantier.surface_terrain} m²` : undefined} icon={Layers} />
            <InfoItem label="Surface construite" value={chantier.surface_construite ? `${chantier.surface_construite} m²` : undefined} icon={Building2} />
            <InfoItem label="Nombre de niveaux" value={chantier.niveaux?.toString()} icon={Layers} />
            <InfoItem label="Chambres" value={chantier.chambres?.toString()} icon={Home} />
            <InfoItem label="Salles de bain" value={chantier.salles_de_bain?.toString()} icon={Home} />
            <InfoItem label="Localisation" value={chantier.localisation} icon={MapPin} />
            <InfoItem label="Type de terrain" value={chantier.type_terrain} icon={MapPin} />
          </div>
        </Section>

        {/* SECTION 3: Matériaux sélectionnés */}
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

        {/* SECTION 4: Budget et financement */}
        <Section title="Budget et financement" icon={DollarSign}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Budget total" value={formatBudget(chantier.budget)} icon={DollarSign} />
            <InfoItem label="Apport personnel" value={formatBudget(chantier.apport_personnel)} icon={DollarSign} />
            <InfoItem label="Mode de financement" value={chantier.mode_financement} icon={FileText} />
          </div>
        </Section>

        {/* SECTION 5: Plan choisi */}
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

        {/* SECTION 6: Rendez-vous */}
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

        {/* SECTION 7: Actions admin */}
        <Section title="Actions admin" icon={Check}>
          <div className="flex flex-wrap gap-3">
            {chantier.statut === "en_attente" && (
              <>
                <button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-[12px] bg-green-500 px-4 py-2.5 text-sm font-black transition hover:bg-green-500/80 disabled:opacity-50"
                >
                  <Check size={18} /> Activer le chantier
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-[12px] bg-red-500 px-4 py-2.5 text-sm font-black transition hover:bg-red-500/80 disabled:opacity-50"
                >
                  <X size={18} /> Annuler le chantier
                </button>
              </>
            )}
            {chantier.statut === "en_cours" && (
              <button
                onClick={handleMarkAsCompleted}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-[12px] bg-blue-500 px-4 py-2.5 text-sm font-black transition hover:bg-blue-500/80 disabled:opacity-50"
              >
                <Check size={18} /> Marquer comme terminé
              </button>
            )}
            <button
              onClick={handleContactClient}
              className="flex items-center gap-2 rounded-[12px] bg-[#25D366] px-4 py-2.5 text-sm font-black transition hover:bg-[#25D366]/80"
            >
              <MessageCircle size={18} /> Contacter le client (WhatsApp)
            </button>
          </div>
        </Section>

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
