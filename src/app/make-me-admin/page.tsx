"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";

const ADMIN_SECRET_CODE = "batizen2022";

export default function MakeMeAdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    if (!auth) {
      setStatus({ type: "error", message: "Firebase non configuré." });
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setStatus({ type: "info", message: `Connecté en tant que : ${user.email || user.uid}` });
      } else {
        setUid(null);
        setStatus({ type: "error", message: "Vous devez être connecté pour utiliser cette page." });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (!uid) {
      setStatus({ type: "error", message: "Vous devez être connecté." });
      return;
    }

    if (code !== ADMIN_SECRET_CODE) {
      setStatus({ type: "error", message: "Code secret invalide." });
      return;
    }

    setSubmitting(true);

    try {
      const { db } = getFirebaseServices();
      if (!db) {
        setStatus({ type: "error", message: "Base de données non disponible." });
        setSubmitting(false);
        return;
      }

      await set(ref(db, `users/${uid}/role`), "admin");

      setStatus({
        type: "success",
        message: "✅ Tu es admin. Déconnecte-toi et reconnecte-toi.",
      });
      setCode("");
    } catch (err: any) {
      console.error("❌ Erreur make-me-admin:", err);
      if (err.code === "PERMISSION_DENIED") {
        setStatus({
          type: "error",
          message: "Permission refusée. Vérifie les règles Firebase.",
        });
      } else {
        setStatus({
          type: "error",
          message: `Erreur : ${err.message || "Inconnue"}`,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827] text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl font-black">BÂTIZEN</div>
          <div className="text-sm text-white/70">Vérification de la connexion...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111827] px-4 text-white">
      <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#0F0F15] p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#FF7A00] text-lg font-black">
            B
          </div>
          <h1 className="text-lg font-black">Accès Administrateur</h1>
          <p className="mt-1 text-sm text-white/60">Page secrète — usage interne</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">
              Code secret
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setStatus(null);
              }}
              placeholder="Entrez le code"
              className="w-full h-[50px] rounded-[16px] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 transition-all"
              autoFocus
            />
          </div>

          {status && (
            <p
              className={`rounded-[12px] px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : status.type === "error"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !uid || code.length < 4}
            className="w-full h-[52px] rounded-[16px] bg-[#FF7A00] text-white font-black text-sm shadow-lg transition-all hover:bg-[#E66E00] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Activation..." : "Devenir admin"}
          </button>
        </form>

        {uid && (
          <p className="mt-4 text-center text-xs text-white/40 break-all">
            UID : {uid}
          </p>
        )}
      </div>
    </div>
  );
}