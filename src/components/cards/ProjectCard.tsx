import Image from "next/image";
import Link from "next/link";
import type { BatizenProject } from "@/db/schema";
import { formatFcfa } from "@/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function ProjectCard({ project }: { project: BatizenProject }) {
  return (
    <PremiumCard className="overflow-hidden p-0">
      <Link
        href={`/projets/${project.slug ?? project.id}`}
        aria-label={`Voir le projet ${project.title}`}
        className="block"
      >
        <div className="relative h-52 overflow-hidden rounded-t-[26px]">
          <Image
            alt={project.title}
            className="object-cover transition-transform duration-500 hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            src={project.imageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute left-4 top-4">
            <Badge tone={project.status === "Chantier" ? "orange" : "blue"}>{project.status}</Badge>
          </div>
        </div>
      </Link>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black leading-tight text-[#111827]">{project.title}</h3>
            <p className="mt-1 text-sm font-semibold text-[#6B7280]">{project.city} · {project.type}</p>
          </div>
          <Badge tone={project.isShared ? "green" : "navy"}>{project.isShared ? "Partagé" : "Privé"}</Badge>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[18px] bg-[#F7F9FC] p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Surface</dt>
            <dd className="mt-1 font-black text-[#0D2B6B]">{project.surfaceM2} m²</dd>
          </div>
          <div className="rounded-[18px] bg-[#F7F9FC] p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Pièces</dt>
            <dd className="mt-1 font-black text-[#0D2B6B]">{project.rooms}</dd>
          </div>
          <div className="rounded-[18px] bg-[#F7F9FC] p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">Budget</dt>
            <dd className="mt-1 font-black text-[#0D2B6B]">{formatFcfa(project.budgetFcfa)}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <ProgressBar label="Avancement chantier" value={project.progress} />
        </div>
      </div>
    </PremiumCard>
  );
}
