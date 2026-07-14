import type { BatizenQuote } from "@/db/schema";
import { Badge } from "@/components/ui/Badge";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { formatFcfa } from "@/utils/currency";

export function QuoteCard({ quote }: { quote: BatizenQuote }) {
  const isValid = quote.status === "Validé";

  return (
    <PremiumCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0B5FFF]">{quote.reference}</p>
          <h3 className="mt-1.5 text-xl font-black leading-tight text-[#111827]">{quote.label}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">Projet : {quote.projectSlug}</p>
        </div>
        <Badge tone={isValid ? "green" : "orange"}>{quote.status}</Badge>
      </div>

      <div className="mt-5 rounded-[22px] bg-[#F7F9FC] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">Montant estimé</p>
        <p className="mt-1.5 text-3xl font-black tracking-tight text-[#0D2B6B]">{formatFcfa(quote.amountFcfa)}</p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Valide jusqu&apos;au{" "}
          <span className="font-semibold text-[#111827]">{quote.validUntil}</span>
        </p>
      </div>
    </PremiumCard>
  );
}
