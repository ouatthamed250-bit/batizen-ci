"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ref, onValue, type Unsubscribe } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

// Types pour les médias/album
type MediaItem = {
  id: string;
  chantierId?: string;
  url: string;
  type: "photo" | "video" | "pdf";
  nom?: string;
  description?: string;
  dateUpload?: number;
  categorie?: "avant" | "pendant" | "apres" | "speciale";
};

// Props du composant
interface AlbumChantierProps {
  chantierId: string;
}

// Catégories d'album
const CATEGORIES = [
  { key: "avant", label: "Avant travaux", color: "#1e3a8a" }, // Bleu marine
  { key: "pendant", label: "Pendant travaux", color: "#FF7A00" }, // Orange
  { key: "apres", label: "Après travaux", color: "#22C55E" }, // Vert
  { key: "speciale", label: "Photos spéciales", color: "#8B5CF6" }, // Violet
];

/**
 * Composant AlbumChantier
 * - Lit les albums/médias du chantier depuis `albums/` (nœud global)
 * - Affiche les médias par catégorie (avant, pendant, apres, speciale)
 * - Affiche les photos en grille avec lightbox
 */
export default function AlbumChantier({ chantierId }: AlbumChantierProps) {
  const { database } = getFirebaseServices();
  const [medias, setMedias] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeCategorie, setActiveCategorie] = useState<"tous" | "avant" | "pendant" | "apres" | "speciale">("tous");

  // 🔍 Listener temps réel pour les médias/albums
  useEffect(() => {
    if (!chantierId) return;

    console.log("🔍 AlbumChantier - Lecture médias pour chantierId:", chantierId);

    const mediasRef = ref(database, 'albums');
    const unsub: Unsubscribe = onValue(mediasRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Filtrer par chantierId depuis le nœud global albums/
        const allMedias = Object.entries(data)
          .map(([id, m]: [string, any]) => ({ id, ...m }))
          .filter((m: MediaItem) => String(m.chantierId) === String(chantierId))
          .sort((a: MediaItem, b: MediaItem) => (b.dateUpload || 0) - (a.dateUpload || 0));

        console.log("✅ AlbumChantier - Médias filtrés:", allMedias.length);
        setMedias(allMedias);
      } else {
        console.log("⚠️ AlbumChantier - Aucun média trouvé");
        setMedias([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("❌ AlbumChantier - Erreur:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [chantierId, database]);

  // Médias filtrés par catégorie
  const mediasFiltres = medias.filter(m => 
    activeCategorie === "tous" || m.categorie === activeCategorie
  );

  // Téléchargement d'un fichier
  const handleTelecharger = useCallback(async (url: string, nom: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = nom;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert("Impossible de télécharger le fichier.");
    }
  }, []);

  // Navigation dans le lightbox
  const goToPrev = useCallback(() => {
    if (lightboxIndex !== null && mediasFiltres.length > 1) {
      setLightboxIndex((lightboxIndex - 1 + mediasFiltres.length) % mediasFiltres.length);
    }
  }, [lightboxIndex, mediasFiltres.length]);

  const goToNext = useCallback(() => {
    if (lightboxIndex !== null && mediasFiltres.length > 1) {
      setLightboxIndex((lightboxIndex + 1) % mediasFiltres.length);
    }
  }, [lightboxIndex, mediasFiltres.length]);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
        <h2 className="text-lg font-black text-[#0D2B6B] mb-4">Album du chantier</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-40 rounded-[16px] bg-[#E7EBF5]" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-[#E7EBF5] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
      <h2 className="text-lg font-black text-[#0D2B6B] mb-4">Album du chantier</h2>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategorie("tous")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${
            activeCategorie === "tous" 
              ? "bg-[#0D2B6B] text-white" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tous ({medias.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategorie(cat.key as any)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              activeCategorie === cat.key 
                ? "bg-[#0D2B6B] text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label} ({medias.filter(m => m.categorie === cat.key).length})
          </button>
        ))}
      </div>

      {mediasFiltres.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Aucune photo ou vidéo dans cet album pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mediasFiltres.map((media, idx) => (
            <div key={media.id} className="relative group">
              <button
                onClick={() => media.url && setLightboxIndex(idx)}
                className="relative aspect-square rounded-lg overflow-hidden border border-[#E7EBF5] bg-[#E7EBF5] hover:opacity-90 transition"
              >
                {media.type === "photo" ? (
                  <img 
                    src={media.url} 
                    alt={media.description || media.nom || "Photo"} 
                    className="w-full h-full object-cover" 
                  />
                ) : media.type === "video" ? (
                  <video 
                    src={media.url} 
                    className="w-full h-full object-cover" 
                    muted 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
                
                {/* Badge type */}
                <span className="absolute top-1 right-1 bg-white/90 text-[#0D2B6B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {media.type === "photo" ? "📸" : media.type === "video" ? "🎥" : "📄"}
                </span>

                {/* Bouton téléchargement */}
                {media.url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTelecharger(media.url, media.nom || `media_${media.id}`);
                    }}
                    className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Télécharger"
                  >
                    <Download size={14} />
                  </button>
                )}
              </button>

              {/* Légende */}
              {media.description && (
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {media.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && mediasFiltres[lightboxIndex]?.url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {mediasFiltres[lightboxIndex].type === "photo" ? (
              <img 
                src={mediasFiltres[lightboxIndex].url} 
                alt={mediasFiltres[lightboxIndex].description || "Photo"} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg" 
              />
            ) : mediasFiltres[lightboxIndex].type === "video" ? (
              <video 
                src={mediasFiltres[lightboxIndex].url} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg" 
                controls 
              />
            ) : null}

            {/* Navigation */}
            {mediasFiltres.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Fermer */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white font-bold"
            >
              <X size={24} /> Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}