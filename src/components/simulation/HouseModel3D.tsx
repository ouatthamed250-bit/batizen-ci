"use client";

import { useEffect, useRef } from "react";

interface HouseModel3DProps {
  style: "Moderne" | "Classique" | "Africain" | "Contemporain";
  etages: number;
  largeur: number;
  longueur: number;
}

export function HouseModel3D({ style, etages, largeur, longueur }: HouseModel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Couleurs selon le style
  const getColors = () => {
    switch (style) {
      case "Moderne":
        return { primary: "#0D2B6B", secondary: "#F5F5F5", accent: "#FF6B00" };
      case "Classique":
        return { primary: "#8B4513", secondary: "#FFFAF0", accent: "#D2691E" };
      case "Africain":
        return { primary: "#8B4513", secondary: "#D2691E", accent: "#F4A460" };
      case "Contemporain":
        return { primary: "#2F4F4F", secondary: "#E0E0E0", accent: "#708090" };
      default:
        return { primary: "#0D2B6B", secondary: "#F5F5F5", accent: "#FF6B00" };
    }
  };

  const colors = getColors();

  return (
    <div
      ref={containerRef}
      className="w-full h-64 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F7F9FC] to-white border border-[#E7EBF5]"
      style={{ perspective: "1000px" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(60deg) rotateZ(-45deg)" }}
      >
        {/* Corps de la maison */}
        <div
          className="relative"
          style={{
            width: `${Math.min(largeur * 3, 120)}px`,
            height: `${longueur * 3}px`,
            backgroundColor: colors.primary,
            boxShadow: `0 20px 40px rgba(0,0,0,0.2)`,
            transform: `translateZ(${etages * 20}px)`,
          }}
        >
          {/* Fenêtres */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute bg-[#87CEEB] border-2 border-white"
              style={{
                width: "20px",
                height: "25px",
                top: "30%",
                left: `${20 + i * 30}%`,
                transform: "translateZ(1px)",
                boxShadow: "inset 0 0 10px rgba(255,255,255,0.5)",
              }}
            />
          ))}

          {/* Porte */}
          <div
            className="absolute bg-[#8B4513] border-2 border-white"
            style={{
              width: "30px",
              height: "40px",
              bottom: "0",
              left: "50%",
              transform: "translateX(-50%) translateZ(1px)",
            }}
          />

          {/* Toit selon le style */}
          {style === "Moderne" || style === "Contemporain" ? (
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: `${Math.min(largeur * 2, 100)}px solid transparent`,
                borderRight: `${Math.min(largeur * 2, 100)}px solid transparent`,
                borderBottom: `40px solid ${colors.secondary}`,
              }}
            />
          ) : (
            <div
              className="absolute -top-4 left-0 right-0"
              style={{
                height: "20px",
                backgroundColor: colors.accent,
                transform: "translateZ(1px)",
              }}
            />
          )}
        </div>
      </div>

      {/* Label du style */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-xs font-bold text-[#6B7280]">{style}</p>
        <p className="text-[10px] text-[#9CA3AF]">{etages} étage{etages > 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}