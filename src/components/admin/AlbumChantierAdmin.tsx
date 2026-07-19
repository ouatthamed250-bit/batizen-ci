"use client";

import { useState, useCallback } from "react";
import { Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ref, push, update, remove } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Types pour les médias
type MediaItem = {
  id?: string;
  chantierId: string;
  url: string;
  type: "photo" | "video" | "pdf";
  nom?: string;
  description?: string;
  dateUpload?: number;
  categorie?: "avant" | "pendant" | "apres" | "speciale";
};

// Props du composant
interface AlbumChantierAdminProps {
  chantierId: string;
}

/**
 * Composant AlbumChantierAdmin
 * - Permet à l'admin d'uploader des médias depuis Cloudinary
 * - Sauvegarde dans le nœud `albums/` avec chantierId associé
 * - Affiche les médias en grille avec possibilité de suppression
 */
export default function AlbumChantierAdmin({ chantierId }: AlbumChantierAdminProps) {
  const { database } = getFirebaseServices();
  const [medias, setMedias] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<"avant" | "pendant" | "apres" | "speciale">("pendant");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Charger les médias existants
  const loadMedias = useCallback(async () => {
    const snapshot = await (await import("firebase/database")).get(ref(database, 'albums'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allMedias = Object.entries(data)
        .map(([id, m]: [string, any]) => ({ id, ...m }))
        .filter((m: MediaItem) => String(m.chantierId) === String(chantierId))
        .sort((a: MediaItem, b: MediaItem) => (b.dateUpload || 0) - (a.dateUpload || 0));
      setMedias(allMedias);
    }
  }, [chantierId, database]);

  // Upload d'un fichier
  const handleUpload = async (file: File, type: "photo" | "video" | "pdf", description: string) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      
      const newMedia: MediaItem = {
        chantierId: String(chantierId),
        url,
        type,
        nom: file.name,
        description: description || "",
        categorie: selectedCategorie,
        dateUpload: Date.now()
      };

      const newRef = push(ref(database, 'albums'));
      await update(newRef, newMedia);
      
      setMedias([newMedia, ...medias]);
      console.log("✅ Média uploadé avec succès:", newMedia);
    } catch (error) {
      console.error("Erreur upload média:", error);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setUploading(false);
    }
  };

  // Supprimer un média
  const handleDelete = async (mediaId: string) => {
    if (!confirm("Supprimer ce média ?")) return;
    
    try {
      await remove(ref(database, `albums/${mediaId}`));
      setMedias(medias.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Navigation lightbox
  const goToPrev = () => {
    if (lightboxIndex !== null && medias.length > 1) {
      setLightboxIndex((lightboxIndex - 1 + medias.length) % medias.length);
    }
  };

  const goToNext = () => {
    if (lightboxIndex !== null && medias.length > 1) {
      setLightboxIndex((lightboxIndex + 1) % medias.length);
    }
  };

  // Gestion du fichier à uploader
  const triggerUpload = (accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      
      const desc = prompt("Description du média (optionnel) :") || "";
      const fileType = file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "pdf" : "photo";
      await handleUpload(file, fileType as any, desc);
    };
    input.click();
  };

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-black text-[#FF7A00]">
          <ImageIcon size={20} /> 📸 Album du chantier
        </h3>
        <div className="flex gap-2">
          <select 
            value={selectedCategorie}
            onChange={(e) => setSelectedCategorie(e.target.value as any)}
            className="h-8 rounded-[8px] bg-white/10 px-2 text-xs font-bold text-white outline-none ring-1 ring-white/10"
          >
            <option value="avant">Avant travaux</option>
            <option value="pendant">Pendant travaux</option>
            <option value="apres">Après travaux</option>
            <option value="speciale">Spécial</option>
          </select>
          <button 
            onClick={() => triggerUpload("image/*")}
            disabled={uploading}
            className="flex items-center gap-1 rounded-[8px] bg-[#0B5FFF] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
          >
            <Upload size={14} /> Photo
          </button>
          <button 
            onClick={() => triggerUpload("video/*")}
            disabled={uploading}
            className="flex items-center gap-1 rounded-[8px] bg-[#8B5CF6] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
          >
            <Upload size={14} /> Vidéo
          </button>
        </div>
      </div>

      {medias.length === 0 ? (
        <p className="text-sm text-white/50">Aucun média dans l'album.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {medias.map((media, idx) => (
            <div key={media.id || idx} className="relative group">
              <button
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5"
              >
                {media.type === "photo" ? (
                  <img src={media.url} alt={media.description || "Photo"} className="w-full h-full object-cover" />
                ) : media.type === "video" ? (
                  <video src={media.url} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
                <span className="absolute top-1 right-1 bg-white/90 text-[#0D2B6B] text-[10px] font-bold px-1 py-0.5 rounded-full">
                  {media.categorie}
                </span>
              </button>

              {media.id && (
                <button
                  onClick={() => handleDelete(media.id!)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  title="Supprimer"
                >
                  <X size={12} />
                </button>
              )}

              {media.description && (
                <p className="mt-1 text-xs text-white/60 truncate">{media.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && medias[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {medias[lightboxIndex].type === "photo" ? (
              <img 
                src={medias[lightboxIndex].url} 
                alt={medias[lightboxIndex].description || "Photo"} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg" 
              />
            ) : medias[lightboxIndex].type === "video" ? (
              <video 
                src={medias[lightboxIndex].url} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg" 
                controls 
              />
            ) : (
              <a 
                href={medias[lightboxIndex].url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white text-lg"
              >
                📄 Voir le PDF
              </a>
            )}

            {medias.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white p-2 rounded-full"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white font-bold"
            >
              <X size={24} /> Fermer
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <p className="mt-2 text-xs text-white/60">⏳ Upload en cours...</p>
      )}
    </div>
  );
}