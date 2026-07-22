"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Cloud, Headphones, Lock, Phone, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { validateAndFormatPhone } from "@/utils/validators"; // ✅ NOUVEAU
import { GoogleIcon } from "@/components/ui/GoogleIcon";     // ✅ NOUVEAU
import AdminSecretModal from "@/components/auth/AdminSecretModal";

export const dynamic = "force-static";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuthContext();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  function handleLogoTap() {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer) clearTimeout(tapTimer);
    const t = setTimeout(() => { setTapCount(0); }, 2000);
    setTapTimer(t);
    if (newCount >= 5) {
      setTapCount(0);
      if (tapTimer) clearTimeout(tapTimer);
      setShowAdminModal(true);
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated && !loading) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, loading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0B5FFF] border-t-transparent" />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // ✅ Utilisation du helper centralisé
      const validation = validateAndFormatPhone(phone);
      
      if (!validation.isValid) {
        setError(validation.error || "Numéro invalide");
        setLoading(false);
        return;
      }

      await login(validation.firebaseEmail, password);
      router.replace("/dashboard");
    } catch (err: any) {
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found") {
        setError("Numéro de téléphone ou mot de passe incorrect.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Trop de tentatives. Veuillez réessayer plus tard.");
      } else {
        setError(err?.message || "Une erreur est survenue lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError("La fenêtre de connexion a été fermée prématurément.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Erreur de configuration : domaine non autorisé.");
      } else {
        setError("Connexion Google échouée. Vérifiez la console.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      <img src="/images/hero-bg.jpg" alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 py-4">
        {showAdminModal && <AdminSecretModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />}

        <div className="text-center mb-4">
          <img src="/assets/images/logo.png" alt="BÂTIZEN.CI" className="w-20 h-20 mx-auto mb-3 rounded-2xl shadow-lg cursor-pointer" onClick={handleLogoTap} />
          <h1 className="text-2xl font-bold text-white">BÂTIZEN.CI</h1>
          <p className="text-sm text-white/80">Votre partenaire BTP</p>
        </div>

        <div className="animate-fadeInUp stagger-1 mt-2 text-center">
          <h2 className="text-xl font-black text-white">Bienvenue !</h2>
          <p className="mt-1 max-w-[260px] text-sm text-white/60">Connectez-vous pour accéder à tous vos projets.</p>
        </div>

        <form className="animate-fadeInUp stagger-3 mt-4 w-full max-w-sm space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Numéro de téléphone</span>
            <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-white/20 px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/20">
              <Phone size={18} className="shrink-0 text-white" aria-hidden />
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="ex: 07 07 07 07 07" 
                type="tel" 
                autoComplete="tel" 
                required 
                className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/60" 
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Mot de passe</span>
            <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-white/20 px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/20">
              <Lock size={18} className="shrink-0 text-white" aria-hidden />
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                type="password" 
                autoComplete="current-password" 
                required 
                className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/60" 
              />
            </div>
          </label>

          <div className="flex items-center justify-end text-xs">
            <Link href="/forgot-password" className="font-bold text-white hover:underline">Mot de passe oublié ?</Link>
          </div>

          {error && (
            <p className="rounded-[14px] bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-300 border border-red-500/30 animate-fadeInUp">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            aria-label="Se connecter" 
            className="mt-4 flex h-[58px] w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white shadow-lg transition active:scale-[0.97] disabled:opacity-60"
          >
            <div className="grid size-9 place-items-center rounded-full bg-white/20">
              <ArrowRight size={18} aria-hidden />
            </div>
            <span className="text-base font-black">{loading ? "Connexion…" : "Se connecter"}</span>
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-xs font-bold text-white">OU</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <button 
            type="button" 
            onClick={handleGoogle} 
            disabled={loading} 
            aria-label="Continuer avec Google" 
            className="mt-4 flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] border border-white/20 bg-white/20 text-sm font-bold text-white transition-all hover:border-white/30 active:scale-[0.97] disabled:opacity-60"
          >
            <GoogleIcon className="w-5 h-5" /> {/* ✅ Icône Google propre */}
            Continuer avec Google
          </button>
        </form>

        <div className="animate-fadeInUp stagger-4 mt-4 text-center text-sm">
          <span className="text-white/80">Pas de compte ? </span>
          <Link href="/register" className="font-black text-white hover:underline">S'inscrire</Link>
        </div>

        <div className="animate-fadeInUp stagger-5 mt-6 flex w-full max-w-sm justify-between gap-3">
          {[
            { icon: ShieldCheck, title: "Données sécurisées", sub: "100% protégées" },
            { icon: Cloud, title: "Sauvegarde auto", sub: "Sur le cloud" },
            { icon: Headphones, title: "Support 7j/7", sub: "Toujours là" },
          ].map((t) => (
            <div key={t.title} className="flex flex-1 flex-col items-center gap-1 text-center">
              <t.icon size={16} className="text-white" aria-hidden />
              <span className="text-[9px] font-black text-white">{t.title}</span>
              <span className="text-[8px] text-white/80">{t.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}