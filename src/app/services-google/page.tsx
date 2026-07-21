import { Cloud, Database, KeyRound } from "lucide-react";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Badge } from "@/components/ui/Badge";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { getGoogleServiceStatus } from "@/services/google";

const icons = [KeyRound, Database, Cloud];

export default function GoogleServicesPage() {
  const services = getGoogleServiceStatus();
  return (
    <ScreenWrapper>
      <PremiumHeader />
      <p className="font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Google & Firebase</p>
      <h1 className="mt-2 text-5xl font-black tracking-[-0.05em] text-[#111827]">Services implantés</h1>
      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {services.map((service, index) => {
          const Icon = icons[index] ?? Cloud;
          return (
            <PremiumCard key={service.label}>
              <Icon className="text-[#0B5FFF]" size={32} />
              <div className="mt-4"><Badge tone={service.enabled ? "green" : "orange"}>{service.enabled ? "Actif" : "À configurer"}</Badge></div>
              <h2 className="mt-4 text-2xl font-black text-[#0D2B6B]">{service.label}</h2>
              <p className="mt-2 text-[#6B7280]">{service.description}</p>
            </PremiumCard>
          );
        })}
      </div>
    </ScreenWrapper>
  );
}