"use client";

import { useTheme as useContextTheme } from "@/contexts/ThemeContext";

/**
 * Hook useTheme - Interface centralisée pour accéder au thème actuel
 * et basculer entre les modes clair et sombre.
 *
 * @returns {{ theme: 'light' | 'dark', toggleTheme: () => void }}
 */
export function useTheme() {
  return useContextTheme();
}