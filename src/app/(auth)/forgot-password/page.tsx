"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { resetPassword } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("Aucun compte trouvé avec cet email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 pt-14">
      <div className="w-full max-w-sm">
        <Link href="/login" aria-label="Retour" className="mb-8 grid size-11 place-items-center rounded-[14px] bg-[#F7F9FC] text-[#111827] transition hover:bg-[#E7EBF5] active:scale-95">
          <ArrowLeft size={20} aria-hidden />
        </Link>
      </div>

      <Image src="/assets/images/logo.png" alt="BÂTIZEN CI" width={80} height={80} className="animate-bounceIn rounded-[24px] shadow-[0_20px_40px_rgba(11,95,255,0.15)]" />

      <div className="animate-fadeInUp mt-6 text-center">
        <h1 className="text-2xl font-black tracking-[-0.04em] text-[#0D2B6B]">Mot de passe oublié</h1>
        <p className="mx-auto mt-2 max-w-[260px] text-sm text-[#6B7280]">
          Entrez votre e-mail pour recevoir un lien de réinitialisation.
        </p>
      </div>

      {sent ? (
        <div className="animate-fadeInUp mt-8 w-full max-w-sm rounded-[24px] bg-green-50 p-6 text-center">
          <p className="text-base font-black text-green-700">Email envoyé ✓</p>
          <p className="mt-2 text-sm text-green-600">Vérifiez votre boîte mail et suivez le lien.</p>
          <Link href="/login" className="mt-4 inline-block font-black text-[#0B5FFF] hover:underline">← Retour à la connexion</Link>
        </div>
      ) : (
        <form className="mt-8 w-full max-w-sm animate-fadeInUp stagger-1" onSubmit={handleSubmit}>
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
                className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#6B7280]"
              />
            </div>
          </label>

          {error && <p className="mt-3 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white font-black shadow-[0_14px_36px_rgba(11,95,255,0.35)] transition-all active:scale-[0.97] disabled:opacity-60"
          >
            <Send size={18} aria-hidden />
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-[#6B7280]">
        <Link href="/login" className="font-black text-[#0B5FFF] hover:underline">← Retour à la connexion</Link>
      </p>
    </main>
  );
}
