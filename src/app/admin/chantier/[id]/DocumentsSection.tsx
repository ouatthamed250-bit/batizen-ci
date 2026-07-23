"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Download, Trash2, FileDown } from "lucide-react";
import { rtdbGetList } from "@/lib/rtdb";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuthContext } from "@/contexts/AuthContext";
import { getFirebaseServices } from '../../../../lib/firebase';

type Document = {
  id: string;
  chantierId: string;
  nom: string;
  type: "devis" | "facture" | "plan" | "autre";
  url: string;
  taille: number;
  dateUpload: number;
  creePar: string;
  actif: boolean;
};

interface DocumentsSectionProps {
  chantierId: string;
}

/**
 * Section Documents pour l'admin - Upload et affichage des documents
 * Types : devis, facture, plan, autre
 */
export default function DocumentsSection({ chantierId }: DocumentsSectionProps) {
  const { user } = useAuthContext();
  const { db: db } = getFirebaseServices();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<"devis" | "facture" | "plan" | "autre">("devis");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les documents existants
  useEffect(() => {
    if (!chantierId) return;

    const docsRef = ref(db, `documents/${chantierId}`);
    const unsubDocs: Unsubscribe = onValue(docsRef, (snapshot) => {
      console.log("✅ [SEC-ADMIN] Requête documents compatible règles strictes (admin-only)");
      const data = snapshot.val();
      if (data) {
        const docsList = Object.entries(data)
          .filter(([_, d]: [string, any]) => d.actif !== false)
          .map(([id, d]: [string, any]) => ({ id, ...d }))
          .sort((a: any, b: any) => b.dateUpload - a.dateUpload);
        setDocuments(docsList as Document[]);
      } else {
        setDocuments([]);
      }
      setLoading(false);
    });

    return () => unsubDocs();
  }, [chantierId, db]);

  // Upload d'un document
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);

      await push(ref(db, `documents/${chantierId}`), {
        chantierId,
        nom: file.name,
        type: docType,
        url,
        taille: file.size,
        dateUpload: Date.now(),
        creePar: user?.uid || "admin",
        actif: true
      });

      alert("✅ Document uploadé avec succès !");
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("❌ Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Supprimer (soft delete) un document
  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await update(ref(db, `documents/${chantierId}/${id}`), { actif: false });
  };

  // Icône selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "devis": return "📋";
      case "facture": return "💰";
      case "plan": return "📐";
      default: return "📁";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-[18px] bg-gray-200" />
        <div className="h-20 rounded-[18px] bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="mt-6 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <h3 className="font-black text-[var(--navy)] text-lg mb-4 flex items-center gap-2">
        📄 Documents du chantier
      </h3>

      {/* Formulaire d'upload */}
      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Type de document</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as any)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF7A00]/50 mb-3"
        >
          <option value="devis">📋 Devis</option>
          <option value="facture">💰 Facture</option>
          <option value="plan">📐 Plan architectural</option>
          <option value="autre">📁 Autre</option>
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleUploadDocument}
          className="hidden"
          id="doc-upload-admin"
        />
        <label
          htmlFor="doc-upload-admin"
          className="inline-block w-full text-center px-6 py-3 bg-[#FF7A00] text-white font-bold rounded-xl cursor-pointer hover:bg-[#e66e00] transition"
        >
          {uploading ? "⏳ Upload en cours..." : "📎 Choisir un fichier"}
        </label>
      </div>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucun document pour ce chantier.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getTypeIcon(doc.type)}
                </span>
                <div>
                  <p className="font-bold text-[var(--navy)]">{doc.nom}</p>
                  <p className="text-xs text-gray-500">
                    {(doc.taille / 1024).toFixed(1)} KB • {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition"
                >
                  ⬇️ Télécharger
                </a>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}