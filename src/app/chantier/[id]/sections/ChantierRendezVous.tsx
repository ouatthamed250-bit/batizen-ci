"use client";

import { LockedTab } from "@/components/ui/LockedTab";
import ClientRendezVous from "@/components/chantier/ClientRendezVous";

interface ChantierRendezVousProps {
  id: string;
  isTabLocked: boolean;
}

export function ChantierRendezVous({ id, isTabLocked }: ChantierRendezVousProps) {
  if (isTabLocked) return <LockedTab />;
  return <ClientRendezVous chantierId={id} />;
}