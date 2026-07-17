"use client";

import { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, update } from "firebase/database";
import { hasFirebaseConfig } from "@/lib/firebase";

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSecretModal({ isOpen, onClose }: AdminSecretModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!hasFirebaseConfig()) {
        throw new Error("Configuration Firebase manquante");
      }

      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        "admin@batizen.ci",
        password
      );
      const user = userCredential.user;

      const handleVerify = async () => {
        if (password === "batizen2026") {
          try {
            // 1. Forcer le rôle admin dans Firebase pour l'utilisateur actuel
            const db = getDatabase();
            if (user?.uid) {
              await update(ref(db, `users/${user.uid}`), {
                role: "admin",
                displayName: user.displayName || "Administrateur"
              });
            }

            // 2. Définir le cookie d'administration
            document.cookie = "batizen_admin=1; path=/; max-age=604800; SameSite=Strict";

            // 3. Fermer le modal et rediriger de force
            onClose();
            window.location.href = "/admin";
            
          } catch (error) {
            console.error("Erreur mise à jour role admin:", error);
            setError("Erreur technique lors de l'activation du mode admin.");
          }
        } else {
          setError("Mot de passe incorrect");
        }
      };

      await handleVerify();
    } catch (err) {
      setError("Mot de passe incorrect");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 text-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <ShieldAlert className="text-[#FF6B00]" size={20} />
            Accès Administrateur
          </h3>
          <button 
            type="button" 
            onClick={handleCancel} 
            aria-label="Fermer"
            className="rounded-full p-1 hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-sm font-medium text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#FF6B00]/50"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-400">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 h-12 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-b from-[#FF8C00] to-[#CC5500] font-bold text-white shadow-lg transition active:scale-[0.97] disabled:opacity-60"
            >
              {loading ? "Vérification..." : "Valider"}
            </button>
          </div>
        </form>

        {/* Warning */}
        <p className="mt-4 text-center text-xs text-white/60">
          ⚠️ Accès réservé au personnel autorisé
        </p>
      </div>
    </div>
  );
}