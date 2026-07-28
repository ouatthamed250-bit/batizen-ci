"use client";

import { useEffect } from "react";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { database as db } from "@/lib/firebase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Chantier } from "@/types/chantier";

export function useChantiersQuery(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["chantiers", userId];

  useEffect(() => {
    if (!userId) return;
    const chantiersRef = ref(db, "chantiers");

    // Deux requêtes : une sur userId, une sur client_id (rétrocompatibilité)
    const qByUserId   = query(chantiersRef, orderByChild("userId"),     equalTo(userId));
    const qByClientId = query(chantiersRef, orderByChild("client_id"),  equalTo(userId));

    const results: Record<string, Chantier> = {};

    const mergeSnapshot = (snapshot: any) => {
      const raw = snapshot.val();
      if (!raw) return;
      Object.entries(raw).forEach(([id, data]: [string, any]) => {
        results[id] = { id, ...(data as object) } as Chantier;
      });
      const merged = Object.values(results).filter((c) => c.actif !== false);
      queryClient.setQueryData(queryKey, merged);
    };

    const unsub1 = onValue(qByUserId,   mergeSnapshot);
    const unsub2 = onValue(qByClientId, mergeSnapshot);

    return () => {
      unsub1();
      unsub2();
    };
  }, [userId, queryKey, queryClient]);

  return useQuery<Chantier[]>({
    queryKey,
    queryFn: () => queryClient.getQueryData<Chantier[]>(queryKey) ?? [],
    enabled: !!userId,
    staleTime: Infinity,
  });
}