"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface PremiumBackgroundProps {
  children: ReactNode;
  imageUrl?: string;
  overlayClassName?: string;
}

// Images premium par défaut - chantiers et villas modernes
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1600584381426-93885c20958a?q=80&w=2070&auto=format&fit=crop", // Villa moderne
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop", // Chantier construction
  "https://images.unsplash.com/photo-1600607687949-ce7752b5c8f2?q=80&w=2070&auto=format&fit=crop", // Villa luxe
  "https://images.unsplash.com/photo-1600566847245-5a37b4891b3c?q=80&w=2070&auto=format&fit=crop", // Architecte
];

export default function PremiumBackground({ 
  children, 
  imageUrl, 
  overlayClassName 
}: PremiumBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Rotation des images selon l'heure pour varier l'expérience
  const imageIndex = Math.floor(new Date().getHours() / 6) % DEFAULT_IMAGES.length;
  const bgImage = imageUrl || DEFAULT_IMAGES[imageIndex];

  return (
    <div className="relative min-h-screen">
      {/* Background image avec lazy loading */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src={bgImage}
          alt="Background premium BÂTIZEN CI"
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
              : "bg-gradient-to-b from-white/90 via-white/60 to-white/85"
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