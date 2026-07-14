"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Phone,
  MessageCircle,
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  RefreshCw,
  Clock,
  Download,
  ImageOff,
  Users,
  CreditCard,
  FileText,
  ListChecks,
  ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { rtdbGet, rtdbGetList } from "@/lib/rtdb";
import { formatFcfa } from "@/utils/currency";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type Chantier = {
  nom?: string;
  nom_projet?: string;
  adresse?: string;
  date_debut?: string;
  date_fin?: string;
  progression?: number;
  progress?: number;
  photo?: string;
  image_url?: string;
  chef_id?: string;
};

type Etape = {
  id: string;
  nom?: string;
  titre?: string;
  statut?: string; // termine | en_cours | a_venir
  date?: string;
  description?: string;
  pourcentage?: number;
};

type Photo = {
  id: string;
  url?: string;
  date?: string;
};

type Membre = {
  id: string;
  nom?: string;
  role?: string;
  telephone?: string;
  photo?: string;
  type?: string; // chef | ouvrier
};

type Paiement = {
  id: string;
  date?: string;
  montant?: number;
  mode?: string;
};

type DocumentItem = {
  id: string;
  nom?: string;
  date?: string;
  type?: string;
  url?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDateFr(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getDate()} ${MOIS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function etapeIcon(statut?: string) {
  switch (statut) {
    case "termine":
      return <CheckCircle2 className="size-5 shrink-0 text-[#22C55E]" />;
    case "en_cours":
      return <RefreshCw className="size-5 shrink-0 animate-spin text-[#0B5FFF]" />;
    default:
      return <Clock className="size-5 shrink-0 text-[#9CA3AF]" />;
  }
}

function etapeLabel(statut?: string): string {
  switch (statut) {
    case "termine": return "Terminé";
    case "en_cours": return "En cours";
    default: return "À venir";
  }
}

function etapeColor(statut?: string): string {
  switch (statut) {
    case "termine": return "#22C55E";
    case "en_cours": return "#0B5FFF";
    default: return "#9CA3AF";
  }
}

const tabContentVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

const TABS = [
  { key: "avancement", label: "Avancement", icon: ListChecks },
  { key: "photos", label: "Photos", icon: ImageOff },
  { key: "equipe", label: "Équipe", icon: Users },
  { key: "paiements", label: "Paiements", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ChantierDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [equipe, setEquipe] = useState<Membre[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("avancement");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const [c, e, p, eq, pa, d] = await Promise.all([
        rtdbGet<Chantier>(`chantiers/${id}`),
        rtdbGetList<Etape>(`chantiers/${id}/etapes`),
        rtdbGetList<Photo>(`chantiers/${id}/photos`),
        rtdbGetList<Membre>(`chantiers/${id}/equipe`),
        rtdbGetList<Paiement>(`chantiers/${id}/paiements`),
        rtdbGetList<DocumentItem>(`chantiers/${id}/documents`),
      ]);
      if (cancelled) return;
      setChantier(c);
      setEtapes(e);
      setPhotos(p);
      setEquipe(eq);
      setPaiements(pa);
      setDocuments(d);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const nom = chantier?.nom_projet || chantier?.nom || "Chantier";
  const pct = Number(chantier?.progression ?? chantier?.progress ?? 0);
  const chef = equipe.find((m) => (m.type || "chef") === "chef") || equipe[0];
  const ouvriers = equipe.filter((m) => (m.type || "chef") === "ouvrier");
  const totalPaye = paiements.reduce((acc, p) => acc + (Number(p.montant) || 0), 0);

  const waLink = (tel?: string) =>
    tel ? `https://wa.me/${tel.replace(/[^0-9]/g, "")}` : "#";

  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-28">
      {/* HEADER DU CHANTIER */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          {chantier?.photo || chantier?.image_url ? (
            <Image src={(chantier.photo || chantier.image_url)!} alt={nom} fill className="object-cover" />
          ) : (
            <div className="size-full bg-[#0D2B6B]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B6B]/85 via-[#0D2B6B]/70 to-[#0D2B6B]/95" />
        </div>

        <div className="relative px-4 pt-10 pb-6 sm:px-6">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-white/80 transition hover:text-white"
          >
            ← Retour
          </Link>
          <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
            {loading ? "Chargement..." : nom}
          </h1>
          {chantier?.adresse && (
            <p className="mt-1 text-sm font-semibold text-white/80">📍 {chantier.adresse}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-white/70">
            {chantier?.date_debut && <span>Début : {formatDateFr(chantier.date_debut)}</span>}
            {chantier?.date_fin && <span>Fin prévue : {formatDateFr(chantier.date_fin)}</span>}
          </div>
          <div className="mt-4 max-w-md">
            <ProgressBar value={pct} label="Progression globale" />
          </div>
        </div>
      </header>

      {/* TABS NAV */}
      <div className="sticky top-0 z-20 border-b border-[#E7EBF5] bg-[#F7F9FC]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-2 py-2">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${
                  active
                    ? "bg-[#0D2B6B] text-white shadow"
                    : "bg-white text-[#6B7280] hover:text-[#0D2B6B]"
                }`}
              >
                <t.icon size={15} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
            <div className="h-24 rounded-[20px] bg-[#E7EBF5]" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabContentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {/* ONGLET 1 - AVANCEMENT */}
              {activeTab === "avancement" && (
                <section aria-label="Avancement">
                  {etapes.length === 0 ? (
                    <EmptyState text="Aucune étape renseignée" />
                  ) : (
                    <div className="relative space-y-4 pl-2">
                      {etapes.map((e, i) => (
                        <div key={e.id} className="relative rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <div className="flex items-start gap-3">
                            {etapeIcon(e.statut)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-[#0D2B6B]">{e.nom || e.titre || `Étape ${i + 1}`}</h3>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                                  style={{ backgroundColor: etapeColor(e.statut) }}
                                >
                                  {etapeLabel(e.statut)}
                                </span>
                              </div>
                              {e.date && <p className="mt-0.5 text-xs text-[#6B7280]">📅 {formatDateFr(e.date)}</p>}
                              {e.description && <p className="mt-2 text-sm text-[#374151]">{e.description}</p>}
                              <div className="mt-3">
                                <ProgressBar value={Number(e.pourcentage ?? 0)} label="Avancement" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 2 - PHOTOS */}
              {activeTab === "photos" && (
                <section aria-label="Photos">
                  {photos.length === 0 ? (
                    <EmptyState text="Aucune photo disponible" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {photos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => p.url && setLightbox(p.url)}
                          className="group relative aspect-square overflow-hidden rounded-[18px] border border-[#E7EBF5] bg-[#E7EBF5] shadow-sm"
                        >
                          {p.url ? (
                            <Image src={p.url} alt="Photo chantier" fill className="object-cover transition group-hover:scale-105" />
                          ) : null}
                          {p.date && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-bold text-white">
                              {formatDateFr(p.date)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 3 - ÉQUIPE */}
              {activeTab === "equipe" && (
                <section aria-label="Équipe">
                  {equipe.length === 0 ? (
                    <EmptyState text="Équipe non renseignée" />
                  ) : (
                    <div className="space-y-3">
                      {chef && (
                        <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                          <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#6B7280]">Chef de chantier</p>
                          <div className="flex items-center gap-3">
                            <div className="relative size-14 overflow-hidden rounded-full bg-[#E7EBF5]">
                              {chef.photo ? <Image src={chef.photo} alt={chef.nom || ""} fill className="object-cover" /> : <Users className="m-3 size-8 text-[#9CA3AF]" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-black text-[#0D2B6B]">{chef.nom}</h3>
                              {chef.telephone && <p className="text-xs text-[#6B7280]">📞 {chef.telephone}</p>}
                            </div>
                            {chef.telephone && (
                              <a
                                href={waLink(chef.telephone)}
                                target="_blank"
                                rel="noreferrer"
                                className="grid size-10 place-items-center rounded-full bg-[#25D366] text-white"
                                aria-label="Contacter sur WhatsApp"
                              >
                                <MessageCircle size={18} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {ouvriers.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-3 shadow-sm">
                          <div className="relative size-11 overflow-hidden rounded-full bg-[#E7EBF5]">
                            {o.photo ? <Image src={o.photo} alt={o.nom || ""} fill className="object-cover" /> : <Users className="m-2.5 size-6 text-[#9CA3AF]" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-black text-[#0D2B6B]">{o.nom}</h4>
                            <p className="text-xs text-[#6B7280]">{o.role}{o.telephone ? ` · 📞 ${o.telephone}` : ""}</p>
                          </div>
                          {o.telephone && (
                            <a
                              href={waLink(o.telephone)}
                              target="_blank"
                              rel="noreferrer"
                              className="grid size-9 place-items-center rounded-full bg-[#25D366] text-white"
                              aria-label="Contacter sur WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 4 - PAIEMENTS */}
              {activeTab === "paiements" && (
                <section aria-label="Paiements">
                  {paiements.length === 0 ? (
                    <EmptyState text="Aucun paiement enregistré" />
                  ) : (
                    <div className="space-y-3">
                      {paiements.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-4 shadow-sm">
                          <div className="grid size-11 place-items-center rounded-[14px] bg-[#0D2B6B]/10 text-[#0D2B6B]">
                            <CreditCard size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#0D2B6B]">{formatFcfa(Number(p.montant) || 0)}</p>
                            <p className="text-xs text-[#6B7280]">
                              {formatDateFr(p.date)}{p.mode ? ` · ${p.mode}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-[18px] bg-[#0D2B6B] p-4 text-white">
                        <span className="text-sm font-black">Total payé</span>
                        <span className="text-lg font-black">{formatFcfa(totalPaye)}</span>
                      </div>
                      <Link
                        href="/paiement"
                        className="flex items-center justify-center gap-1.5 rounded-[16px] bg-[linear-gradient(135deg,#FF7A00,#FF9500)] py-3 text-sm font-black text-white transition active:scale-95"
                      >
                        Effectuer un paiement <ChevronRight size={16} />
                      </Link>
                    </div>
                  )}
                </section>
              )}

              {/* ONGLET 5 - DOCUMENTS */}
              {activeTab === "documents" && (
                <section aria-label="Documents">
                  {documents.length === 0 ? (
                    <EmptyState text="Aucun document disponible" />
                  ) : (
                    <div className="space-y-3">
                      {documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white p-4 shadow-sm">
                          <div className="grid size-11 place-items-center rounded-[14px] bg-[#8B5CF6]/10 text-[#8B5CF6]">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-[#0D2B6B]">{d.nom}</p>
                            <p className="text-xs text-[#6B7280]">
                              {d.type ? `${d.type} · ` : ""}{formatDateFr(d.date)}
                            </p>
                          </div>
                          {d.url && (
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className="grid size-9 place-items-center rounded-full bg-[#0D2B6B] text-white"
                              aria-label="Télécharger"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <Image src={lightbox} alt="Photo plein écran" width={800} height={800} className="max-h-[90vh] w-auto rounded-[16px] object-contain" />
        </div>
      )}

      {/* BOUTONS D'ACTION FIXES */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7EBF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-stretch gap-1 p-2">
          <ActionBtn icon={Phone} label="Appeler" href={chef?.telephone ? `tel:${chef.telephone}` : "#"} color="#0B5FFF" />
          <ActionBtn icon={MessageCircle} label="Chat" href={chef?.telephone ? waLink(chef.telephone) : "#"} color="#25D366" />
          <ActionBtn icon={AlertTriangle} label="Problème" href="/support" color="#EF4444" />
          <ActionBtn icon={CalendarPlus} label="Visite" href="/nouveau-chantier" color="#FF7A00" />
        </div>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#E7EBF5] bg-white p-10 text-center">
      <p className="text-sm font-bold text-[#6B7280]">{text}</p>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: typeof Phone;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      target={href.startsWith("http") || href.startsWith("tel") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2.5 text-white transition active:scale-95"
      style={{ backgroundColor: color }}
    >
      <Icon size={18} aria-hidden />
      <span className="text-[10px] font-black leading-none">{label}</span>
    </Link>
  );
}