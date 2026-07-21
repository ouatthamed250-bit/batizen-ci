import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { getQuotes } from "@/services/batizen";
import { Calculator } from "lucide-react";
import BtpBackground from "@/components/btp/BtpBackground";
import { QuoteCard } from "@/components/cards/QuoteCard";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  const pageContent = (
    <div className="min-h-screen pt-24 pb-24 px-2">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 mx-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Devis</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
            Estimations transparentes
          </h1>
          <p className="mt-2 max-w-xl text-blue-100">
            Chaque devis est traçable, validable et prêt pour le contrat.
          </p>
        </div>
        <PremiumButton href="/simulation" className="shrink-0">
          + Nouveau devis
        </PremiumButton>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center mx-2">
          <div className="grid size-20 place-items-center rounded-[28px] bg-white/10 text-blue-200">
            <Calculator size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-white">Aucun devis pour l'instant</h2>
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Lancez une simulation pour générer votre premier devis.
          </p>
          <PremiumButton href="/simulation" className="mt-6 max-w-xs">
            Créer une simulation
          </PremiumButton>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 mx-2">
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
    </div>
  );

  return (
    <BtpBackground imageUrl="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2070&auto=format&fit=crop" overlay="medium">
      {pageContent}
    </BtpBackground>
  );
}
