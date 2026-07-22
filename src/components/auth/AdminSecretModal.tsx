"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Lock } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getFirebaseServices } from "@/lib/firebase";
import { ref, update } from "firebase/database";

// ⚠️ IDÉAL : Déplacer cette valeur dans ton fichier .env.local (ex: NEXT_PUBLIC_ADMIN_SECRET)
// Pour l'instant, on la garde ici pour que ça fonctionne immédiatement.
const ADMIN_SECRET_PASSWORD = "batizen2026"; 

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Vérification du mot de passe
      if (password !== ADMIN_SECRET_PASSWORD) {
        setError("Mot de passe administrateur incorrect.");
        setLoading(false);
        return;
      }

      // 2. Vérification que l'utilisateur est bien connecté
      if (!user?.uid) {
        setError("Vous devez être connecté avec un compte pour activer ce mode.");
        setLoading(false);
        return;
      }

      // 3. Mise à jour du rôle dans Firebase Realtime Database
      const { database } = getFirebaseServices();
      const userRef = ref(database, `users/${user.uid}`);
      
      await update(userRef, {
        role: "admin",
        updatedAt: Date.now(),
      });

      // 4. Définition des cookies pour le middleware Next.js
      // max-age=86400 = 24 heures
      document.cookie = `batizen_admin=1; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_role=admin; path=/; max-age=86400; SameSite=Lax`;

      // 5. Redirection FORCÉE
      // On utilise window.location.href au lieu de router.push pour forcer un 
      // rechargement complet de la page. C'est OBLIGATOIRE pour que le middleware.ts 
      // côté serveur puisse lire les nouveaux cookies que nous venons de définir.
      window.location.href = "/admin/dashboard";

    } catch (err: any) {
      console.error("🔥 Erreur lors de l'activation du mode admin :", err);
      setError("Une erreur est survenue. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  };

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
              Mot de passe secret
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