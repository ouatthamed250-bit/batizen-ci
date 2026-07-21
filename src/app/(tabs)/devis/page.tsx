import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { QuoteCard } from "@/components/cards/QuoteCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { getQuotes } from "@/services/batizen";
import { Calculator } from "lucide-react";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <ScreenWrapper>
      <PremiumHeader />

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Devis</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            Estimations transparentes
          </h1>
          <p className="mt-2 max-w-xl text-[#6B7280]">
            Chaque devis est traçable, validable et prêt pour le contrat.
          </p>
        </div>
        <PremiumButton href="/simulation" className="shrink-0">
          + Nouveau devis
        </PremiumButton>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid size-20 place-items-center rounded-[28px] bg-[#F7F9FC] text-[#6B7280]">
            <Calculator size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-[#0D2B6B]">Aucun devis pour l'instant</h2>
          <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
            Lancez une simulation pour générer votre premier devis.
          </p>
          <PremiumButton href="/simulation" className="mt-6 max-w-xs">
            Créer une simulation
          </PremiumButton>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {quotes.map((quote, i) => (
            <div
              key={quote.id}
              className="animate-fadeInUp"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <QuoteCard quote={quote} />
            </div>
          ))}
        </div>
      )}
    </ScreenWrapper>
  );
}