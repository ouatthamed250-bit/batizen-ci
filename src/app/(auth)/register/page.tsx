"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail, MapPin, Phone, User, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { checkPasswordStrength } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import BtpBackground from "@/components/btp/BtpBackground";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuthContext();
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ strength: 'weak' | 'medium' | 'strong'; score: number; feedback: string[] } | null>(null);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      if (key === "password") {
        setPasswordStrength(checkPasswordStrength(e.target.value));
      }
    };
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // Validation du mot de passe
    if (passwordStrength && passwordStrength.strength === 'weak') {
      setError("Votre mot de passe est trop faible. Veuillez le renforcer.");
      return;
    }
    
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      if (msg === "auth/email-already-in-use") setError("Cet email est déjà utilisé.");
      else if (msg === "auth/weak-password") setError("Mot de passe trop faible (6 caractères min).");
      else setError("Erreur lors de la création du compte.");
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

  const fields = [
    { key: "name",     icon: User,    placeholder: "Nom complet",       type: "text",     label: "Nom complet",    autoComplete: "name" },
    { key: "email",    icon: Mail,    placeholder: "Adresse e-mail",     type: "email",    label: "Adresse e-mail", autoComplete: "email" },
    { key: "phone",    icon: Phone,   placeholder: "Téléphone (+225)",   type: "tel",      label: "Téléphone",      autoComplete: "tel" },
    { key: "city",     icon: MapPin,  placeholder: "Ville (ex: Abidjan)",type: "text",     label: "Ville",          autoComplete: "address-level2" },
    { key: "password", icon: Lock,    placeholder: "••••••••",           type: "password", label: "Mot de passe",   autoComplete: "new-password" },
  ] as const;

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return 'Faible';
      case 'medium': return 'Moyen';
      case 'strong': return 'Fort';
      default: return '';
    }
  };

  return (
    <BtpBackground
      imageUrl="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop"
      overlay="light"
    >
      <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 pb-10 pt-12">

      <div className="absolute left-6 top-6 z-20">
        <BackButton href="/welcome" />
      </div>

      <div className="relative z-10 animate-bounceIn">
        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#0B5FFF] to-[#0D2B6B] blur-xl opacity-30 transform scale-110" />
          <Image src="/assets/images/logo.png" alt="BÂTIZEN CI" width={100} height={100} priority className="relative rounded-[28px] shadow-[0_20px_40px_rgba(11,95,255,0.25)] transform hover:scale-105 transition-transform duration-300" />
        </div>
      </div>

      <div className="relative z-10 animate-fadeInUp stagger-1 mt-6 text-center">
        <h1 className="text-3xl font-black tracking-[-0.04em]">
          <span className="text-[#0D2B6B]">BÂTIZEN</span>{" "}
          <span className="text-[#FF7A00]">CI</span>
        </h1>
        <p className="mt-3 text-base text-[#6B7280]">Rejoignez BÂTIZEN CI et lancez votre premier projet de construction.</p>
      </div>

      <form className="relative z-10 animate-fadeInUp stagger-2 mt-8 w-full max-w-sm space-y-4" onSubmit={handleRegister} aria-label="Formulaire d'inscription">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-2 block text-sm font-semibold text-[#111827]">{f.label}</span>
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[20px] bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
              <div className="relative flex h-[58px] items-center gap-3 rounded-[18px] bg-white/90 backdrop-blur-sm px-4 shadow-[0_4px_16px_rgba(16,24,40,0.08)] transition-all focus-within:ring-2 focus-within:ring-[#0B5FFF]/30 focus-within:shadow-[0_8px_24px_rgba(11,95,255,0.15)] border border-[#E7EBF5]">
                <f.icon size={20} className="shrink-0 text-[#0B5FFF]" aria-hidden />
                <input
                  value={form[f.key]}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  required
                  aria-label={f.label}
                  className="flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#6B7280]"
                />
              </div>
            </div>
          </label>
        ))}

        {/* Password Strength Indicator */}
        {form.password && passwordStrength && (
          <div className="space-y-2 rounded-[16px] bg-white/80 p-4 border border-[#E7EBF5] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111827]">Force du mot de passe</span>
              <span className={`text-xs font-bold ${passwordStrength.strength === 'weak' ? 'text-red-600' : passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                {getStrengthText(passwordStrength.strength)}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength.score ? getStrengthColor(passwordStrength.strength) : 'bg-gray-200'}`}
                />
              ))}
            </div>
            {passwordStrength.feedback.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordStrength.feedback.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <AlertCircle size={12} className="text-[#FF7A00]" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-[16px] bg-red-50 p-4 border border-red-200">
            <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-label="Créer mon compte"
          className="group relative mt-4 flex h-[62px] w-full items-center justify-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_16px_40px_rgba(11,95,255,0.4)] transition-all hover:shadow-[0_20px_48px_rgba(11,95,255,0.5)] active:scale-[0.97] disabled:opacity-60 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <div className="relative grid size-10 place-items-center rounded-full bg-white/20">
            <ArrowRight size={20} aria-hidden />
          </div>
          <span className="relative text-base font-black">{loading ? "Création en cours…" : "Créer mon compte"}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E7EBF5] to-transparent" />
          <span className="text-xs font-bold text-[#6B7280]">OU</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E7EBF5] to-transparent" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          aria-label="S'inscrire avec Google"
          className="group flex h-[56px] w-full items-center justify-center gap-3 rounded-[20px] border-2 border-[#E7EBF5] bg-white text-sm font-bold text-[#111827] transition-all hover:border-[#0B5FFF]/40 hover:shadow-[0_8px_24px_rgba(11,95,255,0.12)] active:scale-[0.97] disabled:opacity-60"
        >
          <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden className="transition-transform group-hover:scale-110"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          S&apos;inscrire avec Google
        </button>
      </form>

      <div className="relative z-10 mt-8 flex items-center justify-center gap-2 text-sm text-[#6B7280]">
        <Shield size={16} className="text-[#22C55E]" />
        <span>Vos données sont 100% sécurisées et cryptées</span>
      </div>

      <p className="relative z-10 mt-6 text-sm text-[#6B7280]">
        Déjà un compte ? <Link href="/login" className="font-black text-[#0B5FFF] hover:underline transition-colors">Se connecter →</Link>
      </p>
    </main>
    </BtpBackground>
  );
}
