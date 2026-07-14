"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, Cpu, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0B5FFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-white px-6 pb-10 pt-16">
      {/* Background effects */}
      <div className="absolute -top-40 right-0 size-80 rounded-full bg-[#0B5FFF] opacity-[0.04] blur-[80px]" />
      <div className="absolute bottom-0 left-0 size-96 rounded-full bg-[#FF7A00] opacity-[0.04] blur-[100px]" />

      {/* Logo 3D */}
      <div className="animate-bounceIn relative">
        <Image src="/assets/images/logo.png" alt="BÂTIZEN CI" width={120} height={120} priority className="rounded-[32px] shadow-[0_24px_48px_rgba(11,95,255,0.18)]" />
      </div>

      {/* Titre */}
      <div className="animate-fadeInUp stagger-1 mt-6 text-center">
        <h1 className="text-3xl font-black tracking-[-0.05em]">
          <span className="text-[#0D2B6B]">BÂTIZEN</span>{" "}
          <span className="text-[#FF7A00]">CI</span>
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-px w-6 bg-[#0B5FFF]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B5FFF]">Construction Technology</span>
          <div className="h-px w-6 bg-[#0B5FFF]" />
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">🌍 Côte d&apos;Ivoire</p>
      </div>

      {/* Slogan */}
      <div className="animate-fadeInUp stagger-2 mt-8 text-center">
        <h2 className="text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-[#0D2B6B]">
          Construisons votre avenir,<br />
          <span className="text-[#FF7A00]">ensemble.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-[#6B7280]">
          La plateforme intelligente pour gérer vos projets de construction de A à Z.
        </p>
      </div>

      {/* Hero Image */}
      <div className="animate-fadeInUp stagger-3 relative mt-8 w-full max-w-sm overflow-hidden rounded-[28px]">
        <Image src="/assets/images/hero-villa.jpg" alt="Villa BÂTIZEN" width={1086} height={900} className="w-full object-cover rounded-[28px] shadow-[0_24px_48px_rgba(13,43,107,0.15)]" />
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-[#0D2B6B]/50 via-transparent to-transparent" />
      </div>

      {/* 4 Features */}
      <div className="animate-fadeInUp stagger-4 mt-8 grid w-full max-w-sm grid-cols-4 gap-2">
        {[
          { icon: Cpu, label: "Simulation\nintelligente", color: "#0B5FFF" },
          { icon: ClipboardCheck, label: "Gestion complète\nde chantier", color: "#FF7A00" },
          { icon: BarChart3, label: "Suivi en\ntemps réel", color: "#0B5FFF" },
          { icon: ShieldCheck, label: "Sécurité &\nconfiance", color: "#FF7A00" },
        ].map((f, i) => (
          <div key={f.label} className="flex flex-col items-center gap-2 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#F7F9FC]" style={{ color: f.color }}>
              <f.icon size={24} aria-hidden />
            </div>
            <span className="whitespace-pre-line text-[9px] font-bold leading-tight text-[#6B7280]">{f.label}</span>
            {i < 2 && <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-[#FF7A00]" />}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link href="/login" className="animate-fadeInUp stagger-5 mt-10 flex h-[62px] w-full max-w-sm items-center justify-center gap-3 rounded-[22px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_16px_40px_rgba(11,95,255,0.35)] transition-all active:scale-[0.97]">
        <div className="grid size-10 place-items-center rounded-full bg-white/20">
          <ArrowRight size={20} />
        </div>
        <span className="text-lg font-black tracking-tight">Commencer maintenant</span>
      </Link>

      {/* Security notice */}
      <div className="animate-fadeInUp stagger-6 mt-4 flex items-center gap-2 text-[#6B7280]">
        <ShieldCheck size={14} />
        <span className="text-[11px] font-bold">Vos données sont sécurisées</span>
      </div>

      {/* Dots pagination */}
      <div className="mt-6 flex gap-2">
        <div className="size-2 rounded-full bg-[#0B5FFF]" />
        <div className="size-2 rounded-full bg-[#E7EBF5]" />
        <div className="size-2 rounded-full bg-[#E7EBF5]" />
      </div>
    </main>
  );
}
