"use client";

import { useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { useQuery, useQueryClient, QueryKey } from "@tanstack/react-query";
import { database as db } from "@/lib/firebase";

interface UseFirebaseQueryOptions<T> {
  queryKey: QueryKey;
  dbPath: string;
  enabled?: boolean;
  transform?: (data: unknown) => T;
}

export function useFirebaseQuery<T>({
  queryKey,
  dbPath,
  enabled = true,
  transform,
}: UseFirebaseQueryOptions<T>) {
  const queryClient = useQueryClient();

  // Subscription temps réel Firebase qui alimente le cache React Query
  useEffect(() => {
    if (!enabled) return;
    const dbRef = ref(db, dbPath);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const raw = snapshot.val();
      const data = transform ? transform(raw) : raw;
      queryClient.setQueryData(queryKey, data);
    });
    return () => unsubscribe();
  }, [dbPath, enabled, queryKey, queryClient, transform]);

  // Lecture depuis le cache React Query (jamais de fetch HTTP)
  return useQuery<T | null>({
    queryKey,
    queryFn: () => {
      // La donnée est déjà dans le cache via onValue ci-dessus
      return queryClient.getQueryData<T | null>(queryKey) ?? null;
    },
    enabled,
    staleTime: Infinity, // On gère le "frais" via onValue, pas via staleTime
  });
}