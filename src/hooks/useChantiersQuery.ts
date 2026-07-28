"use client";

import { useFirebaseQuery } from "./useFirebaseQuery";
import type { Chantier } from "@/types/chantier";

export function useChantiersQuery(userId: string | undefined) {
  return useFirebaseQuery<Chantier[]>({
    queryKey: ["chantiers", userId],
    dbPath: "chantiers",
    enabled: !!userId,
    transform: (raw) => {
      if (!raw) return [];
      return Object.entries(raw)
        .filter(([_, c]: [string, any]) => c.actif !== false)
        .map(([id, data]) => ({ id, ...(data as object) } as Chantier));
    },
  });
}