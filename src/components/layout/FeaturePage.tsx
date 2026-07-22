"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

type FeaturePageProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bullets: string[];
  primaryHref?: string;
};

export function FeaturePage({ title, subtitle, icon: Icon, bullets, primaryHref = "/dashboard" }: FeaturePageProps) {
  return (
    <ScreenWrapper>
      {/* ✅ SUPPRIMÉ : PremiumHeader et BottomNav sont déjà gérés par LayoutWrapper */}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] px-2 pb-24 pt-4">
        <section className="animate-fadeInUp">
          <div className="mb-6 grid size-16 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_16px_34px_rgba(11,95,255,0.3)]">
            <Icon size={28} aria-hidden />
          </div>
          
          {/* ✅ CORRECTION VISUELLE : Textes adaptés au fond sombre (blanc / bleu clair) */}
          <h1 className="max-w-2xl text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-blue-100">{subtitle}</p>
          
          <div className="mt-8 flex flex-wrap gap-3">
            <PremiumButton href={primaryHref} className="shrink-0">
              Retour accueil
            </PremiumButton>
            <PremiumButton href="/support" variant="outline" className="shrink-0">
              Demander de l&apos;aide
            </PremiumButton>
          </div>
        </section>

        <PremiumCard variant="glass" className="animate-fadeInUp stagger-1 self-start">
          <h2 className="text-xl font-black text-white">Fonctionnalités incluses</h2>
          <ul className="mt-5 space-y-3" aria-label="Liste des fonctionnalités">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                // ✅ CORRECTION VISUELLE : Glassmorphism cohérent avec le reste de l'app
                className="flex items-start gap-3 rounded-[18px] bg-white/10 border border-white/20 p-4 text-blue-50 backdrop-blur-sm"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-[#22C55E]"
                  aria-hidden
                />
                <span className="text-sm font-semibold">{bullet}</span>
              </li>
            ))}
          </ul>
        </PremiumCard>
      </div>

      <WhatsAppButton />
      {/* ✅ SUPPRIMÉ : BottomNav est déjà dans LayoutWrapper */}
    </ScreenWrapper>
  );
}