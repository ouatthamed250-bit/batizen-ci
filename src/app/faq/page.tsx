import { HelpCircle } from "lucide-react";
import faq from "@/data/faq.json";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";

export default function FaqPage() {
  return (
    <ScreenWrapper>
      <PremiumHeader />

      <div className="mb-8">
        <div className="mb-4 grid size-14 place-items-center rounded-[20px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-white shadow-[0_14px_30px_rgba(11,95,255,0.28)]">
          <HelpCircle size={26} aria-hidden />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Aide</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
          Questions fréquentes
        </h1>
        <p className="mt-2 text-[#6B7280]">Tout ce que vous devez savoir sur BÂTIZEN CI.</p>
      </div>

      <div className="space-y-3">
        {faq.map((item, i) => (
          <div
            key={item.question}
            className="animate-fadeInUp overflow-hidden rounded-[22px] border border-[#E7EBF5] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.05)] transition hover:border-[#0B5FFF]/20 hover:shadow-[0_8px_28px_rgba(11,95,255,0.08)]"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-4 p-5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#EAF2FF] text-xs font-black text-[#0B5FFF]">
                {i + 1}
              </span>
              <div>
                <h2 className="font-black text-[#0D2B6B]">{item.question}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScreenWrapper>
  );
}