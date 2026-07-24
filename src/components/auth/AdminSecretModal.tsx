"use client";

import { useState } from "react";
import { X, Lock } from "lucide-react";
import { ref, set } from "firebase/database";
import { useAuthContext } from "@/contexts/AuthContext";
import { getFirebaseServices } from "@/lib/firebase";

const ADMIN_SECRET_CODE = "batizen2022";

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSecretModal({ isOpen, onClose }: AdminSecretModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  if (!isOpen) return null;

  /**
   * Vérifie le mot de passe admin et écrit le rôle "admin" dans la Realtime Database.
   * Écriture directe côté client : users/{uid}/role = "admin".
   * Les règles Firebase protègent cette écriture (auth.token.role === 'admin' requis).
   */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Vérifier que l'utilisateur est bien connecté
      if (!user) {
        setError("Vous devez être connecté avec un compte pour activer ce mode.");
        setLoading(false);
        return;
      }

      // 2. Vérifier le code secret
      if (password !== ADMIN_SECRET_CODE) {
        setError("Code secret invalide.");
        setLoading(false);
        return;
      }

      // 3. Écrire directement le rôle admin dans la Realtime Database
      const { db } = getFirebaseServices();
      if (!db) {
        setError("Base de données non disponible.");
        setLoading(false);
        return;
      }

      await set(ref(db, `users/${user.uid}/role`), "admin");

      // 4. Redirection vers le dashboard admin
      window.location.href = "/admin/dashboard";

    } catch (err: any) {
      console.error("🔥 Erreur lors de l'activation du mode admin :", err);
      if (err.code === "PERMISSION_DENIED") {
        setError("Permission refusée par les règles Firebase.");
      } else {
        setError("Une erreur est survenue. Vérifiez votre connexion internet.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl border border-[#E7EBF5] animate-bounceIn">
        
        {/* En-tête du modal */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-[#0B5FFF]/10 text-[#0B5FFF]">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-black text-[#0D2B6B]">Accès Administrateur</h3>
          </div>
          <button 
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]">
              Mot de passe secret administrateur
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // Efface l'erreur dès que l'utilisateur tape
              }}
              placeholder="Entrez le code secret"
              className="w-full h-[50px] rounded-[16px] border border-[#E7EBF5] bg-[#F7F9FC] px-4 text-sm font-semibold text-[#111827] outline-none focus:border-[#0B5FFF] focus:ring-2 focus:ring-[#0B5FFF]/20 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-[12px] border border-red-100 animate-fadeInUp">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 4}
            className="w-full h-[52px] rounded-[16px] bg-[#0B5FFF] text-white font-black text-sm shadow-lg shadow-[#0B5FFF]/30 transition-all hover:bg-[#0A4FDE] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Vérification en cours..." : "Valider l'accès"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Cet accès est réservé aux administrateurs de BÂTIZEN CI.
        </p>
      </div>
    </div>
  );
}