"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Send, CheckCircle2 } from "lucide-react";
import { sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseServices } from "@/lib/firebase";
import BtpBackground from "@/components/btp/BtpBackground";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (!email.trim()) {
        setError("Veuillez entrer votre numéro de téléphone ou votre adresse e-mail.");
        setLoading(false);
        return;
      }

      // Si l'utilisateur entre un numéro, on le convertit en email Firebase comme partout ailleurs
      let firebaseEmail = email.trim();
      const cleanPhone = firebaseEmail.replace(/[\s\-\+]/g, '');
      if (/^[0-9]{8,15}$/.test(cleanPhone)) {
        firebaseEmail = `${cleanPhone}@batizen.ci`;
      }

      const { auth } = getFirebaseServices();
      await sendPasswordResetEmail(auth, firebaseEmail);
      
      setSuccess(true);
    } catch (err: any) {
      console.error("Erreur reset password:", err);
      if (err.code === "auth/user-not-found") {
        setError("Aucun compte ne correspond à ce numéro ou à cette adresse.");
      } else if (err.code === "auth/invalid-email") {
        setError("Le format du numéro ou de l'adresse est invalide.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <BtpBackground
      imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop"
      overlay="medium"
    >
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Bouton Retour */}
        <div className="absolute left-4 top-6 z-20">
          <Link 
            href="/login" 
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md border border-white/20 transition hover:bg-white/20 active:scale-95"
          >
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>

        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#0B5FFF]/20 text-[#0B5FFF]">
              <Mail size={32} />
            </div>
            <h1 className="text-2xl font-black text-white">Mot de passe oublié ?</h1>
            <p className="mt-2 text-sm text-blue-100">
              Entrez votre numéro de téléphone ou votre e-mail. Nous vous enverrons un lien pour le réinitialiser.
            </p>
          </div>

          {success ? (
            <div className="rounded-[24px] border border-green-500/30 bg-green-500/10 p-6 text-center backdrop-blur-xl animate-fadeInUp">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
              <h2 className="text-lg font-black text-white">E-mail envoyé !</h2>
              <p className="mt-2 text-sm text-green-200">
                Vérifiez votre boîte de réception (et vos spams) pour réinitialiser votre mot de passe.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-6 w-full rounded-[16px] bg-[#0B5FFF] py-3 text-sm font-black text-white transition hover:bg-[#0A4FDE] active:scale-95"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeInUp">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Numéro ou E-mail</label>
                <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-white/10 px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/50 border border-white/20 backdrop-blur-sm">
                  <Mail size={18} className="shrink-0 text-blue-200" aria-hidden />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: 07 07 07 07 07"
                    type="text"
                    required
                    className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/50"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-[14px] bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-300 border border-red-500/30">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#0B5FFF] text-sm font-black text-white shadow-lg shadow-[#0B5FFF]/30 transition-all hover:bg-[#0A4FDE] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={18} /> Envoyer le lien
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-blue-200">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login" className="font-black text-white hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </BtpBackground>
  );
}