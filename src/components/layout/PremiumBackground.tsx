"use client";

import { type ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface PremiumBackgroundProps {
  children: ReactNode;
  imageUrl?: string;
  overlayClassName?: string;
}

// Images premium par défaut - chantiers et villas modernes
const DEFAULT_IMAGES = [
  "/images/villa-bg.jpg",
  "/images/chantier-bg.jpg",
  "/images/hero-bg.jpg",
  "/images/equipe-bg.jpg",
];

export default function PremiumBackground({ 
  children, 
  imageUrl, 
  overlayClassName 
}: PremiumBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Rotation des images selon l'heure — calculée après le premier affichage
  // pour éviter un décalage entre le serveur et le navigateur
  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => {
    setImageIndex(Math.floor(new Date().getHours() / 6) % DEFAULT_IMAGES.length);
  }, []);
  const bgImage = imageUrl || DEFAULT_IMAGES[imageIndex];

  return (
    <div className="relative min-h-screen">
      {/* Background image avec lazy loading */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src={bgImage}
          alt=""
          fill
          className={`object-cover transition-all duration-700 ${isDark ? "brightness-75 contrast-110" : ""}`}
          quality={85}
          priority={false}
          loading="lazy"
          unoptimized={false}
        />
        {/* Overlay glassmorphism adaptatif */}
        <div 
          className={`absolute inset-0 ${
            isDark 
              ? "bg-gradient-to-b from-[#081423]/95 via-[#081423]/80 to-[#081423]/95" 
          : "bg-gradient-to-b from-gray-100/92 via-gray-100/85 to-gray-100/92"
          } ${overlayClassName || ""}`}
        />
      </div>
      
      {/* Content avec glassmorphism */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}