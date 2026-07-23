"use client";

import { type ReactNode } from "react";

/**
 * FallbackBackground - Dégrade CSS local utilisé quand une image externe
 * ne peut pas être chargée, ou comme fond d'écran simple sans image.
 */
export function FallbackBackground({
  children,
  variant = "dark",
}: {
  children: ReactNode;
  variant?: "light" | "dark";
}) {
  return (
    <div
      className={
        variant === "dark"
          ? "min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
          : "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }
    >
      {children}
    </div>
  );
}