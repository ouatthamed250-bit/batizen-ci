import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
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
      <PremiumHeader />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="animate-fadeInUp">
          <div className="mb-6 grid size-16 place-items-center rounded-[22px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_16px_34px_rgba(11,95,255,0.3)]">
            <Icon size={28} aria-hidden />
          </div>
          <h1 className="max-w-2xl text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#6B7280]">{subtitle}</p>
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
          <h2 className="text-xl font-black text-[#0D2B6B]">Fonctionnalités incluses</h2>
          <ul className="mt-5 space-y-3" aria-label="Liste des fonctionnalités">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-[18px] bg-white/70 p-4 text-[#111827]"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-[#0B5FFF]"
                  aria-hidden
                />
                <span className="text-sm font-semibold">{bullet}</span>
              </li>
            ))}
          </ul>
        </PremiumCard>
      </div>

      <WhatsAppButton />
      <BottomNav />
    </ScreenWrapper>
  );
}
