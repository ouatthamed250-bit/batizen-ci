"use client";

import { useFirebaseQuery } from "./useFirebaseQuery";

export interface RenovationDemande {
  id: string;
  userId: string;
  lieu: string;
  surface: number;
  etages: number;
  distanceKm: number;
  transportGere: boolean;
  montantEstime: number;
  statut: string;
  createdAt: number;
}

export function useRenovationsQuery(userId: string | undefined) {
  return useFirebaseQuery<RenovationDemande[]>({
    queryKey: ["renovations", userId],
    dbPath: `demandesRenovation/${userId}`,
    enabled: !!userId,
    transform: (raw) => {
      if (!raw) return [];
      return Object.entries(raw).map(([id, data]) => ({ id, ...(data as object) } as RenovationDemande));
    },
  });
}