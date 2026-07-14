import { Badge } from "@/components/ui/Badge";
import type { GeneratedPlan } from "@/types/batizen";

type PlanPreview2DProps = {
  plan: GeneratedPlan;
};

export function PlanPreview2D({ plan }: PlanPreview2DProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#0D2B6B]">{plan.title}</h3>
          <p className="text-sm text-[#6B7280]">{plan.description}</p>
        </div>
        <Badge tone="orange">3D Gratuit</Badge>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-[#DDE9FF] bg-white shadow-[0_18px_40px_rgba(13,43,107,0.08)]">
        <div className="overflow-x-auto [&_svg]:w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: plan.svg }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] bg-[#F7F9FC] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">Surface construite</p>
          <p className="mt-1 text-2xl font-black text-[#0D2B6B]">{plan.totalBuiltAreaM2} m²</p>
        </div>
        <div className="rounded-[20px] bg-[#F7F9FC] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">Espaces générés</p>
          <p className="mt-1 text-2xl font-black text-[#0D2B6B]">{plan.estimatedRooms}</p>
        </div>
      </div>
      <div className="rounded-[22px] bg-[#FFF7EE] p-4 border border-[#FFE0C2]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF7A00]">Ce que le moteur a analysé</p>
        <ul className="mt-3 space-y-2">
          {plan.notes.map((note) => (
            <li className="flex gap-2 text-sm text-[#6B7280]" key={note}>
              <span className="mt-1 size-2 rounded-full bg-[#FF7A00]" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
