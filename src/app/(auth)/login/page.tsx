"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Cloud, Headphones, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/BackButton";
import { verifyAdminCode } from "@/lib/admin";
import { X, ShieldAlert } from "lucide-react";

export const dynamic = "force-static";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuthContext();

  // Tous les hooks doivent être appelés avant tout retour conditionnel
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Connexion secrète admin (5 taps sur le logo en 2s)
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [adminModal, setAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");

  function handleLogoTap() {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer) clearTimeout(tapTimer);
    const t = setTimeout(() => {
      setTapCount(0);
    }, 2000);
    setTapTimer(t);
    if (newCount >= 5) {
      setTapCount(0);
      if (tapTimer) clearTimeout(tapTimer);
      setAdminModal(true);
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    try {
      const ok = await verifyAdminCode(adminCode);
      if (ok) {
        setAdminModal(false);
        router.replace("/admin");
      } else {
        setAdminError("Code incorrect. Réessayez.");
      }
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Erreur de connexion.");
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

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
      if (loginMethod === "email") {
        await login(email, password);
      } else {
        // Authentification par téléphone non disponible pour le moment
        setError("La connexion par téléphone sera bientôt disponible. Utilisez votre email.");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError(loginMethod === "email" ? "Email ou mot de passe incorrect." : "Numéro ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.replace("/dashboard");
    } catch {
      setError("Connexion Google annulée ou échouée.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative">
      <img 
        src="/images/hero-bg.jpg" 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <main className="w-full max-w-sm flex flex-col items-center px-6 pb-8 pt-14">
      <div className="relative -top-40 right-0 size-80 rounded-full bg-[#0B5FFF] opacity-[0.04] blur-[80px]" />

      <div className="relative z-30 left-6 top-6">
        <BackButton href="/welcome" />
      </div>

      <div
        className="animate-bounceIn cursor-pointer select-none"
        onClick={handleLogoTap}
        title="BÂTIZEN CI"
      >
        <Image src="/assets/images/logo.png" alt="BÂTIZEN CI" width={100} height={100} priority className="rounded-[28px] shadow-[0_20px_40px_rgba(11,95,255,0.15)]" />
      </div>

      {adminModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setAdminModal(false)}>
          <div
            className="w-full max-w-sm rounded-[24px] bg-[#111827] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black">
                <ShieldAlert className="text-[#FF7A00]" /> Code admin requis
              </h3>
              <button type="button" onClick={() => setAdminModal(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <input
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Saisissez le code"
                autoFocus
                className="h-12 w-full rounded-[14px] bg-[#1F2937] px-4 text-sm font-bold text-white outline-none ring-1 ring-white/10 focus:ring-[#FF7A00]"
              />
              {adminError && <p className="text-sm font-semibold text-red-400">{adminError}</p>}
              <button
                type="submit"
                className="h-12 w-full rounded-[14px] bg-[#FF7A00] font-black text-white transition active:scale-95"
              >
                Valider
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="animate-fadeInUp stagger-1 mt-4 text-center">
        <h1 className="text-2xl font-black tracking-[-0.04em]">
          <span className="text-[#0D2B6B]">BÂTIZEN</span>{" "}
          <span className="text-[#FF7A00]">CI</span>
        </h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <div className="h-px w-5 bg-[#0B5FFF]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#0B5FFF]">Construction Technology</span>
          <div className="h-px w-5 bg-[#0B5FFF]" />
        </div>
      </div>

      <div className="animate-fadeInUp stagger-2 mt-6 text-center">
        <h2 className="text-[26px] font-black text-[#0D2B6B]">Bienvenue !</h2>
        <p className="mt-2 max-w-[260px] text-sm text-[#6B7280]">Connectez-vous pour accéder à tous vos projets et gérer vos chantiers.</p>
      </div>

      <div className="animate-fadeInUp stagger-3 mt-6 w-full max-w-sm rounded-[28px] bg-white/80 p-6 shadow-[0_20px_50px_rgba(16,24,40,0.08)] backdrop-blur-xl border border-[#E7EBF5]">
        {/* Toggle Login Method */}
        <div className="mb-4 flex gap-2 rounded-[16px] bg-[#F7F9FC] p-1">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-bold transition-all ${loginMethod === "email" ? "bg-white shadow-[0_2px_8px_rgba(16,24,40,0.08)] text-[#0D2B6B]" : "text-[#6B7280]"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-bold transition-all ${loginMethod === "phone" ? "bg-white shadow-[0_2px_8px_rgba(16,24,40,0.08)] text-[#0D2B6B]" : "text-[#6B7280]"}`}
          >
            Téléphone
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleLogin} aria-label="Formulaire de connexion">
          {loginMethod === "email" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#111827]">Adresse e-mail</span>
              <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-[#F7F9FC] px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/20">
                <Mail size={18} className="shrink-0 text-[#0B5FFF]" aria-hidden />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.ci"
                  type="email"
                  autoComplete="email"
                  required
                  className="flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#6B7280]"
                />
              </div>
            </label>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#111827]">Numéro de téléphone</span>
              <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-[#F7F9FC] px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/20">
                <Phone size={18} className="shrink-0 text-[#0B5FFF]" aria-hidden />
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#6B7280]"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#111827]">Mot de passe</span>
            <div className="flex h-[56px] items-center gap-3 rounded-[18px] bg-[#F7F9FC] px-4 transition focus-within:ring-2 focus-within:ring-[#0B5FFF]/20">
              <Lock size={18} className="shrink-0 text-[#0B5FFF]" aria-hidden />
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                required
                className="flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#6B7280]"
              />
            </div>
          </label>

          <div className="flex items-center justify-end text-xs">
            <Link href="/forgot-password" className="font-bold text-[#0B5FFF] hover:underline">Mot de passe oublié ?</Link>
          </div>

          {error && (
            <p className="rounded-[14px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-label="Se connecter"
            className="mt-2 flex h-[58px] w-full items-center justify-center gap-3 rounded-[20px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_14px_36px_rgba(11,95,255,0.35)] transition-all active:scale-[0.97] disabled:opacity-60"
          >
            <div className="grid size-9 place-items-center rounded-full bg-white/20">
              <ArrowRight size={18} aria-hidden />
            </div>
            <span className="text-base font-black">{loading ? "Connexion…" : "Se connecter"}</span>
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E7EBF5]" />
          <span className="text-xs font-bold text-[#6B7280]">OU</span>
          <div className="h-px flex-1 bg-[#E7EBF5]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          aria-label="Continuer avec Google"
          className="mt-4 flex h-[54px] w-full items-center justify-center gap-3 rounded-[18px] border border-[#E7EBF5] bg-white text-sm font-bold text-[#111827] transition-all hover:border-[#0B5FFF]/30 active:scale-[0.97] disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuer avec Google
        </button>
      </div>

      <div className="animate-fadeInUp stagger-4 mt-5 text-center text-sm">
        <span className="text-[#6B7280]">Pas encore de compte ? </span>
        <Link href="/register" className="font-black text-[#0B5FFF] hover:underline">Créer un compte →</Link>
      </div>

      <div className="animate-fadeInUp stagger-5 mt-8 flex w-full max-w-sm justify-between gap-3">
        {[
          { icon: ShieldCheck, title: "Données sécurisées", sub: "100% protégées" },
          { icon: Cloud, title: "Sauvegarde auto", sub: "Sur le cloud" },
          { icon: Headphones, title: "Support 7j/7", sub: "Toujours là" },
        ].map((t) => (
          <div key={t.title} className="flex flex-1 flex-col items-center gap-1 text-center">
            <t.icon size={16} className="text-[#0B5FFF]" aria-hidden />
            <span className="text-[9px] font-black text-[#0D2B6B]">{t.title}</span>
            <span className="text-[8px] text-[#6B7280]">{t.sub}</span>
          </div>
        ))}
      </div>
        </main>
      </div>
    </div>
  );
}
