"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Eye, EyeOff, Save, AlertCircle } from "lucide-react";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getFirebaseServices } from '../../../lib/firebase';
export default function AdminParametresPage() {
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmationMdp, setConfirmationMdp] = useState("");
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async () => {
    // Validation
    if (!ancienMdp || !nouveauMdp || !confirmationMdp) {
      setMessage({ type: "error", text: "Tous les champs sont obligatoires" });
      return;
    }
    
    if (nouveauMdp !== confirmationMdp) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    
    if (nouveauMdp.length < 6) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { auth } = getFirebaseServices();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Aucun utilisateur connecté");
      }

      // Pour updatePassword, Firebase exige que l'utilisateur soit récemment authentifié
      // On réauthente avec l'ancien mot de passe
      const credential = EmailAuthProvider.credential(user.email!, ancienMdp);
      await reauthenticateWithCredential(user, credential);
      
      // Mettre à jour le mot de passe
      await updatePassword(user, nouveauMdp);
      
      setMessage({ type: "success", text: "✅ Mot de passe mis à jour avec succès !" });
      setAncienMdp("");
      setNouveauMdp("");
      setConfirmationMdp("");
    } catch (error: any) {
      console.error("Erreur changement mot de passe:", error);
      let errorMsg = "Erreur lors de la mise à jour";
      
      if (error.code === "auth/wrong-password") {
        errorMsg = "L'ancien mot de passe est incorrect";
      } else if (error.code === "auth/requires-recent-login") {
        errorMsg = "Veuillez vous reconnecter pour modifier le mot de passe";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) return;
    
    try {
      const { auth } = getFirebaseServices();
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">⚙️ Paramètres Admin</h1>
          <p className="mt-1 text-sm text-white/60">Gérez votre compte administrateur</p>
        </div>

        {/* Message d'alerte */}
        {message && (
          <div className={`rounded-[12px] p-4 ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Section Changement de mot de passe */}
        <div className="rounded-[16px] border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-black text-[#FF7A00]">
            <Key size={20} /> Changer le mot de passe
          </h2>
          
          <div className="space-y-4">
            {/* Ancien mot de passe */}
            <div className="relative">
              <label className="mb-2 block text-xs font-bold">Ancien mot de passe</label>
              <input
                type={showAncien ? "text" : "password"}
                value={ancienMdp}
                onChange={(e) => setAncienMdp(e.target.value)}
                placeholder="Entrez votre ancien mot de passe"
                className="h-12 w-full rounded-[12px] bg-white/5 pr-12 pl-4 text-sm font-bold outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF7A00]"
              />
              <button
                type="button"
                onClick={() => setShowAncien(!showAncien)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showAncien ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Nouveau mot de passe */}
            <div className="relative">
              <label className="mb-2 block text-xs font-bold">Nouveau mot de passe</label>
              <input
                type={showNouveau ? "text" : "password"}
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
                placeholder="Entrez le nouveau mot de passe (min 6 caractères)"
                className="h-12 w-full rounded-[12px] bg-white/5 pr-12 pl-4 text-sm font-bold outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF7A00]"
              />
              <button
                type="button"
                onClick={() => setShowNouveau(!showNouveau)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showNouveau ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirmation mot de passe */}
            <div className="relative">
              <label className="mb-2 block text-xs font-bold">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmationMdp}
                onChange={(e) => setConfirmationMdp(e.target.value)}
                placeholder="Confirmez le nouveau mot de passe"
                className="h-12 w-full rounded-[12px] bg-white/5 px-4 text-sm font-bold outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF7A00]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleChangePassword}
              disabled={loading}
              className="flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#FF7A00] to-[#FF8C00] px-6 py-3 font-bold text-white shadow-lg disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : <><Save size={18} /> Mettre à jour le mot de passe</>}
            </motion.button>
          </div>
        </div>

        {/* Section Déconnexion */}
        <div className="rounded-[16px] border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="mb-4 font-black text-red-400">Déconnexion</h2>
          <p className="text-sm text-white/60 mb-4">
            Déconnectez-vous de votre session administrateur en toute sécurité.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-[12px] bg-red-500/20 px-6 py-3 font-bold text-red-400 hover:bg-red-500/30 transition"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}