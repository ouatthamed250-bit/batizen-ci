import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { getProjects } from "@/services/batizen";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <ScreenWrapper>
      <PremiumHeader />

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Mes projets</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
            Suivi complet chantier
          </h1>
          <p className="mt-2 max-w-xl text-[#6B7280]">
            Tous vos projets, budgets, images et avancements centralisés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#EAF2FF] px-4 py-2 text-sm font-black text-[#0B5FFF]">
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </span>
          <PremiumButton href="/gestion-complete" className="shrink-0">
            + Nouveau
          </PremiumButton>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="grid size-20 place-items-center rounded-[28px] bg-[#F7F9FC] text-[#6B7280]">
            <FolderKanban size={36} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black text-[#0D2B6B]">Aucun projet pour l&apos;instant</h2>
          <p className="mt-2 max-w-xs text-sm text-[#6B7280]">
            Lancez votre premier projet de construction ou de rénovation.
          </p>
          <PremiumButton href="/gestion-complete" className="mt-6 max-w-xs">
            Créer mon premier projet
          </PremiumButton>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project, i) => (
            <div
              key={project.id}
              className="animate-fadeInUp"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </ScreenWrapper>
  );
}
